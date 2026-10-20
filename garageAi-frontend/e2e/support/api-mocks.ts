import type { Page, Route } from '@playwright/test';

const FAKE_USER = { id: 1, name: 'Test User', email: 'test@example.com' };
const FAKE_TOKEN = 'fake-token-for-e2e';

/** Fulfils a route with a JSON body and the given status. */
async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

/**
 * Logs a fake user in before the app boots, so pages that require auth
 * (or branch on it, like the Chat sidebar) render their logged-in state
 * without needing a real backend.
 */
export async function mockLoggedIn(page: Page) {
  await page.addInitScript((token) => {
    window.localStorage.setItem('garageai_token', token);
  }, FAKE_TOKEN);

  await page.route('**/api/v1/auth/me', (route) => json(route, { user: FAKE_USER }));
}

export async function mockConversations(page: Page, conversations: unknown[] = []) {
  await page.route('**/api/v1/diagnose/conversations', (route) => {
    if (route.request().method() === 'GET') {
      return json(route, { conversations });
    }
    return route.continue();
  });
}

export async function mockDiagnoseReply(page: Page, answer: string, conversationId = 42) {
  await page.route('**/api/v1/diagnose/text', (route) =>
    json(route, {
      predicted_class: '02_serpentine_belt',
      category_label: 'Serpentine belt',
      match_score: 0.91,
      matched_phrases: [],
      answer,
      conversationId,
    })
  );
}

export async function mockAnalyzeAudio(page: Page) {
  await page.route('**/api/v1/audio/analyze', (route) =>
    json(route, {
      filename: 'test.wav',
      final_prediction: '03_brake_squeal',
      final_confidence: 0.87,
      individual_models: [{ model_name: 'ensemble', predicted_class: '03_brake_squeal', confidence: 0.87 }],
      processing_time_ms: 123,
    })
  );
}

export { FAKE_USER, FAKE_TOKEN };
