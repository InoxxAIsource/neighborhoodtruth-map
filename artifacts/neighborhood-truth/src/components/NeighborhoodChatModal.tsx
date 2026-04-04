import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { X, Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { LabelData } from "./MapView";
import { ProUpsellModal } from "./ProUpsellModal";

// --- Simple markdown renderer (no external deps) ---
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="bg-gray-100 text-gray-800 rounded px-1 text-[11px]">{part.slice(1, -1)}</code>;
    return part;
  });
}

function MarkdownMessage({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter(Boolean);
        if (!lines.length) return null;

        // Heading
        const hMatch = lines[0].match(/^#{1,3}\s+(.+)/);
        if (hMatch)
          return <p key={bi} className="font-bold text-gray-900 mt-0.5">{renderInline(hMatch[1])}</p>;

        // Bullet list
        const isList = lines.every((l) => /^[-•*]\s/.test(l));
        if (isList)
          return (
            <ul key={bi} className="space-y-0.5 pl-0">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-1.5">
                  <span className="text-gray-400 flex-shrink-0 mt-0.5">•</span>
                  <span>{renderInline(l.replace(/^[-•*]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );

        // Numbered list
        const isNumbered = lines.every((l) => /^\d+[.)]\s/.test(l));
        if (isNumbered)
          return (
            <ol key={bi} className="space-y-0.5 pl-0">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-1.5">
                  <span className="text-gray-400 flex-shrink-0 font-semibold">{li + 1}.</span>
                  <span>{renderInline(l.replace(/^\d+[.)]\s+/, ""))}</span>
                </li>
              ))}
            </ol>
          );

        // Paragraph (may have inline line breaks)
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <span key={li}>{li > 0 && <br />}{renderInline(l)}</span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

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

interface CostItem {
  label: string;
  emoji: string;
  range: string;
}

interface CostData {
  city: string;
  currency: string;
  costLevel: string;
  items: CostItem[];
}

interface TransportMode {
  mode: string;
  emoji: string;
  costRange: string;
  timeMin: number;
}

interface TransportResult {
  fromCity: string;
  currency: string;
  distanceKm: number;
  modes: TransportMode[];
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
  "How much is rent here?",
  "Good for expats?",
  "What's it like for families?",
  "How's the nightlife?",
  "Best cafes & restaurants nearby?",
  "How well-connected is the transit?",
];

const INDIA_QUESTIONS = [
  "Good for working women?",
  "Traffic during office hours?",
  "Nearby PGs or hostels?",
  "Is it well-connected by metro?",
  "How's water & electricity supply?",
  "Safe for solo women at night?",
];

function isInIndia(lat: number, lng: number): boolean {
  return lat >= 8 && lat <= 37 && lng >= 68 && lng <= 97;
}

function getSuggestedQuestions(lat: number, lng: number): string[] {
  if (isInIndia(lat, lng)) {
    return [
      "What's the vibe here?",
      "Is it safe at night?",
      "How much is rent here?",
      ...INDIA_QUESTIONS,
    ];
  }
  return SUGGESTED_QUESTIONS;
}

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
  onVote?: (labelId: string, voteType: "upvote" | "downvote") => void;
  myVotes?: { labelId: string; voteType: string }[];
}

export function NeighborhoodChatModal({ label, allLabels, onClose, apiBase, onVote, myVotes }: NeighborhoodChatModalProps) {
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const [rateLimitData, setRateLimitDataState] = useState<RateLimitData>(() => getRateLimit());
  const [localVotes, setLocalVotes] = useState<Record<string, { upvotes: number; downvotes: number; voted?: "upvote" | "downvote" }>>({});
  const [showProModal, setShowProModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [costData, setCostData] = useState<CostData | null>(null);
  const [costLoading, setCostLoading] = useState(false);

  const [transportOpen, setTransportOpen] = useState(false);
  const [transportDest, setTransportDest] = useState<LabelData | null>(null);
  const [transportResult, setTransportResult] = useState<TransportResult | null>(null);
  const [transportLoading, setTransportLoading] = useState(false);
  const [transportError, setTransportError] = useState<string | null>(null);

  const handleVote = useCallback((targetLabel: LabelData, voteType: "upvote" | "downvote") => {
    const existingPersisted = myVotes?.find((v) => v.labelId === targetLabel.id);
    const existingLocal = localVotes[targetLabel.id];
    if (existingPersisted || existingLocal?.voted) return;
    setLocalVotes((prev) => ({
      ...prev,
      [targetLabel.id]: {
        upvotes: (prev[targetLabel.id]?.upvotes ?? targetLabel.upvotes) + (voteType === "upvote" ? 1 : 0),
        downvotes: (prev[targetLabel.id]?.downvotes ?? targetLabel.downvotes) + (voteType === "downvote" ? 1 : 0),
        voted: voteType,
      },
    }));
    onVote?.(targetLabel.id, voteType);
  }, [localVotes, myVotes, onVote]);

  const nearbyLabels = label ? getNearbyLabels(allLabels, label) : [];
  const remaining = DAILY_LIMIT - rateLimitData.count;
  const isLimited = remaining <= 0;

  useEffect(() => {
    if (label) {
      abortRef.current?.abort();
      setChatOpen(true);
      setMessages([]);
      setInput("");
      setError(null);
      setLastFailedQuestion(null);
      setStreamingContent("");
      setRateLimitDataState(getRateLimit());
      setCostData(null);
      setTransportOpen(false);
      setTransportDest(null);
      setTransportResult(null);
      setTransportError(null);

      setCostLoading(true);
      fetch(`${apiBase}/labels/${label.id}/cost-intelligence`)
        .then((r) => r.ok ? r.json() : null)
        .then((data: CostData | null) => { setCostData(data); })
        .catch(() => { setCostData(null); })
        .finally(() => setCostLoading(false));
    }
  }, [label, apiBase]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (chatOpen) {
      if (isLimited) {
        setShowProModal(true);
      } else {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [chatOpen]);

  const handleTransportDest = useCallback(async (dest: LabelData) => {
    if (!label) return;
    setTransportDest(dest);
    setTransportResult(null);
    setTransportError(null);
    setTransportLoading(true);
    try {
      const params = new URLSearchParams({
        from_lat: String(label.lat),
        from_lng: String(label.lng),
        to_lat: String(dest.lat),
        to_lng: String(dest.lng),
      });
      const res = await fetch(`${apiBase}/transport/estimate?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data: TransportResult = await res.json();
      setTransportResult(data);
    } catch {
      setTransportError("Could not estimate for this route.");
    } finally {
      setTransportLoading(false);
    }
  }, [label, apiBase]);

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

    // Build cost context string to inject into system prompt
    const costContext = costData
      ? `City: ${costData.city} | Cost level: ${costData.costLevel}\n` +
        costData.items.map((it) => `${it.emoji} ${it.label}: ${it.range}`).join(" | ")
      : undefined;

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
          costContext,
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
  }, [label, messages, isStreaming, isLimited, apiBase, rateLimitData.count, costData]);

  if (!label) return null;

  const getLabelVoteState = (l: LabelData) => {
    const persisted = myVotes?.find((v) => v.labelId === l.id);
    const local = localVotes[l.id];
    const voted = local?.voted ?? (persisted?.voteType as "upvote" | "downvote" | undefined);
    const upvotes = local?.upvotes ?? l.upvotes;
    const downvotes = local?.downvotes ?? l.downvotes;
    const hasVoted = !!voted;
    return { voted, upvotes, downvotes, hasVoted };
  };

  const categoryColor = label.category ? (CATEGORY_COLORS[label.category] ?? "#6b7280") : "#6b7280";
  const focusedVote = getLabelVoteState(label);

  return (
    <>
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
                style={{ background: focusedVote.upvotes - focusedVote.downvotes > 0 ? "#dcfce7" : focusedVote.upvotes - focusedVote.downvotes < 0 ? "#fee2e2" : "#f3f4f6", color: focusedVote.upvotes - focusedVote.downvotes > 0 ? "#166534" : focusedVote.upvotes - focusedVote.downvotes < 0 ? "#991b1b" : "#374151" }}
              >
                {focusedVote.upvotes - focusedVote.downvotes > 0 ? "+" : ""}{focusedVote.upvotes - focusedVote.downvotes}
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

            {/* Vote buttons for focused label */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => handleVote(label, "upvote")}
                disabled={focusedVote.hasVoted}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:cursor-default"
                style={{
                  background: focusedVote.voted === "upvote" ? "#dcfce7" : "#f9fafb",
                  borderColor: focusedVote.voted === "upvote" ? "#86efac" : "#d1d5db",
                  color: focusedVote.voted === "upvote" ? "#166534" : "#374151",
                  opacity: focusedVote.hasVoted && focusedVote.voted !== "upvote" ? 0.5 : 1,
                }}
              >
                👍 <span className="font-bold">{focusedVote.upvotes}</span>
              </button>
              <button
                onClick={() => handleVote(label, "downvote")}
                disabled={focusedVote.hasVoted}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:cursor-default"
                style={{
                  background: focusedVote.voted === "downvote" ? "#fee2e2" : "#f9fafb",
                  borderColor: focusedVote.voted === "downvote" ? "#fca5a5" : "#d1d5db",
                  color: focusedVote.voted === "downvote" ? "#991b1b" : "#374151",
                  opacity: focusedVote.hasVoted && focusedVote.voted !== "downvote" ? 0.5 : 1,
                }}
              >
                👎 <span className="font-bold">{focusedVote.downvotes}</span>
              </button>
              {focusedVote.hasVoted && (
                <span className="text-xs text-gray-400">Voted!</span>
              )}
            </div>

            {/* 💰 Local Costs panel */}
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 mb-3">
              <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wide mb-1.5">💰 Local Costs</p>
              {costLoading ? (
                <div className="grid grid-cols-2 gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <>
                      <div key={`a${i}`} className="animate-pulse h-3.5 bg-amber-200 rounded" />
                      <div key={`b${i}`} className="animate-pulse h-3.5 bg-amber-200 rounded" />
                    </>
                  ))}
                </div>
              ) : costData ? (
                <>
                  <p className="text-[10px] text-amber-700 mb-1.5">{costData.city} · {costData.costLevel} area</p>
                  <div className="flex flex-col gap-0.5">
                    {costData.items.map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-[11px] text-amber-800">{item.emoji} {item.label}</span>
                        <span className="text-[11px] font-semibold text-amber-900">{item.range}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-amber-700">Cost data unavailable for this area.</p>
              )}
            </div>

            {/* 🚌 Transport estimate */}
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 mb-3">
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => {
                  setTransportOpen((p) => !p);
                  setTransportDest(null);
                  setTransportResult(null);
                  setTransportError(null);
                }}
              >
                <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wide">🚌 Estimate travel cost</span>
                {transportOpen
                  ? <ChevronUp className="h-3.5 w-3.5 text-sky-600" />
                  : <ChevronDown className="h-3.5 w-3.5 text-sky-600" />
                }
              </button>

              {transportOpen && (
                <div className="mt-2">
                  {nearbyLabels.length === 0 ? (
                    <p className="text-[11px] text-sky-700">No nearby labels to estimate travel to.</p>
                  ) : (
                    <>
                      <p className="text-[10px] text-sky-700 mb-1.5">Pick a destination:</p>
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                        {nearbyLabels.slice(0, 8).map((dest) => (
                          <button
                            key={dest.id}
                            onClick={() => handleTransportDest(dest)}
                            className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors truncate"
                            style={{
                              background: transportDest?.id === dest.id ? "#e0f2fe" : "white",
                              borderColor: transportDest?.id === dest.id ? "#7dd3fc" : "#e0f2fe",
                              color: "#0c4a6e",
                              fontWeight: transportDest?.id === dest.id ? 600 : 400,
                            }}
                          >
                            📍 {dest.text}
                          </button>
                        ))}
                      </div>

                      {transportLoading && (
                        <p className="text-[11px] text-sky-600 mt-2 animate-pulse">Calculating route…</p>
                      )}

                      {transportError && !transportLoading && (
                        <p className="text-[11px] text-red-500 mt-2">{transportError}</p>
                      )}

                      {transportResult && !transportLoading && (
                        <div className="mt-2 rounded-lg border border-sky-200 bg-white overflow-hidden">
                          <p className="text-[10px] text-sky-600 px-2.5 py-1.5 border-b border-sky-100">
                            To: <span className="font-semibold text-sky-800">{transportDest?.text}</span>
                            {" · "}{transportResult.distanceKm.toFixed(1)} km
                          </p>
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="border-b border-sky-100">
                                <th className="text-left text-sky-600 font-semibold px-2.5 py-1">Mode</th>
                                <th className="text-right text-sky-600 font-semibold px-2.5 py-1">Cost</th>
                                <th className="text-right text-sky-600 font-semibold px-2.5 py-1">~Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transportResult.modes.map((m) => (
                                <tr key={m.mode} className="border-b border-sky-50 last:border-0">
                                  <td className="px-2.5 py-1 text-gray-800">{m.emoji} {m.mode}</td>
                                  <td className="px-2.5 py-1 text-right font-semibold text-gray-900">{m.costRange}</td>
                                  <td className="px-2.5 py-1 text-right text-gray-500">{m.timeMin} min</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {nearbyLabels.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">
                  {nearbyLabels.length} more insight{nearbyLabels.length !== 1 ? "s" : ""} nearby
                </p>
                <div className="flex flex-col gap-1.5">
                  {nearbyLabels.slice(0, 6).map((l) => {
                    const vs = getLabelVoteState(l);
                    const ns = vs.upvotes - vs.downvotes;
                    return (
                      <div
                        key={l.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 border"
                        style={{
                          background: ns > 2 ? "#f0fdf4" : ns < -2 ? "#fef2f2" : "#f9fafb",
                          borderColor: ns > 2 ? "#86efac" : ns < -2 ? "#fca5a5" : "#e5e7eb",
                        }}
                      >
                        <span
                          className="text-xs font-medium truncate mr-2 flex-1"
                          style={{ color: ns > 2 ? "#166534" : ns < -2 ? "#991b1b" : "#374151" }}
                        >
                          {l.text}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleVote(l, "upvote")}
                            disabled={vs.hasVoted}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs border transition-colors disabled:cursor-default"
                            style={{
                              background: vs.voted === "upvote" ? "#dcfce7" : "white",
                              borderColor: vs.voted === "upvote" ? "#86efac" : "#e5e7eb",
                              opacity: vs.hasVoted && vs.voted !== "upvote" ? 0.45 : 1,
                            }}
                          >
                            👍 {vs.upvotes}
                          </button>
                          <button
                            onClick={() => handleVote(l, "downvote")}
                            disabled={vs.hasVoted}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs border transition-colors disabled:cursor-default"
                            style={{
                              background: vs.voted === "downvote" ? "#fee2e2" : "white",
                              borderColor: vs.voted === "downvote" ? "#fca5a5" : "#e5e7eb",
                              opacity: vs.hasVoted && vs.voted !== "downvote" ? 0.45 : 1,
                            }}
                          >
                            👎 {vs.downvotes}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {nearbyLabels.length > 6 && (
                    <span className="text-xs text-gray-400 pl-1">+{nearbyLabels.length - 6} more nearby</span>
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
                  <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 px-4 py-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✨</span>
                      <p className="text-sm font-bold text-purple-900">Daily AI questions used up</p>
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed mb-2">
                      Resets at midnight. Cost estimates and transport calculator are still available.
                    </p>
                    <button
                      onClick={() => setShowProModal(true)}
                      className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white text-xs font-bold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity"
                    >
                      🚀 Go Pro — Join Waitlist →
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-2">
                    {remaining} of {DAILY_LIMIT} AI questions left today
                  </p>
                )}

                {messages.length === 0 && !isLimited && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {getSuggestedQuestions(label.lat, label.lng).map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
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
                          className="rounded-2xl px-4 py-2.5 max-w-[90%]"
                          style={
                            msg.role === "user"
                              ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", borderBottomRightRadius: 4 }
                              : { background: "#f3f4f6", color: "#111827", borderBottomLeftRadius: 4 }
                          }
                        >
                          {msg.role === "user"
                            ? <span className="text-sm leading-relaxed">{msg.content}</span>
                            : <MarkdownMessage text={msg.content} />
                          }
                        </div>
                      </div>
                    ))}

                    {isStreaming && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-4 py-2.5 max-w-[90%] bg-gray-100 text-gray-900" style={{ borderBottomLeftRadius: 4 }}>
                          {streamingContent
                            ? <MarkdownMessage text={streamingContent} />
                            : (
                              <span className="flex items-center gap-1 py-0.5">
                                <span className="animate-bounce inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animationDelay: "0ms" }} />
                                <span className="animate-bounce inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animationDelay: "150ms" }} />
                                <span className="animate-bounce inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animationDelay: "300ms" }} />
                              </span>
                            )
                          }
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

    {showProModal && (
      <ProUpsellModal
        reason="chat_limit"
        apiBase={apiBase}
        onClose={() => setShowProModal(false)}
      />
    )}
    </>
  );
}
