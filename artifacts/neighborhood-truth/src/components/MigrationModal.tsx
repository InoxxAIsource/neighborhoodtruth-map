import { useState, useRef, useCallback, useEffect } from "react";
import { X, MapPin, Sparkles, ChevronRight } from "lucide-react";
import { ProUpsellModal } from "./ProUpsellModal";

const RATE_LIMIT_KEY = "pl_relocate_limit";
const DAILY_LIMIT = 2;

interface RateLimitData {
  count: number;
  date: string;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getRelocateLimit(): RateLimitData {
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

function setRelocateLimit(data: RateLimitData) {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
}

const BUDGET_OPTIONS = [
  { value: "5k-10k", label: "₹5k–10k", sub: "Budget" },
  { value: "10k-20k", label: "₹10k–20k", sub: "Mid-range" },
  { value: "20k-35k", label: "₹20k–35k", sub: "Comfortable" },
  { value: "35k+", label: "₹35k+", sub: "Premium" },
];

const JOB_OPTIONS = [
  { value: "IT/Tech", label: "💻 IT / Tech" },
  { value: "Student", label: "🎓 Student" },
  { value: "Government/PSU", label: "🏛️ Government / PSU" },
  { value: "Business/Self-employed", label: "🏪 Business / Self-employed" },
  { value: "Healthcare", label: "🏥 Healthcare" },
  { value: "Other", label: "🔧 Other" },
];

const LIFESTYLE_OPTIONS = [
  { value: "Metro/Bus access", label: "🚇 Metro / Bus access" },
  { value: "Women's safety priority", label: "🛡️ Women's safety priority" },
  { value: "Near schools", label: "🏫 Near schools" },
  { value: "Nightlife", label: "🎉 Nightlife" },
  { value: "Quiet neighborhood", label: "🌿 Quiet neighborhood" },
  { value: "Near IT parks", label: "💻 Near IT parks" },
];

import type { ReactNode } from "react";

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

function extractAreaName(line: string): string | null {
  // Match markdown heading: ### Name or ## Name or # Name
  const hMatch = line.match(/^#{1,3}\s+(.+)/);
  if (hMatch) return hMatch[1].replace(/[*_]/g, "").trim();
  // Match a line that is ONLY bold text: **Name** (the bold-fallback case)
  const boldOnlyMatch = line.match(/^\*\*([^*]+)\*\*\s*$/);
  if (boldOnlyMatch) return boldOnlyMatch[1].trim();
  return null;
}

function MarkdownResult({ text, cityLabels, onViewOnMap }: {
  text: string;
  cityLabels: { text: string; lat: number; lng: number }[];
  onViewOnMap: (lat: number, lng: number, name: string) => void;
}) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter(Boolean);
        if (!lines.length) return null;

        const areaName = extractAreaName(lines[0]);
        if (areaName) {
          const matchedLabel = cityLabels.find((l) =>
            l.text.toLowerCase().includes(areaName.toLowerCase()) ||
            areaName.toLowerCase().includes(l.text.toLowerCase())
          );
          const displayName = lines[0].match(/^#{1,3}\s+(.+)/) ? lines[0].replace(/^#+\s+/, "") : lines[0];
          return (
            <div key={bi} className="flex items-center justify-between gap-2 mt-3 first:mt-0">
              <p className="font-bold text-gray-900 text-base">{renderInline(displayName)}</p>
              {matchedLabel && (
                <button
                  onClick={() => onViewOnMap(matchedLabel.lat, matchedLabel.lng, matchedLabel.text)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2.5 py-1 hover:bg-teal-100 transition-colors font-medium"
                >
                  <MapPin className="h-3 w-3" /> View on map
                </button>
              )}
            </div>
          );
        }

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

        if (lines[0].includes("📍 View on map")) return null;

        return (
          <p key={bi} className="text-gray-600">
            {lines.map((l, li) => (
              <span key={li}>{li > 0 && <br />}{renderInline(l)}</span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

interface MigrationModalProps {
  citySlug: string;
  cityName: string;
  cityLabels: { text: string; lat: number; lng: number }[];
  apiBase: string;
  onClose: () => void;
  onFlyTo: (lat: number, lng: number, name?: string) => void;
}

export function MigrationModal({ citySlug, cityName, cityLabels, apiBase, onClose, onFlyTo }: MigrationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | "result">(1);
  const [budget, setBudget] = useState<string>("");
  const [jobType, setJobType] = useState<string>("");
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimitState] = useState(() => getRelocateLimit());
  const [showProModal, setShowProModal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const remaining = DAILY_LIMIT - rateLimit.count;
  const isLimited = remaining <= 0;

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const toggleLifestyle = (value: string) => {
    setLifestyle((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = useCallback(async () => {
    if (!budget || !jobType || isStreaming) return;
    if (isLimited) {
      setShowProModal(true);
      return;
    }

    const newLimit = { count: rateLimit.count + 1, date: getTodayStr() };
    setRelocateLimit(newLimit);
    setRateLimitState(newLimit);

    setStep("result");
    setIsStreaming(true);
    setStreamText("");
    setError(null);

    abortRef.current = new AbortController();

    let accumulated = "";
    let sseBuffer = "";

    try {
      const res = await fetch(`${apiBase}/chat/relocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citySlug, budget, jobType, lifestyle }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

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
            setStreamText(accumulated);
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
        for (const line of lines) processLine(line);
      }
      if (sseBuffer) processLine(sseBuffer);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message || "Something went wrong. Please try again.");
      const restored = { count: rateLimit.count, date: getTodayStr() };
      setRelocateLimit(restored);
      setRateLimitState(restored);
    } finally {
      setIsStreaming(false);
    }
  }, [budget, jobType, lifestyle, citySlug, apiBase, isLimited, isStreaming, rateLimit.count]);

  const handleViewOnMap = (lat: number, lng: number, name: string) => {
    onFlyTo(lat, lng, name);
    onClose();
  };

  const canProceed = step === 1 ? !!budget : step === 2 ? !!jobType : true;

  return (
    <>
    <div
      className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center"
      style={{ backdropFilter: "blur(2px)", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b rounded-t-2xl sm:rounded-t-2xl flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-white flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-sm">Find Your Area in {cityName}</p>
              <p className="text-teal-100 text-xs">AI-powered neighbourhood match</p>
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator (wizard steps only) */}
        {step !== "result" && (
          <div className="flex items-center gap-1.5 px-5 pt-4 pb-1 flex-shrink-0">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className="flex-1 h-1.5 rounded-full transition-colors"
                style={{
                  background: s <= step ? "#0d9488" : "#e5e7eb",
                }}
              />
            ))}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Step 1: Budget */}
          {step === 1 && (
            <div>
              <p className="font-semibold text-gray-900 mb-1">Monthly rent budget?</p>
              <p className="text-xs text-gray-500 mb-4">We'll match areas within your range</p>
              <div className="grid grid-cols-2 gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBudget(opt.value)}
                    className="flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all text-center"
                    style={{
                      borderColor: budget === opt.value ? "#0d9488" : "#e5e7eb",
                      background: budget === opt.value ? "#f0fdfa" : "#fafafa",
                    }}
                  >
                    <span className="font-bold text-gray-900 text-base">{opt.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Job Type */}
          {step === 2 && (
            <div>
              <p className="font-semibold text-gray-900 mb-1">What kind of work do you do?</p>
              <p className="text-xs text-gray-500 mb-4">Helps match commute-friendly areas</p>
              <div className="flex flex-col gap-2">
                {JOB_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setJobType(opt.value)}
                    className="flex items-center gap-2 py-2.5 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all"
                    style={{
                      borderColor: jobType === opt.value ? "#0d9488" : "#e5e7eb",
                      background: jobType === opt.value ? "#f0fdfa" : "#fafafa",
                      color: jobType === opt.value ? "#0f766e" : "#374151",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Lifestyle */}
          {step === 3 && (
            <div>
              <p className="font-semibold text-gray-900 mb-1">Lifestyle priorities?</p>
              <p className="text-xs text-gray-500 mb-4">Pick all that matter to you</p>
              <div className="flex flex-col gap-2">
                {LIFESTYLE_OPTIONS.map((opt) => {
                  const selected = lifestyle.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleLifestyle(opt.value)}
                      className="flex items-center gap-2 py-2.5 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all"
                      style={{
                        borderColor: selected ? "#0d9488" : "#e5e7eb",
                        background: selected ? "#f0fdfa" : "#fafafa",
                        color: selected ? "#0f766e" : "#374151",
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center"
                        style={{
                          borderColor: selected ? "#0d9488" : "#d1d5db",
                          background: selected ? "#0d9488" : "white",
                        }}
                      >
                        {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result view */}
          {step === "result" && (
            <div>
              {isStreaming && !streamText && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span>Analysing {cityName} neighbourhoods…</span>
                </div>
              )}

              {streamText && (
                <MarkdownResult
                  text={streamText}
                  cityLabels={cityLabels}
                  onViewOnMap={handleViewOnMap}
                />
              )}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!isStreaming && !error && streamText && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-400 text-center">
                    {DAILY_LIMIT - rateLimit.count} free {DAILY_LIMIT - rateLimit.count === 1 ? "query" : "queries"} remaining today
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rate limit exhausted */}
          {isLimited && step !== "result" && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">Daily limit reached</p>
              <p className="text-xs text-amber-700 mb-3">You've used your 2 free AI area queries for today. Come back tomorrow or go Pro.</p>
              <button
                onClick={() => setShowProModal(true)}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white text-xs font-bold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity"
              >
                🚀 Go Pro — Join Waitlist →
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step !== "result" && (
          <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              onClick={() => {
                if (step === 1) onClose();
                else setStep((s) => (s === 3 ? 2 : 1) as 1 | 2);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-2"
            >
              {step === 1 ? "Cancel" : "← Back"}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s === 1 ? 2 : 3) as 2 | 3)}
                disabled={!canProceed}
                className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-xl transition-all"
                style={{
                  background: canProceed ? "#0d9488" : "#e5e7eb",
                  color: canProceed ? "white" : "#9ca3af",
                  cursor: canProceed ? "pointer" : "not-allowed",
                }}
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLimited || isStreaming}
                className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-xl transition-all"
                style={{
                  background: isLimited || isStreaming ? "#e5e7eb" : "#0d9488",
                  color: isLimited || isStreaming ? "#9ca3af" : "white",
                  cursor: isLimited || isStreaming ? "not-allowed" : "pointer",
                }}
              >
                <Sparkles className="h-4 w-4" /> Find my area
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {showProModal && (
      <ProUpsellModal
        reason="relocate_limit"
        cityInterest={cityName}
        apiBase={apiBase}
        onClose={() => setShowProModal(false)}
      />
    )}
    </>
  );
}
