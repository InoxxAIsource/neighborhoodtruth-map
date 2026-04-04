import { useState } from "react";
import { X, Sparkles, Mail, CheckCircle } from "lucide-react";

interface ProUpsellModalProps {
  reason: "chat_limit" | "relocate_limit";
  cityInterest?: string;
  apiBase: string;
  onClose: () => void;
}

const COPY: Record<ProUpsellModalProps["reason"], { headline: string; sub: string }> = {
  chat_limit: {
    headline: "You've used your 5 free AI questions today",
    sub: "Go Pro for unlimited AI chat, early Migration Mode access, and no ads.",
  },
  relocate_limit: {
    headline: "You've used your 2 free relocation queries today",
    sub: "Go Pro for unlimited AI relocation advice, full city comparisons, and no ads.",
  },
};

export function ProUpsellModal({ reason, cityInterest, apiBase, onClose }: ProUpsellModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[reason];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), cityInterest: cityInterest ?? undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to join waitlist");
      }
      setDone(true);
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center"
      style={{ backdropFilter: "blur(2px)", backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div
          className="px-6 py-5 flex items-start justify-between"
          style={{ background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-snug">{copy.headline}</p>
              <p className="text-teal-100 text-xs mt-0.5 leading-snug">{copy.sub}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors ml-2 flex-shrink-0 mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pro benefits */}
        <div className="px-6 py-4 border-b">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">What you get with Pro</p>
          <ul className="space-y-2">
            {[
              "Unlimited AI neighborhood chat",
              "Unlimited Migration Mode queries",
              "Early access to new city data",
              "No ads, ever",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-teal-500 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Waitlist form */}
        <div className="px-6 py-4">
          {done ? (
            <div className="text-center py-2">
              <CheckCircle className="h-8 w-8 text-teal-500 mx-auto mb-2" />
              <p className="font-bold text-gray-900 text-sm">You're on the list!</p>
              <p className="text-gray-500 text-xs mt-1">We'll email you when Pro launches.</p>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-teal-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-teal-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-sm font-semibold text-gray-900 mb-3">Join Pro Waitlist →</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
                    required
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="bg-teal-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {submitting ? "…" : "Join"}
                </button>
              </div>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              <p className="text-xs text-gray-400 mt-2">No spam. Unsubscribe any time.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
