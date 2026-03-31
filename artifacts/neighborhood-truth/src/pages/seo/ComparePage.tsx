import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowLeftRight, Trophy, Shield, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
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
  const totalVotes = area.upvotes + area.downvotes;
  const pct = totalVotes > 0 ? Math.round((area.upvotes / totalVotes) * 100) : 0;
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
              Best areas in {area.city.name}
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
            Community Score
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${sentimentColor}`}>
              {area.sentiment > 0 ? "+" : ""}{area.sentiment}
            </span>
            {wins.includes("betterRated") && <WinBadge label="Better Rated" />}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">👍 Approval</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{pct}%</span>
            <span className="text-xs text-gray-500">({area.upvotes} votes)</span>
            {wins.includes("morePopular") && <WinBadge label="More Popular" />}
          </div>
        </div>
      </div>

      {area.vibe.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-medium mb-1.5">Vibe</p>
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
          className="block text-center text-sm text-teal-600 border border-teal-200 rounded-lg py-1.5 hover:bg-teal-50 transition-colors"
        >
          View full profile of {area.text} →
        </Link>
      )}
    </div>
  );
}

function generateVerdict(a: CompareData["a"], b: CompareData["b"], verdict: CompareData["verdict"], aWins: number, bWins: number): string {
  const winner = aWins > bWins ? a.text : bWins > aWins ? b.text : null;
  const loser = aWins > bWins ? b.text : bWins > aWins ? a.text : null;

  const lines: string[] = [];

  if (winner && loser) {
    lines.push(`Based on community data, ${winner} comes out ahead in ${Math.max(aWins, bWins)} out of 4 categories compared to ${loser}.`);
  } else {
    lines.push(`${a.text} and ${b.text} are closely matched — the community rates them nearly equally across all key factors.`);
  }

  if (verdict.safer !== "tie") {
    const saferArea = verdict.safer === "a" ? a : b;
    const otherArea = verdict.safer === "a" ? b : a;
    lines.push(`For safety, ${saferArea.text} (${saferArea.safety}/5) has the edge over ${otherArea.text} (${otherArea.safety}/5).`);
  } else {
    lines.push(`Both areas share the same safety rating of ${a.safety}/5 — a tie on this dimension.`);
  }

  const cheaper = verdict.cheaper === "a" ? a : b;
  const pricier = verdict.cheaper === "a" ? b : a;
  if (cheaper.cost !== pricier.cost) {
    lines.push(`If budget matters, ${cheaper.text} (${cheaper.cost}) is more affordable than ${pricier.text} (${pricier.cost}).`);
  }

  if (verdict.betterRated !== "tie") {
    const betterRated = verdict.betterRated === "a" ? a : b;
    lines.push(`The community gives a higher overall sentiment to ${betterRated.text}, suggesting locals prefer it.`);
  }

  return lines.join(" ");
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

  if (isLoading) return <SEOLayout><LoadingState /></SEOLayout>;
  if (isError || !data?.a || !data?.b) {
    return <SEOLayout><ErrorState message="Couldn't load comparison. One or both areas may not exist yet." /></SEOLayout>;
  }

  const { a, b, verdict } = data;
  const aWins = Object.values(verdict).filter((v) => v === "a").length;
  const bWins = Object.values(verdict).filter((v) => v === "b").length;
  const aWinKeys = Object.entries(verdict).filter(([, v]) => v === "a").map(([k]) => k);
  const bWinKeys = Object.entries(verdict).filter(([, v]) => v === "b").map(([k]) => k);
  const overallWinner = aWins > bWins ? a.text : bWins > aWins ? b.text : null;
  const verdictText = generateVerdict(a, b, verdict, aWins, bWins);

  const title = `${a.text} vs ${b.text} – Which is Better? | PlaceLabels`;
  const description = `${a.text} vs ${b.text}: ${a.text} scores ${a.safety}/5 safety, ${a.cost} cost. ${b.text} scores ${b.safety}/5 safety, ${b.cost} cost. ${overallWinner ? overallWinner + " wins overall." : "It's a tie."} Based on real community data.`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Is ${a.text} or ${b.text} safer?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": verdict.safer === "tie"
            ? `Both ${a.text} and ${b.text} have the same safety rating of ${a.safety}/5.`
            : `${verdict.safer === "a" ? a.text : b.text} is safer with a rating of ${verdict.safer === "a" ? a.safety : b.safety}/5 vs ${verdict.safer === "a" ? b.safety : a.safety}/5.`,
        },
      },
      {
        "@type": "Question",
        "name": `Is ${a.text} or ${b.text} more affordable?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${verdict.cheaper === "a" ? a.text : b.text} is more affordable, rated ${verdict.cheaper === "a" ? a.cost : b.cost} (${COST_LABELS[verdict.cheaper === "a" ? a.cost : b.cost] || ""}) compared to ${verdict.cheaper === "a" ? b.cost : a.cost}.`,
        },
      },
      {
        "@type": "Question",
        "name": `Which is better — ${a.text} or ${b.text}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": overallWinner ? `${overallWinner} comes out ahead overall, winning ${Math.max(aWins, bWins)} out of 4 categories based on community data.` : `${a.text} and ${b.text} are closely matched with no clear overall winner based on community data.`,
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "PlaceLabels", "item": "https://placelabels.com" },
      { "@type": "ListItem", "position": 2, "name": "Compare", "item": "https://placelabels.com/compare" },
      { "@type": "ListItem", "position": 3, "name": `${a.text} vs ${b.text}`, "item": `https://placelabels.com/compare/${slug}` },
    ],
  };

  return (
    <SEOLayout breadcrumbs={[{ label: "Compare" }, { label: `${a.text} vs ${b.text}` }]}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://placelabels.com/compare/${slug}`} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Hero */}
      <div className="mb-8 text-center">
        <ArrowLeftRight className="h-7 w-7 text-teal-600 mx-auto mb-3" />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {a.text} <span className="text-teal-500">vs</span> {b.text} – Which is Better?
        </h1>
        <p className="text-gray-500 text-sm mb-4">Neighborhood comparison powered by crowd-sourced community data</p>

        {overallWinner ? (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-5 py-2.5">
            <Trophy className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 font-bold">
              {overallWinner} wins overall ({Math.max(aWins, bWins)} vs {Math.min(aWins, bWins)} categories)
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-5 py-2.5">
            <span className="text-gray-700 font-bold">It's a tie — both areas are evenly matched</span>
          </div>
        )}
      </div>

      {/* Overview summary */}
      <section className="bg-gradient-to-r from-teal-50 to-purple-50 rounded-2xl border border-teal-100 p-5 mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-2">Quick Overview</h2>
        <p className="text-gray-700 text-sm leading-relaxed">{verdictText}</p>
      </section>

      {/* Side-by-side */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <AreaColumn area={a} wins={aWinKeys} side="A" />
        <AreaColumn area={b} wins={bWinKeys} side="B" />
      </div>

      {/* Comparison table */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-900">Comparison Table: {a.text} vs {b.text}</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Factor</th>
              <th className="text-center px-5 py-3 font-semibold text-blue-700">{a.text}</th>
              <th className="text-center px-5 py-3 font-semibold text-purple-700">{b.text}</th>
              <th className="text-center px-5 py-3 text-gray-500 font-medium hidden sm:table-cell">Winner</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              {
                label: "Safety",
                aVal: `${a.safety}/5`,
                bVal: `${b.safety}/5`,
                winner: verdict.safer,
                aHighlight: verdict.safer === "a",
                bHighlight: verdict.safer === "b",
              },
              {
                label: "Cost",
                aVal: `${a.cost} (${COST_LABELS[a.cost] || a.cost})`,
                bVal: `${b.cost} (${COST_LABELS[b.cost] || b.cost})`,
                winner: verdict.cheaper,
                aHighlight: verdict.cheaper === "a",
                bHighlight: verdict.cheaper === "b",
              },
              {
                label: "Community Score",
                aVal: `${a.sentiment > 0 ? "+" : ""}${a.sentiment}`,
                bVal: `${b.sentiment > 0 ? "+" : ""}${b.sentiment}`,
                winner: verdict.betterRated,
                aHighlight: verdict.betterRated === "a",
                bHighlight: verdict.betterRated === "b",
              },
              {
                label: "Upvotes",
                aVal: String(a.upvotes),
                bVal: String(b.upvotes),
                winner: verdict.morePopular,
                aHighlight: verdict.morePopular === "a",
                bHighlight: verdict.morePopular === "b",
              },
              {
                label: "Vibe",
                aVal: a.vibe.slice(0, 2).join(", ") || "—",
                bVal: b.vibe.slice(0, 2).join(", ") || "—",
                winner: "tie" as const,
                aHighlight: false,
                bHighlight: false,
              },
            ].map(({ label, aVal, bVal, winner, aHighlight, bHighlight }) => (
              <tr key={label}>
                <td className="px-5 py-3 text-gray-600 font-medium">{label}</td>
                <td className={`text-center px-5 py-3 font-bold ${aHighlight ? "text-green-700" : "text-gray-700"}`}>{aVal}</td>
                <td className={`text-center px-5 py-3 font-bold ${bHighlight ? "text-green-700" : "text-gray-700"}`}>{bVal}</td>
                <td className="text-center px-5 py-3 hidden sm:table-cell">
                  {winner === "tie" ? (
                    <span className="text-xs text-gray-400">Tie</span>
                  ) : (
                    <span className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-700">
                      <Trophy className="h-3 w-3" />
                      {winner === "a" ? a.text.split(" ")[0] : b.text.split(" ")[0]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Verdict */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {a.text} vs {b.text}: Our Verdict
        </h2>
        <div className="prose prose-sm text-gray-600 max-w-none space-y-3">
          <p>{verdictText}</p>
          {overallWinner && (
            <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 not-prose">
              <Trophy className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Bottom line: Choose {overallWinner}</p>
                <p className="text-sm text-amber-800 mt-1">
                  {overallWinner} wins {Math.max(aWins, bWins)} out of 4 categories. For most people,{" "}
                  {overallWinner} offers the better combination of safety, cost, and community sentiment.
                </p>
              </div>
            </div>
          )}
          {!overallWinner && (
            <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 not-prose">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900">Tie — it depends on your priorities</p>
                <p className="text-sm text-blue-800 mt-1">
                  Both areas are equally matched. If safety is your top priority, choose the one with the higher safety score.
                  If budget matters most, go with the more affordable option.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {a.text} vs {b.text} — FAQ
        </h2>
        <div className="space-y-3">
          {[
            {
              q: `Is ${a.text} or ${b.text} safer?`,
              a: verdict.safer === "tie"
                ? `Both ${a.text} and ${b.text} have the same safety rating of ${a.safety}/5.`
                : `${verdict.safer === "a" ? a.text : b.text} is considered safer with ${verdict.safer === "a" ? a.safety : b.safety}/5 vs ${verdict.safer === "a" ? b.safety : a.safety}/5.`,
            },
            {
              q: `Is ${a.text} or ${b.text} cheaper?`,
              a: `${verdict.cheaper === "a" ? a.text : b.text} is more affordable at ${verdict.cheaper === "a" ? a.cost : b.cost} (${COST_LABELS[verdict.cheaper === "a" ? a.cost : b.cost] || ""}) compared to ${verdict.cheaper === "a" ? b.cost : a.cost}.`,
            },
            {
              q: `Which is better — ${a.text} or ${b.text}?`,
              a: overallWinner
                ? `Based on community data, ${overallWinner} is the better choice overall, winning in safety, cost, or community sentiment. ${verdictText}`
                : `${a.text} and ${b.text} are closely matched. Your choice depends on personal priorities. ${verdictText}`,
            },
          ].map(({ q, a: ans }) => (
            <details key={q} className="bg-white rounded-xl border border-gray-200 group">
              <summary className="px-5 py-4 cursor-pointer font-semibold text-gray-900 flex items-center justify-between list-none">
                {q}
                <span className="text-teal-600 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{ans}</p>
            </details>
          ))}
        </div>
      </section>

      {/* City links */}
      <div className="flex flex-wrap gap-3 justify-center text-sm border-t pt-6">
        {a.city && (
          <Link href={`/${a.city.slug}`} className="text-teal-600 hover:underline">
            Best areas in {a.city.name}
          </Link>
        )}
        {b.city && b.city.slug !== a.city?.slug && (
          <Link href={`/${b.city.slug}`} className="text-teal-600 hover:underline">
            Best areas in {b.city.name}
          </Link>
        )}
        {a.city && (
          <Link href={`/${a.city.slug}/${a.slug}`} className="text-teal-600 hover:underline">
            {a.text} cost of living
          </Link>
        )}
        {b.city && (
          <Link href={`/${b.city.slug}/${b.slug}`} className="text-teal-600 hover:underline">
            {b.text} cost of living
          </Link>
        )}
      </div>
    </SEOLayout>
  );
}
