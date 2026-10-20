// GarageAI - API client
// Talks to the Node.js backend (garageai-backend), which in turn
// talks to the Python audio analysis microservice.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_STORAGE_KEY = 'garageai_token';

export interface ModelPrediction {
  model_name: string;
  predicted_class: string;
  confidence: number;
  all_probabilities?: Record<string, number>;
}

export interface AnalysisResponse {
  filename: string;
  final_prediction: string;
  final_confidence: number;
  all_probabilities?: Record<string, number>;
  individual_models: ModelPrediction[];
  processing_time_ms: number;
}

export interface PastAnalysis extends AnalysisResponse {
  id: number;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  maintenanceReminders: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// The audio analysis's own classification, when the chat is opened from an analysis
// result -- lets the diagnosis service ground on it directly instead of re-deriving the
// category from a semantic search over prose that merely describes the result.
export interface AudioResultContext {
  // Matches AnalysisResponse.final_prediction's type (a raw class-name string, e.g.
  // "belt") rather than a narrower union, since it's assigned directly from that field.
  predicted_class: string;
  confidence: number;
}

export type Severity = 'low' | 'medium' | 'high';

// The severity checklist's own result (severityForm.ts), when the chat is opened from it
// -- lets the diagnosis service build on an already-computed, rule-based severity instead
// of re-deriving (and risking contradicting) it via the LLM.
export interface SeverityFormResultContext {
  predicted_class: string;
  percent: number;
  level: Severity;
  positive_findings: string[];
}

export interface DiagnoseResponse {
  predicted_class: string | null;
  category_label: string | null;
  match_score: number;
  matched_phrases: string[];
  answer: string;
  severity: Severity | null;
  severity_reason: string | null;
  conversationId: number | null;
}

export interface ConversationSummary {
  id: number;
  preview: string;
  predicted_class: string | null;
  category_label: string | null;
  match_score: number | null;
  severity: Severity | null;
  severity_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(auth ? authHeaders() : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the GarageAI server. Make sure the backend is running.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }

  if (!response.ok) {
    const message =
      (data as { error?: string } | null)?.error || 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status);
  }

  return data as T;
}

/**
 * Sends an audio file (or recorded Blob) to the backend for analysis.
 * When the user is logged in, the backend also saves the result to their history.
 */
// Comfortably above the backend's own 60s predict timeout, so a slow-but-alive
// backend still gets to finish before the frontend gives up on it.
const ANALYZE_TIMEOUT_MS = 75_000;
// Used instead when an optional extraModel is requested -- must stay above the
// backend's own PREDICT_WITH_EXTRA_TIMEOUT_MS (garageai-backend/src/services/
// pythonService.js, currently 100s), which itself matches the Python service's
// PREDICT_TIMEOUT_SECONDS_WITH_EXTRA (~90s) for a per-request, on-demand-loaded
// AST/CLAP/PaSST/BEATs comparison model.
const ANALYZE_WITH_EXTRA_TIMEOUT_MS = 110_000;

export type ExtraModel = 'ast' | 'clap' | 'passt' | 'beats';

export async function analyzeAudio(
  file: File | Blob,
  filename = 'recording.webm',
  extraModel?: ExtraModel
): Promise<AnalysisResponse> {
  const formData = new FormData();
  // If it's a plain Blob (e.g. from MediaRecorder), give it a filename.
  formData.append('file', file, file instanceof File ? file.name : filename);
  if (extraModel) {
    formData.append('extra_model', extraModel);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    extraModel ? ANALYZE_WITH_EXTRA_TIMEOUT_MS : ANALYZE_TIMEOUT_MS
  );

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/audio/analyze`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError("Analysis is taking longer than expected and timed out. The server might be busy -- please try again.");
    }
    throw new ApiError('Could not reach the GarageAI server. Make sure the backend is running.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = 'Analysis failed. Please try again.';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore JSON parse errors, use default message
    }
    throw new ApiError(message, response.status);
  }

  return response.json();
}

// ---- Diagnose (RAG chat) ----

/**
 * Sends the full chat conversation so far and gets back a reply grounded in
 * the fault knowledge base. The backend re-derives which fault category applies
 * from the first user message, so the whole `messages` array must be resent
 * on every turn (the API is stateless). Pass back `conversationId` from the
 * previous reply to keep saving to the same conversation (logged-in users only
 * -- anonymous requests always come back with a null conversationId).
 */
export function diagnoseChat(
  messages: ChatMessage[],
  conversationId?: number | null,
  audioResult?: AudioResultContext | null,
  formResult?: SeverityFormResultContext | null
) {
  return request<DiagnoseResponse>('/api/v1/diagnose/text', {
    method: 'POST',
    body: {
      messages,
      conversationId: conversationId ?? undefined,
      audioResult: audioResult ?? undefined,
      formResult: formResult ?? undefined,
    },
    auth: true,
  });
}

export function getConversations() {
  return request<{ conversations: ConversationSummary[] }>('/api/v1/diagnose/conversations', {
    auth: true,
  });
}

export function getConversation(id: number) {
  return request<{ conversation: ConversationDetail }>(`/api/v1/diagnose/conversations/${id}`, {
    auth: true,
  });
}

export function deleteConversation(id: number) {
  return request<void>(`/api/v1/diagnose/conversations/${id}`, { method: 'DELETE', auth: true });
}

// ---- Auth ----

export function signup(name: string, email: string, password: string) {
  return request<{ token: string; user: User }>('/api/v1/auth/signup', {
    method: 'POST',
    body: { name, email, password },
  });
}

export function login(email: string, password: string) {
  return request<{ token: string; user: User }>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function fetchMe() {
  return request<{ user: User }>('/api/v1/auth/me', { auth: true });
}

export function logout() {
  return request<void>('/api/v1/auth/logout', { method: 'POST', auth: true });
}

export function forgotPassword(email: string) {
  return request<{ message: string }>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export function resetPassword(token: string, newPassword: string) {
  return request<{ message: string }>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
  });
}

// ---- Users ----

export function updateProfile(name: string, email: string) {
  return request<{ user: User }>('/api/v1/users/me', {
    method: 'PUT',
    body: { name, email },
    auth: true,
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ message: string }>('/api/v1/users/me/password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
    auth: true,
  });
}

export function deleteAccount() {
  return request<void>('/api/v1/users/me', { method: 'DELETE', auth: true });
}

export function getSettings() {
  return request<UserSettings>('/api/v1/users/me/settings', { auth: true });
}

export function updateSettings(settings: Partial<UserSettings>) {
  return request<UserSettings>('/api/v1/users/me/settings', {
    method: 'PUT',
    body: settings,
    auth: true,
  });
}

// ---- History ----

export function getHistory() {
  return request<{ analyses: PastAnalysis[] }>('/api/v1/history', { auth: true });
}

export function deleteHistoryItem(id: number) {
  return request<void>(`/api/v1/history/${id}`, { method: 'DELETE', auth: true });
}
