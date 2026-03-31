import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowLeftRight, Trophy, Shield, DollarSign, TrendingUp } from "lucide-react";
import { SEOLayout, API, LoadingState, ErrorState, safetyLabel } from "./SEOLayout";

interface CompareData {
  a: {
    id: string;
    slug: string;
    text: string;
    city: { slug: string; name: string } | null;
    safety: number;
    cost: string;
    vibe: string[];
    upvotes: number;
    downvotes: number;
    sentiment: number;
    category: string | null;
  };
  b: {
    id: string;
    slug: string;
    text: string;
    city: { slug: string; name: string } | null;
    safety: number;
    cost: string;
    vibe: string[];
    upvotes: number;
    downvotes: number;
    sentiment: number;
    category: string | null;
  };
  verdict: {
    safer: "a" | "b" | "tie";
    betterRated: "a" | "b" | "tie";
    cheaper: "a" | "b";
    morePopular: "a" | "b" | "tie";
  };
}

const costRank: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
const COST_LABELS: Record<string, string> = { "$": "Budget", "$$": "Affordable", "$$$": "Mid-range", "$$$$": "Luxury" };

function WinBadge({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
      <Trophy className="h-3 w-3" />
      {label}
    </span>
  );
}

function AreaColumn({ area, wins, side }: { area: CompareData["a"]; wins: string[]; side: "A" | "B" }) {
  const sentimentColor = area.sentiment > 0 ? "text-green-700" : area.sentiment < 0 ? "text-red-700" : "text-gray-700";
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={`inline-block text-xs font-bold rounded px-2 py-0.5 mb-2 ${side === "A" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
            Option {side}
          </span>
          <h2 className="font-bold text-gray-900 text-lg leading-tight">{area.text}</h2>
          {area.city && (
            <Link href={`/${area.city.slug}`} className="text-sm text-teal-600 hover:underline">
              {area.city.name}
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            Safety
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{area.safety}/5</span>
            <span className="text-xs text-gray-500">({safetyLabel(area.safety)})</span>
            {wins.includes("safer") && <WinBadge label="Safer" />}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            Cost
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{area.cost}</span>
            <span className="text-xs text-gray-500">({COST_LABELS[area.cost] || area.cost})</span>
            {wins.includes("cheaper") && <WinBadge label="Cheaper" />}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4" />
            Score
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${sentimentColor}`}>
              {area.sentiment > 0 ? "+" : ""}{area.sentiment}
            </span>
            {wins.includes("betterRated") && <WinBadge label="Better Rated" />}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">👍 Upvotes</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{area.upvotes}</span>
            {wins.includes("morePopular") && <WinBadge label="More Popular" />}
          </div>
        </div>
      </div>

      {area.vibe.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1.5">Vibes</p>
          <div className="flex flex-wrap gap-1">
            {area.vibe.map((v) => (
              <span key={v} className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5">{v}</span>
            ))}
          </div>
        </div>
      )}

      {area.city && (
        <Link
          href={`/${area.city.slug}/${area.slug}`}
          className="mt-4 block text-center text-sm text-teal-600 border border-teal-200 rounded-lg py-1.5 hover:bg-teal-50 transition-colors"
        >
          View full profile →
        </Link>
      )}
    </div>
  );
}

export default function ComparePage() {
  const { slug } = useParams<{ slug: string }>();

  const match = slug?.match(/^(.+)-vs-(.+)$/);
  const aSlug = match?.[1] ?? "";
  const bSlug = match?.[2] ?? "";

  const { data, isLoading, isError } = useQuery<CompareData>({
    queryKey: ["seo-compare", aSlug, bSlug],
    queryFn: () => fetch(`${API}/seo/compare?a=${encodeURIComponent(aSlug)}&b=${encodeURIComponent(bSlug)}`).then((r) => r.json()),
    enabled: !!aSlug && !!bSlug,
  });

  if (isLoading) {
    return (
      <SEOLayout>
        <LoadingState />
      </SEOLayout>
    );
  }

  if (isError || !data?.a || !data?.b) {
    return (
      <SEOLayout>
        <ErrorState message="Couldn't load comparison. One or both areas may not exist yet." />
      </SEOLayout>
    );
  }

  const { a, b, verdict } = data;

  const aWins = Object.entries(verdict)
    .filter(([, v]) => v === "a")
    .map(([k]) => k);
  const bWins = Object.entries(verdict)
    .filter(([, v]) => v === "b")
    .map(([k]) => k);

  const overallWinner = aWins.length > bWins.length ? a.text : bWins.length > aWins.length ? b.text : null;

  const title = `${a.text} vs ${b.text} — Neighborhood Comparison | HoodSignal`;
  const description = `Compare "${a.text}" and "${b.text}". ${a.text}: safety ${a.safety}/5, cost ${a.cost}, score ${a.sentiment > 0 ? "+" : ""}${a.sentiment}. ${b.text}: safety ${b.safety}/5, cost ${b.cost}, score ${b.sentiment > 0 ? "+" : ""}${b.sentiment}.`;

  return (
    <SEOLayout breadcrumbs={[{ label: "Compare" }, { label: `${a.text} vs ${b.text}` }]}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://hoodsignal.com/compare/${slug}`} />
      </Helmet>

      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <ArrowLeftRight className="h-6 w-6 text-teal-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {a.text} <span className="text-teal-500">vs</span> {b.text}
        </h1>
        <p className="text-gray-500 text-sm">Neighborhood comparison powered by crowd-sourced data</p>

        {overallWinner && (
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-5 py-2.5">
            <Trophy className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 font-bold">
              {overallWinner} wins overall ({Math.max(aWins.length, bWins.length)} vs {Math.min(aWins.length, bWins.length)} categories)
            </span>
          </div>
        )}
        {!overallWinner && (
          <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-5 py-2.5">
            <span className="text-gray-700 font-bold">It's a tie! Both areas are equally matched.</span>
          </div>
        )}
      </div>

      {/* Side-by-side comparison */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <AreaColumn area={a} wins={aWins} side="A" />
        <AreaColumn area={b} wins={bWins} side="B" />
      </div>

      {/* Summary table */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-900">Quick Comparison Table</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Category</th>
              <th className="text-center px-5 py-3 font-semibold text-blue-700">{a.text}</th>
              <th className="text-center px-5 py-3 font-semibold text-purple-700">{b.text}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="px-5 py-3 text-gray-600">Safety</td>
              <td className={`text-center px-5 py-3 font-bold ${verdict.safer === "a" ? "text-green-700" : "text-gray-700"}`}>{a.safety}/5</td>
              <td className={`text-center px-5 py-3 font-bold ${verdict.safer === "b" ? "text-green-700" : "text-gray-700"}`}>{b.safety}/5</td>
            </tr>
            <tr>
              <td className="px-5 py-3 text-gray-600">Cost</td>
              <td className={`text-center px-5 py-3 font-bold ${verdict.cheaper === "a" ? "text-green-700" : "text-gray-700"}`}>{a.cost}</td>
              <td className={`text-center px-5 py-3 font-bold ${verdict.cheaper === "b" ? "text-green-700" : "text-gray-700"}`}>{b.cost}</td>
            </tr>
            <tr>
              <td className="px-5 py-3 text-gray-600">Community Score</td>
              <td className={`text-center px-5 py-3 font-bold ${verdict.betterRated === "a" ? "text-green-700" : "text-gray-700"}`}>{a.sentiment > 0 ? "+" : ""}{a.sentiment}</td>
              <td className={`text-center px-5 py-3 font-bold ${verdict.betterRated === "b" ? "text-green-700" : "text-gray-700"}`}>{b.sentiment > 0 ? "+" : ""}{b.sentiment}</td>
            </tr>
            <tr>
              <td className="px-5 py-3 text-gray-600">Upvotes</td>
              <td className={`text-center px-5 py-3 font-bold ${verdict.morePopular === "a" ? "text-green-700" : "text-gray-700"}`}>{a.upvotes}</td>
              <td className={`text-center px-5 py-3 font-bold ${verdict.morePopular === "b" ? "text-green-700" : "text-gray-700"}`}>{b.upvotes}</td>
            </tr>
            <tr>
              <td className="px-5 py-3 text-gray-600">Cost Rating</td>
              <td className="text-center px-5 py-3 text-gray-700">{COST_LABELS[a.cost] || a.cost}</td>
              <td className="text-center px-5 py-3 text-gray-700">{COST_LABELS[b.cost] || b.cost}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* SEO prose */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          {a.text} vs {b.text}: Full Analysis
        </h2>
        <div className="prose prose-sm text-gray-600 max-w-none space-y-3">
          <p>
            <strong>{a.text}</strong> scores <strong>{a.safety}/5 for safety</strong> ({safetyLabel(a.safety)}) while{" "}
            <strong>{b.text}</strong> scores <strong>{b.safety}/5</strong> ({safetyLabel(b.safety)}).
            {verdict.safer === "tie" ? " Both are equally safe." : ` ${verdict.safer === "a" ? a.text : b.text} has the safety edge.`}
          </p>
          <p>
            On cost, {a.text} is rated <strong>{a.cost}</strong> ({COST_LABELS[a.cost] || a.cost}) and {b.text} is rated{" "}
            <strong>{b.cost}</strong> ({COST_LABELS[b.cost] || b.cost}).
            {" "}{verdict.cheaper === "a" ? a.text : b.text} is the more affordable option.
          </p>
          <p>
            Community sentiment: {a.text} has a score of <strong>{a.sentiment > 0 ? "+" : ""}{a.sentiment}</strong> ({a.upvotes} upvotes), 
            while {b.text} scores <strong>{b.sentiment > 0 ? "+" : ""}{b.sentiment}</strong> ({b.upvotes} upvotes).
            {verdict.betterRated === "tie" ? " The community rates them equally." : ` The community prefers ${verdict.betterRated === "a" ? a.text : b.text}.`}
          </p>
        </div>
      </section>
    </SEOLayout>
  );
}
