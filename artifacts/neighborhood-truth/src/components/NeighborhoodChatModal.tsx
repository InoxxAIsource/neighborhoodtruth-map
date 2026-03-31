import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { LabelData } from "./MapView";

const RATE_LIMIT_KEY = "nt_chat_limit";
const DAILY_LIMIT = 5;
const RADIUS = 0.03;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RateLimitData {
  count: number;
  date: string;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getRateLimit(): RateLimitData {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { count: 0, date: getTodayStr() };
    const parsed: RateLimitData = JSON.parse(raw);
    if (parsed.date !== getTodayStr()) return { count: 0, date: getTodayStr() };
    return parsed;
  } catch {
    return { count: 0, date: getTodayStr() };
  }
}

function setRateLimit(data: RateLimitData) {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
}

function getNearbyLabels(allLabels: LabelData[], clickedLabel: LabelData): LabelData[] {
  return allLabels
    .filter((l) => {
      if (l.id === clickedLabel.id) return false;
      const dist = Math.sqrt((l.lat - clickedLabel.lat) ** 2 + (l.lng - clickedLabel.lng) ** 2);
      return dist <= RADIUS;
    })
    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
    .slice(0, 20);
}

const SUGGESTED_QUESTIONS = [
  "What's the vibe here?",
  "Is it safe at night?",
  "Best spots nearby?",
  "What's the cost of living like?",
  "Good for families?",
  "Nightlife scene?",
];

const CATEGORY_COLORS: Record<string, string> = {
  hipster: "#8b5cf6",
  tourist: "#f59e0b",
  wealthy: "#22c55e",
  gentrified: "#3b82f6",
  unsafe: "#ef4444",
  suits: "#6b7280",
  university: "#ec4899",
};

interface NeighborhoodChatModalProps {
  label: LabelData | null;
  allLabels: LabelData[];
  onClose: () => void;
  apiBase: string;
}

export function NeighborhoodChatModal({ label, allLabels, onClose, apiBase }: NeighborhoodChatModalProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const [rateLimitData, setRateLimitDataState] = useState<RateLimitData>(() => getRateLimit());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const nearbyLabels = label ? getNearbyLabels(allLabels, label) : [];
  const remaining = DAILY_LIMIT - rateLimitData.count;
  const isLimited = remaining <= 0;

  useEffect(() => {
    if (label) {
      setChatOpen(false);
      setMessages([]);
      setInput("");
      setError(null);
      setLastFailedQuestion(null);
      setStreamingContent("");
      setRateLimitDataState(getRateLimit());
    }
  }, [label]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatOpen]);

  const sendMessage = useCallback(async (question: string, fromRetry = false) => {
    if (!label || !question.trim() || isStreaming || isLimited) return;

    const trimmed = question.trim();

    if (!fromRetry) {
      const newLimit = { count: rateLimitData.count + 1, date: getTodayStr() };
      setRateLimit(newLimit);
      setRateLimitDataState(newLimit);
    }

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const historyBeforeQuestion = messages;
    setMessages([...historyBeforeQuestion, userMessage]);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    setError(null);
    setLastFailedQuestion(null);

    abortRef.current = new AbortController();

    let accumulated = "";
    let sseBuffer = "";

    try {
      const res = await fetch(`${apiBase}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labelId: label.id,
          question: trimmed,
          conversationHistory: historyBeforeQuestion,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`AI request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      const processLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) return;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.done) return;
          if (parsed.content) {
            accumulated += parsed.content;
            setStreamingContent(accumulated);
          }
        } catch (parseErr) {
          const msg = (parseErr as Error).message;
          if (msg !== "Unexpected end of JSON input") throw parseErr;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          processLine(line);
        }
      }

      if (sseBuffer) {
        processLine(sseBuffer);
      }

      setMessages((prev) => [...prev.slice(0, -1), userMessage, { role: "assistant", content: accumulated }]);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const errMsg = (err as Error).message || "Something went wrong. Please try again.";
      setError(errMsg);
      setLastFailedQuestion(trimmed);
      setMessages(historyBeforeQuestion);
      if (!fromRetry) {
        const restored = { count: rateLimitData.count, date: getTodayStr() };
        setRateLimit(restored);
        setRateLimitDataState(restored);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  }, [label, messages, isStreaming, isLimited, apiBase, rateLimitData.count]);

  if (!label) return null;

  const score = label.upvotes - label.downvotes;
  const categoryColor = label.category ? (CATEGORY_COLORS[label.category] ?? "#6b7280") : "#6b7280";

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center"
      style={{ backdropFilter: "blur(2px)", backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b rounded-t-2xl sm:rounded-t-2xl"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-5 w-5 text-white flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{label.text}</p>
              <p className="text-purple-200 text-xs">AI Neighborhood Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-full p-1 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Label details */}
          <div className="px-5 py-4 border-b bg-gray-50">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ color: i < label.safety ? "#facc15" : "#e5e7eb", fontSize: 16 }}>★</span>
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{label.cost}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: score > 0 ? "#dcfce7" : score < 0 ? "#fee2e2" : "#f3f4f6", color: score > 0 ? "#166534" : score < 0 ? "#991b1b" : "#374151" }}
              >
                {score > 0 ? "+" : ""}{score}
              </span>
              {label.category && (
                <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: categoryColor }}>
                  {label.category}
                </span>
              )}
            </div>

            {label.vibe && label.vibe.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {label.vibe.map((v) => (
                  <span key={v} className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5">{v}</span>
                ))}
              </div>
            )}

            {nearbyLabels.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">
                  {nearbyLabels.length} more insight{nearbyLabels.length !== 1 ? "s" : ""} nearby
                </p>
                <div className="flex flex-wrap gap-1">
                  {nearbyLabels.slice(0, 8).map((l) => {
                    const s = l.upvotes - l.downvotes;
                    return (
                      <span
                        key={l.id}
                        className="text-xs rounded-md px-2 py-1 font-medium border"
                        style={{
                          background: s > 2 ? "#f0fdf4" : s < -2 ? "#fef2f2" : "#f9fafb",
                          borderColor: s > 2 ? "#86efac" : s < -2 ? "#fca5a5" : "#e5e7eb",
                          color: s > 2 ? "#166534" : s < -2 ? "#991b1b" : "#374151",
                        }}
                      >
                        {l.text}
                      </span>
                    );
                  })}
                  {nearbyLabels.length > 8 && (
                    <span className="text-xs text-gray-400 py-1">+{nearbyLabels.length - 8} more</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Chat section */}
          <div className="px-5 py-3">
            <button
              onClick={() => setChatOpen((p) => !p)}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                <Sparkles className="h-4 w-4" />
                Ask AI about this neighborhood
              </span>
              {chatOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {chatOpen && (
              <div className="mt-2">
                {isLimited ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center mb-3">
                    <p className="text-sm font-semibold text-amber-800">Daily limit reached</p>
                    <p className="text-xs text-amber-600 mt-1">
                      You've used all {DAILY_LIMIT} AI questions for today. Come back tomorrow!
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-2">
                    {remaining} of {DAILY_LIMIT} questions remaining today
                  </p>
                )}

                {messages.length === 0 && !isLimited && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        disabled={isStreaming}
                        className="text-xs px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {messages.length > 0 && (
                  <div className="space-y-3 mb-3 max-h-64 overflow-y-auto pr-1">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className="rounded-2xl px-4 py-2.5 text-sm max-w-[85%] leading-relaxed"
                          style={
                            msg.role === "user"
                              ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", borderBottomRightRadius: 4 }
                              : { background: "#f3f4f6", color: "#111827", borderBottomLeftRadius: 4 }
                          }
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {isStreaming && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-4 py-2.5 text-sm max-w-[85%] leading-relaxed bg-gray-100 text-gray-900" style={{ borderBottomLeftRadius: 4 }}>
                          {streamingContent || (
                            <span className="flex items-center gap-1">
                              <span className="animate-bounce inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animationDelay: "0ms" }} />
                              <span className="animate-bounce inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animationDelay: "150ms" }} />
                              <span className="animate-bounce inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animationDelay: "300ms" }} />
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {error && !isStreaming && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-4 py-2.5 text-sm max-w-[85%] bg-red-50 text-red-700 border border-red-200" style={{ borderBottomLeftRadius: 4 }}>
                          <p>{error}</p>
                          <div className="flex gap-3 mt-2">
                            {lastFailedQuestion && (
                              <button
                                onClick={() => sendMessage(lastFailedQuestion, true)}
                                className="text-xs text-red-600 font-semibold underline"
                              >
                                Try again
                              </button>
                            )}
                            <button
                              onClick={() => { setError(null); setLastFailedQuestion(null); }}
                              className="text-xs text-red-400 underline"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}

                {!isLimited && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                    className="flex gap-2 items-center"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about this neighborhood..."
                      disabled={isStreaming}
                      maxLength={500}
                      className="flex-1 text-sm rounded-full border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent disabled:opacity-50 bg-gray-50"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isStreaming}
                      className="flex-shrink-0 rounded-full p-2 text-white disabled:opacity-40 transition-opacity"
                      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
