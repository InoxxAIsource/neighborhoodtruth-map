import { Link } from "wouter";
import { ArrowLeft, Map, Globe } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export const API = `${BASE}/api`;

interface Crumb {
  label: string;
  href?: string;
}

interface SEOLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Crumb[];
}

export function SEOLayout({ children, breadcrumbs = [] }: SEOLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 text-teal-700 hover:text-teal-900 font-bold text-lg flex-shrink-0">
              <Globe className="h-5 w-5" />
              PlaceLabels
            </Link>
            {breadcrumbs.length > 0 && (
              <nav className="hidden sm:flex items-center gap-1 text-sm text-gray-500 min-w-0">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1 min-w-0">
                    <span className="text-gray-300">/</span>
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-teal-700 truncate">{crumb.label}</Link>
                    ) : (
                      <span className="text-gray-700 font-medium truncate">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-teal-700 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition-colors flex-shrink-0"
          >
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Open Map</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t bg-white mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} PlaceLabels — Crowd-sourced neighborhood intelligence</p>
          <p className="mt-1">Data powered by real locals and visitors worldwide.</p>
        </div>
      </footer>
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatBadge({ label, value, color = "bg-gray-100 text-gray-700" }: StatBadgeProps) {
  return (
    <div className={`rounded-xl px-4 py-3 text-center ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-75">{label}</p>
    </div>
  );
}

interface AreaCardProps {
  text: string;
  citySlug: string;
  areaSlug: string;
  safety: number;
  cost: string;
  vibes: string[];
  sentiment: number;
  rank?: number;
}

export function AreaCard({ text, citySlug, areaSlug, safety, cost, vibes, sentiment, rank }: AreaCardProps) {
  const sentimentColor = sentiment > 5 ? "text-green-700 bg-green-50" : sentiment < -5 ? "text-red-700 bg-red-50" : "text-gray-700 bg-gray-100";
  return (
    <Link href={`/${citySlug}/${areaSlug}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {rank !== undefined && (
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">{rank}</span>
            )}
            <h3 className="font-semibold text-gray-900 text-sm group-hover:text-teal-700 transition-colors truncate">{text}</h3>
          </div>
          <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${sentimentColor}`}>
            {sentiment > 0 ? "+" : ""}{sentiment}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span title="Safety">{"★".repeat(safety)}{"☆".repeat(5 - safety)}</span>
          <span className="font-medium text-gray-700">{cost}</span>
          {vibes.slice(0, 2).map((v) => (
            <span key={v} className="bg-gray-100 rounded px-1.5 py-0.5 text-gray-600">{v}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading neighborhood data…</p>
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-gray-500 mb-4">{message}</p>
      <Link href="/" className="text-teal-700 underline text-sm">← Back to map</Link>
    </div>
  );
}

export function safetyLabel(avg: number): string {
  if (avg >= 4.5) return "Very Safe";
  if (avg >= 3.5) return "Safe";
  if (avg >= 2.5) return "Moderate";
  return "Use Caution";
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s]+/g, "-").replace(/-+/g, "-");
}
