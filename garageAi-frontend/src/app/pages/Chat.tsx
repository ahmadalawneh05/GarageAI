import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Send, Loader2, Bot, User, AlertCircle, Plus, Trash2, Menu } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import {
  diagnoseChat,
  getConversation,
  getConversations,
  deleteConversation,
  ApiError,
  type AudioResultContext,
  type ChatMessage,
  type ConversationSummary,
  type Severity,
  type SeverityFormResultContext,
} from '../lib/api';
import { severityBadgeClass, severityLabel } from '../lib/severity';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
  'في صوت صفير من قدام السيارة وقت التشغيل، وبزيد لما بسرع',
  'البريك عم يصرخ كل ما بفرمل، وحاسس الدواسة طرية',
  'في صوت خبط من تحت السيارة كل ما بفوت عالمطب',
];

export function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('id');
  const seedState = location.state as {
    seedMessage?: string;
    audioResult?: AudioResultContext;
    formResult?: SeverityFormResultContext;
  } | null;
  const seedMessage = seedState?.seedMessage;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(
    conversationIdParam ? Number(conversationIdParam) : null
  );
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(!!conversationIdParam);
  const [error, setError] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // The latest severity verdict for this conversation -- once the assistant reaches one,
  // it sticks around across later turns (e.g. a follow-up about cost) instead of
  // disappearing just because that turn's reply didn't repeat it.
  const [severity, setSeverity] = useState<{ level: Severity; reason: string | null } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seededRef = useRef(false);
  // Kept for the lifetime of this conversation (not just the seeding turn) so later
  // turns can still ground on it -- the diagnose endpoint is stateless per request.
  const audioResultRef = useRef<AudioResultContext | null>(seedState?.audioResult ?? null);
  const formResultRef = useRef<SeverityFormResultContext | null>(seedState?.formResult ?? null);

  useEffect(() => {
    // Deferred a frame: the severity/error banners below the scroll area mount in the
    // same render as the new message and shrink its height, so scrolling immediately
    // (before that layout settles) leaves the last message's bottom clipped behind them.
    const raf = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, isSending, severity, error]);

  // Keep the input focused so you can keep typing without reaching for the mouse.
  useEffect(() => {
    if (!isSending && !isLoadingConversation) {
      textareaRef.current?.focus();
    }
  }, [isSending, isLoadingConversation]);

  const refreshConversations = () => {
    if (!user) return;
    setIsLoadingConversations(true);
    getConversations()
      .then(({ conversations }) => setConversations(conversations))
      .catch(() => {})
      .finally(() => setIsLoadingConversations(false));
  };

  // The sidebar list of past conversations -- lives right here on the Chat
  // page instead of being buried in the separate History page.
  useEffect(() => {
    refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load a past conversation when arriving via /chat?id=123.
  useEffect(() => {
    if (!conversationIdParam) return;

    let cancelled = false;
    setIsLoadingConversation(true);
    setError(null);

    getConversation(Number(conversationIdParam))
      .then(({ conversation }) => {
        if (cancelled) return;
        setMessages(conversation.messages);
        setConversationId(conversation.id);
        audioResultRef.current = null;
        formResultRef.current = null;
        setSeverity(conversation.severity ? { level: conversation.severity, reason: conversation.severity_reason } : null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'ما قدرنا نجيب هاي المحادثة.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingConversation(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationIdParam]);

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    audioResultRef.current = null;
    formResultRef.current = null;
    setSeverity(null);
    setSearchParams({}, { replace: true });
    setIsSidebarOpen(false);
  };

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const response = await diagnoseChat(nextMessages, conversationId, audioResultRef.current, formResultRef.current);
      setMessages([...nextMessages, { role: 'assistant', content: response.answer }]);
      if (response.severity) {
        setSeverity({ level: response.severity, reason: response.severity_reason });
      }
      if (response.conversationId && response.conversationId !== conversationId) {
        setConversationId(response.conversationId);
        setSearchParams({ id: String(response.conversationId) }, { replace: true });
      }
      refreshConversations();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'ما قدرنا نوصل لسيرفر GarageAI. تأكد إنه شغال وجرب كمان مرة.';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  // Arriving from "Ask GarageAI about this" on the Home page's result card --
  // opens a brand new conversation seeded with a question about that diagnosis.
  useEffect(() => {
    if (seedMessage && !seededRef.current) {
      seededRef.current = true;
      navigate(location.pathname, { replace: true }); // consume the one-time seed from history state
      sendMessage(seedMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openConversation = (id: number) => {
    setIsSidebarOpen(false);
    if (id === conversationId) return;
    setSearchParams({ id: String(id) });
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === conversationId) startNewChat();
    } catch {
      // leave it in place if deletion failed
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const conversationList: ReactNode = (
    <>
      <div className="p-3 border-b">
        <Button onClick={startNewChat} variant="outline" size="sm" className="w-full gap-2 rounded-lg">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {isLoadingConversations ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-2">
              ولا محادثة لسا. ابعت أول سؤال تشوفها هون.
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openConversation(c.id)}
                className={`w-full text-right rounded-lg px-3 py-2 text-sm transition-colors group relative ${
                  c.id === conversationId ? 'bg-secondary' : 'hover:bg-muted'
                }`}
              >
                <p dir="rtl" className="truncate pl-6">
                  {c.preview}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex gap-4">
        {/* Conversations sidebar -- kept next to the chat itself, not off in History */}
        {user && (
          <Card className="hidden md:flex md:flex-col w-64 shrink-0 border-2 h-[calc(100vh-8rem)] p-0 gap-0">
            {conversationList}
          </Card>
        )}

        {/* Mobile: same conversation list, opened from the header button as a slide-over */}
        {user && (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="right" className="p-0 gap-0 w-72 flex flex-col">
              <SheetHeader className="border-b p-3">
                <SheetTitle dir="rtl" className="text-right">
                  المحادثات
                </SheetTitle>
              </SheetHeader>
              {conversationList}
            </SheetContent>
          </Sheet>
        )}

        <Card className="flex-1 max-w-2xl shadow-xl border-2 flex flex-col h-[calc(100vh-8rem)]">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 shrink-0"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open conversations"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Ask GarageAI
                  </CardTitle>
                  <CardDescription>
                    Describe your car's problem in your own words (Arabic dialect works great) and get
                    an initial diagnosis.
                  </CardDescription>
                </div>
              </div>
              {(messages.length > 0 || conversationId) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 shrink-0 md:hidden"
                  onClick={startNewChat}
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col p-0">
            <ScrollArea className="flex-1 min-h-0 px-6 py-4">
              {isLoadingConversation ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground max-w-sm">
                    Describe your car's problem below, or try one of these:
                  </p>
                  <div className="flex flex-col gap-2 items-stretch w-full max-w-sm">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => sendMessage(s)}
                        dir="rtl"
                        className="text-sm text-right px-4 py-2 rounded-xl bg-muted hover:bg-muted/70 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`flex items-start gap-2 max-w-[85%] ${
                          m.role === 'user' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div
                          className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                            m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}
                        >
                          {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div
                          dir="rtl"
                          className={`rounded-2xl px-4 py-2.5 text-right whitespace-pre-wrap break-words ${
                            m.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted rounded-tl-sm'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2 max-w-[85%]">
                        <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-muted flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground" dir="rtl">
                            عم يفكر...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={bottomRef} />
            </ScrollArea>

            {severity && (
              <div dir="rtl" className="mx-6 mb-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-sm">
                <Badge className={`${severityBadgeClass(severity.level)} border shrink-0`}>
                  {severityLabel(severity.level)}
                </Badge>
                {severity.reason && <span className="text-muted-foreground truncate">{severity.reason}</span>}
              </div>
            )}

            {error && (
              <div className="mx-6 mb-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="border-t p-4 flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب وصف العطل هون..."
                dir="rtl"
                className="text-right min-h-11 max-h-32"
                disabled={isSending || isLoadingConversation}
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-xl h-11 w-11 shrink-0"
                disabled={isSending || isLoadingConversation || !input.trim()}
                aria-label="Send"
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
