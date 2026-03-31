import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Shield, DollarSign, ThumbsUp, ThumbsDown, Loader2, Bot, User, Sparkles, RotateCcw } from "lucide-react";
import type { LabelData } from "@/components/MapView";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface NeighborhoodChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clickedLabel: LabelData | null;
  nearbyLabels: LabelData[];
  areaName: string;
}

const SUGGESTED_QUESTIONS = [
  "What's the vibe here at night?",
  "Best spots in this area?",
  "Is it safe for solo walking?",
];

const RATE_LIMIT = 15;
const RATE_LIMIT_KEY = "nt_chat_count";
const RATE_LIMIT_DATE_KEY = "nt_chat_date";

function getChatCount(): number {
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(RATE_LIMIT_DATE_KEY);
  if (storedDate !== today) {
    localStorage.setItem(RATE_LIMIT_DATE_KEY, today);
    localStorage.setItem(RATE_LIMIT_KEY, "0");
    return 0;
  }
  return parseInt(localStorage.getItem(RATE_LIMIT_KEY) || "0", 10);
}

function incrementChatCount() {
  const count = getChatCount();
  localStorage.setItem(RATE_LIMIT_KEY, String(count + 1));
}

function getScore(l: LabelData) {
  return l.upvotes - l.downvotes;
}

export function NeighborhoodChatDrawer({
  open,
  onOpenChange,
  clickedLabel,
  nearbyLabels,
  areaName,
}: NeighborhoodChatDrawerProps) {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sortedLabels = [...nearbyLabels].sort((a, b) => getScore(b) - getScore(a));

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Reset chat when drawer closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setShowChat(false);
        setMessages([]);
        setInput("");
        setError(null);
      }, 300);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      const count = getChatCount();
      if (count >= RATE_LIMIT) {
        setError(`Daily limit reached (${RATE_LIMIT} questions). Come back tomorrow!`);
        return;
      }

      setError(null);
      const userMsg: ChatMessage = { role: "user", content: question };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const conversationHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neighborhood-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              neighborhood_name: areaName,
              user_question: question,
              conversation_history: conversationHistory,
              lat: clickedLabel?.lat,
              lng: clickedLabel?.lng,
            }),
          }
        );

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed (${resp.status})`);
        }

        const data = await resp.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.ai_response },
        ]);
        incrementChatCount();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to get response");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, areaName, clickedLabel]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const dynamicSuggestions = [
    ...SUGGESTED_QUESTIONS,
    ...(clickedLabel ? [`Why is it called "${clickedLabel.text}"?`] : []),
  ];

  const remaining = RATE_LIMIT - getChatCount();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-lg font-bold">{areaName}</SheetTitle>
          {nearbyLabels.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {nearbyLabels.length} community labels nearby
            </p>
          )}
        </SheetHeader>

        {!showChat ? (
          /* ===== AREA OVERVIEW ===== */
          <ScrollArea className="flex-1 px-4 py-3">
            {/* Clicked label highlight */}
            {clickedLabel && (
              <div className="mb-4 p-3 rounded-lg bg-accent/50 border">
                <p className="font-semibold text-sm mb-1">{clickedLabel.text}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" /> {clickedLabel.safety}/5
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> {clickedLabel.cost}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> {clickedLabel.upvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3" /> {clickedLabel.downvotes}
                  </span>
                </div>
                {clickedLabel.vibe && clickedLabel.vibe.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {clickedLabel.vibe.map((v) => (
                      <Badge key={v} variant="secondary" className="text-[10px]">
                        {v}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Other nearby labels */}
            {sortedLabels.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Nearby Labels
                </h3>
                <div className="space-y-1.5">
                  {sortedLabels.slice(0, 10).map((l) => {
                    const score = getScore(l);
                    return (
                      <div
                        key={l.id}
                        className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-accent/30 transition-colors"
                      >
                        <span className="truncate flex-1 mr-2">{l.text}</span>
                        <span
                          className={`text-xs font-bold min-w-[32px] text-right ${
                            score > 0
                              ? "text-green-600"
                              : score < 0
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {score > 0 ? "+" : ""}
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat CTA */}
            <Button
              className="w-full gap-2 mt-2"
              size="lg"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="h-4 w-4" />
              💬 Ask about this area
            </Button>
          </ScrollArea>
        ) : (
          /* ===== CHAT INTERFACE ===== */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="text-center py-4">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                  <p className="text-sm font-medium text-foreground">
                    Ask me anything about {areaName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    I know about {nearbyLabels.length} community labels here
                  </p>
                  {/* Suggested questions */}
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {dynamicSuggestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 text-accent-foreground transition-colors border"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2 items-start">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-center text-xs text-destructive bg-destructive/10 rounded-lg p-2">
                  {error}
                </div>
              )}

              {/* Show suggestions after AI response */}
              {messages.length > 0 && !isLoading && messages[messages.length - 1]?.role === "assistant" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dynamicSuggestions
                    .filter((q) => !messages.some((m) => m.content === q))
                    .slice(0, 3)
                    .map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-accent/50 hover:bg-accent text-accent-foreground transition-colors border"
                      >
                        {q}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3 space-y-2">
              {/* Rate limit indicator */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {remaining > 0
                    ? `${remaining} questions remaining today`
                    : "Daily limit reached"}
                </p>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => {
                      setMessages([]);
                      setError(null);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    New chat
                  </Button>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this neighborhood..."
                  className="flex-1 text-sm"
                  disabled={isLoading || remaining <= 0}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading || remaining <= 0}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
