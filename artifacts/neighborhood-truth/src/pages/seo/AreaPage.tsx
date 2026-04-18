import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { MapPin, ArrowUpRight, ThumbsUp, ThumbsDown, Shield, DollarSign, Sparkles, Users, CheckCircle, XCircle, Calendar, GitCompare } from "lucide-react";
import { SEOLayout, API, StatBadge, AreaCard, LoadingState, ErrorState, safetyLabel, slugify } from "./SEOLayout";

interface AreaData {
  city: { slug: string; name: string };
  area: {
    id: string;
    slug: string;
    text: string;
    lat: number;
    lng: number;
    safety: number;
    cost: string;
    vibe: string[];
    upvotes: number;
    downvotes: number;
    sentiment: number;
    category: string | null;
    color: string | null;
  };
  nearby: Array<{
    id: string;
    slug: string;
    text: string;
    safety: number;
    cost: string;
    vibe: string[];
    sentiment: number;
    url: string;
  }>;
  stats: {
    avgSafety: number;
    modeCost: string;
    vibes: string[];
    sentiment: number;
    labelCount: number;
    topLabel: string;
  } | null;
}

const COST_LABELS: Record<string, string> = { "$": "Budget", "$$": "Affordable", "$$$": "Mid-range", "$$$$": "Luxury" };
const COST_DESC: Record<string, string> = {
  "$": "Very affordable — one of the cheapest areas in the city",
  "$$": "Affordable — good value for money",
  "$$$": "Mid-range — moderately priced",
  "$$$$": "Premium — on the expensive side",
};

function getUpdatedLabel(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function buildPros(area: AreaData["area"], positivePercent: number): string[] {
  const pros: string[] = [];
  if (area.safety >= 4) pros.push(`Safe to walk around (${area.safety}/5 safety score)`);
  if (area.safety === 5) pros.push("One of the safest areas in the city");
  if (area.cost === "$") pros.push("Very affordable — budget-friendly living");
  if (area.cost === "$$") pros.push("Affordable cost of living");
  if ((area.vibe ?? []).includes("Family")) pros.push("Family-friendly environment");
  if ((area.vibe ?? []).includes("Chill")) pros.push("Relaxed, chill atmosphere");
  if ((area.vibe ?? []).includes("Artsy")) pros.push("Vibrant arts and culture scene");
  if ((area.vibe ?? []).includes("Nightlife")) pros.push("Great nightlife options");
  if (positivePercent >= 80) pros.push(`Highly recommended — ${positivePercent}% positive reviews`);
  if (area.sentiment > 20) pros.push("Top-rated by the local community");
  return pros.slice(0, 5);
}

function buildCons(area: AreaData["area"], positivePercent: number): string[] {
  const cons: string[] = [];
  if (area.safety <= 2) cons.push(`Safety concerns (${area.safety}/5 safety score)`);
  if (area.safety === 3) cons.push("Moderate safety — exercise normal caution");
  if (area.cost === "$$$$") cons.push("Expensive — premium cost of living");
  if (area.cost === "$$$") cons.push("Mid-range to expensive cost");
  if ((area.vibe ?? []).includes("Loud")) cons.push("Can be noisy, especially at night");
  if (positivePercent < 50) cons.push(`Lower approval rate (${positivePercent}% positive)`);
  if (area.downvotes > area.upvotes) cons.push("More negative than positive community feedback");
  if (!(area.vibe ?? []).includes("Family") && !(area.vibe ?? []).includes("Chill")) cons.push("Less suitable for families seeking quiet");
  return cons.slice(0, 4);
}

function buildWhoFor(area: AreaData["area"]): Array<{ type: string; reason: string }> {
  const who: Array<{ type: string; reason: string }> = [];
  const vibe = area.vibe ?? [];

  if (area.safety >= 4 && vibe.includes("Family")) who.push({ type: "👨‍👩‍👧‍👦 Families", reason: `Safe (${area.safety}/5) with a family-friendly vibe` });
  if (area.cost === "$" || area.cost === "$$") who.push({ type: "🎓 Students", reason: `Affordable cost (${area.cost}) — easy on a student budget` });
  if (vibe.some((v) => ["Artsy", "Chill", "Bars"].includes(v)) && area.safety >= 3) who.push({ type: "💼 Young Professionals", reason: `${vibe.filter(v => ["Artsy", "Chill", "Bougie"].includes(v)).join(", ")} vibe with decent safety` });
  if (area.safety >= 4 && !vibe.includes("Loud") && !vibe.includes("Nightlife")) who.push({ type: "🌿 Remote Workers", reason: "Safe and quiet — ideal for focused work" });
  if (vibe.includes("Nightlife") || vibe.includes("Bars")) who.push({ type: "🎉 Night Owls", reason: "Vibrant nightlife and bar scene" });
  if (area.cost === "$$$" || area.cost === "$$$$") who.push({ type: "💎 Luxury Seekers", reason: `Premium ${area.cost} area with upscale amenities` });
  if (area.safety >= 3 && !vibe.includes("Loud")) who.push({ type: "✈️ Expats & Visitors", reason: "Safe and accessible for newcomers" });

  return who.slice(0, 4);
}

export default function AreaPage() {
  const { city, area } = useParams<{ city: string; area: string }>();
  const [helpfulVote, setHelpfulVote] = useState<"up" | "down" | null>(() => {
    try { return localStorage.getItem(`helpful_${area}`) as "up" | "down" | null; } catch { return null; }
  });

  const { data, isLoading, isError } = useQuery<AreaData>({
    queryKey: ["seo-area", city, area],
    queryFn: () => fetch(`${API}/seo/area/${city}/${area}`).then((r) => r.json()),
    enabled: !!city && !!area,
  });

  if (isLoading) return <SEOLayout><LoadingState /></SEOLayout>;
  if (isError || !data?.area) return <SEOLayout><ErrorState message="Area not found. Try browsing the city instead." /></SEOLayout>;

  const { city: cityInfo, area: areaInfo, nearby, stats } = data;
  const sentimentPositive = areaInfo.sentiment > 0;
  const totalVotes = areaInfo.upvotes + areaInfo.downvotes;
  const positivePercent = totalVotes > 0 ? Math.round((areaInfo.upvotes / totalVotes) * 100) : 0;
  const year = new Date().getFullYear();

  const pros = buildPros(areaInfo, positivePercent);
  const cons = buildCons(areaInfo, positivePercent);
  const whoFor = buildWhoFor(areaInfo);

  const similarAreas = nearby.filter(
    (n) => n.safety === areaInfo.safety || n.cost === areaInfo.cost || n.vibe.some((v) => areaInfo.vibe.includes(v))
  ).slice(0, 3);

  function handleHelpful(vote: "up" | "down") {
    const next = helpfulVote === vote ? null : vote;
    setHelpfulVote(next);
    try { if (next) localStorage.setItem(`helpful_${area}`, next); else localStorage.removeItem(`helpful_${area}`); } catch {}
  }

  const title = `Is ${areaInfo.text} Safe? Cost, Safety & Vibe Guide (${year})`;
  const metaDesc = `Explore safety, cost, and lifestyle in "${areaInfo.text}" based on real local insights. Safety: ${areaInfo.safety}/5 (${safetyLabel(areaInfo.safety)}). Cost: ${areaInfo.cost}. ${positivePercent}% positive community sentiment from ${totalVotes} votes.`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "PlaceLabels", "item": "https://placelabels.com" },
      { "@type": "ListItem", "position": 2, "name": cityInfo.name, "item": `https://placelabels.com/${cityInfo.slug}` },
      { "@type": "ListItem", "position": 3, "name": areaInfo.text, "item": `https://placelabels.com/${cityInfo.slug}/${areaInfo.slug}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Is ${areaInfo.text} safe?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${areaInfo.text} has a safety rating of ${areaInfo.safety}/5 based on ${totalVotes} local signals, which is considered "${safetyLabel(areaInfo.safety)}". ${positivePercent}% of community votes are positive.`,
        },
      },
      {
        "@type": "Question",
        "name": `What is the cost of living in ${areaInfo.text}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${areaInfo.text} is rated ${areaInfo.cost} (${COST_LABELS[areaInfo.cost] || areaInfo.cost}) — ${COST_DESC[areaInfo.cost] || "pricing data from community"}.`,
        },
      },
      {
        "@type": "Question",
        "name": `What is ${areaInfo.text} known for?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": areaInfo.vibe.length > 0
            ? `${areaInfo.text} is known for its ${areaInfo.vibe.slice(0, 3).join(", ")} character${areaInfo.category ? `, with notable ${areaInfo.category}` : ""}. Community sentiment score: ${areaInfo.sentiment > 0 ? "+" : ""}${areaInfo.sentiment}.`
            : `${areaInfo.text} is a neighborhood in ${cityInfo.name} with a community score of ${areaInfo.sentiment > 0 ? "+" : ""}${areaInfo.sentiment} from ${totalVotes} votes.`,
        },
      },
    ],
  };

  return (
    <SEOLayout
      breadcrumbs={[
        { label: cityInfo.name, href: `/${cityInfo.slug}` },
        { label: areaInfo.text },
      ]}
    >
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://placelabels.com/${cityInfo.slug}/${areaInfo.slug}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Freshness */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <Calendar className="h-3 w-3" />
        <span>Updated {getUpdatedLabel()} · Based on {totalVotes} real community signals</span>
      </div>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-teal-600 text-sm mb-2">
          <MapPin className="h-4 w-4" />
          <Link href={`/${cityInfo.slug}`} className="hover:underline font-medium">
            Best neighborhoods in {cityInfo.name}
          </Link>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Living in {areaInfo.text} – Complete Guide
        </h1>
        {areaInfo.category && (
          <span className="inline-block bg-teal-100 text-teal-800 text-sm font-medium rounded-full px-3 py-1 mb-3">
            {areaInfo.category}
          </span>
        )}
        <p className="text-gray-600 text-lg max-w-2xl">
          Crowd-sourced guide for <strong>{areaInfo.text}</strong> in{" "}
          <Link href={`/${cityInfo.slug}`} className="text-teal-700 hover:underline">{cityInfo.name}</Link>.
          Rated <strong>{safetyLabel(areaInfo.safety)}</strong> with{" "}
          <strong className={sentimentPositive ? "text-green-700" : "text-red-700"}>{positivePercent}% positive</strong> community sentiment
          from <strong>{totalVotes} local signals</strong>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBadge label="Safety Score" value={`${areaInfo.safety}/5`} color="bg-green-50 text-green-800" />
        <StatBadge label="Cost Level" value={areaInfo.cost} color="bg-blue-50 text-blue-800" />
        <StatBadge label="Community Score" value={`${areaInfo.sentiment > 0 ? "+" : ""}${areaInfo.sentiment}`} color={sentimentPositive ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"} />
        <StatBadge label="% Positive" value={`${positivePercent}%`} color="bg-purple-50 text-purple-800" />
      </div>

      {/* Overview */}
      <section className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl border border-teal-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Overview</h2>
        <p className="text-gray-700 leading-relaxed">
          <strong>{areaInfo.text}</strong> is a neighborhood in{" "}
          <Link href={`/${cityInfo.slug}`} className="text-teal-700 hover:underline">{cityInfo.name}</Link>{" "}
          with a <strong>safety rating of {areaInfo.safety}/5</strong> ({safetyLabel(areaInfo.safety)})
          and a cost level of <strong>{areaInfo.cost}</strong> ({COST_LABELS[areaInfo.cost] || areaInfo.cost}).
          {areaInfo.vibe.length > 0 && ` Locals describe it as ${areaInfo.vibe.slice(0, 3).map((v) => `"${v}"`).join(", ")}.`}
          {areaInfo.category && ` Known for: ${areaInfo.category}.`}
          {" "}Based on <strong>{totalVotes} community signals</strong>, <strong>{positivePercent}%</strong> of votes are positive.
          {stats && ` Including ${stats.labelCount} nearby data points, the area's average safety is ${stats.avgSafety}/5.`}
        </p>
      </section>

      {/* Safety section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">
            Is {areaInfo.text} Safe?
          </h2>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`text-xl ${star <= areaInfo.safety ? "text-amber-400" : "text-gray-200"}`}>★</span>
            ))}
          </div>
          <span className="text-2xl font-bold text-gray-900">{areaInfo.safety}/5</span>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${areaInfo.safety >= 4 ? "bg-green-100 text-green-700" : areaInfo.safety >= 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            {safetyLabel(areaInfo.safety)}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-2">
          <strong>Safety Score: {areaInfo.safety}/5 based on {totalVotes} local signals.</strong>{" "}
          {areaInfo.safety >= 4
            ? `${areaInfo.text} is considered a safe area. Great for families, solo travelers, and expats.`
            : areaInfo.safety >= 3
              ? `${areaInfo.text} has moderate safety. Exercise normal caution, especially at night.`
              : `${areaInfo.text} has below-average safety ratings. Be aware of your surroundings.`}
        </p>
        <p className="text-xs text-gray-400">
          Explore <Link href={`/${cityInfo.slug}/safe-neighborhoods`} className="text-teal-600 hover:underline">all safe neighborhoods in {cityInfo.name}</Link>.
          {stats && ` Nearby area average: ${stats.avgSafety}/5.`}
        </p>
      </section>

      {/* Cost of Living */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Cost of Living in {areaInfo.text}</h2>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl font-bold text-blue-700">{areaInfo.cost}</span>
          <span className="text-base font-semibold text-gray-700">{COST_LABELS[areaInfo.cost] || areaInfo.cost}</span>
        </div>
        <p className="text-gray-600 text-sm">
          <strong>Cost level: {areaInfo.cost} ({COST_LABELS[areaInfo.cost] || areaInfo.cost}).</strong>{" "}
          {COST_DESC[areaInfo.cost] || `${areaInfo.text} is rated ${areaInfo.cost} by the community.`}
          {" "}See <Link href={`/${cityInfo.slug}/affordable-areas`} className="text-teal-600 hover:underline">affordable areas in {cityInfo.name}</Link>.
        </p>
      </section>

      {/* Vibe */}
      {areaInfo.vibe.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Vibe & Character</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {areaInfo.vibe.map((v) => (
              <span key={v} className="bg-purple-50 border border-purple-200 text-purple-800 rounded-full px-4 py-1.5 text-sm font-medium">{v}</span>
            ))}
          </div>
          <p className="text-gray-600 text-sm">
            Locals describe {areaInfo.text} as {areaInfo.vibe.slice(0, 3).map((v) => `"${v}"`).join(", ")}.
            {areaInfo.category ? ` Known for: ${areaInfo.category}.` : ""}
          </p>
        </section>
      )}

      {/* Pros & Cons */}
      {(pros.length > 0 || cons.length > 0) && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pros & Cons of Living in {areaInfo.text}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {pros.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Pros
                </h3>
                <ul className="space-y-1.5">
                  {pros.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cons.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> Cons
                </h3>
                <ul className="space-y-1.5">
                  {cons.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Who Should Live Here */}
      {whoFor.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Who Should Live in {areaInfo.text}?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {whoFor.map(({ type, reason }) => (
              <div key={type} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{type}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sentiment Score */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold text-gray-900">Community Sentiment Score</h2>
        </div>
        <div className="flex items-center gap-6 mb-3">
          <div className="flex items-center gap-2 text-green-700">
            <ThumbsUp className="h-5 w-5" />
            <span className="text-xl font-bold">{areaInfo.upvotes}</span>
            <span className="text-sm text-gray-600">found it great</span>
          </div>
          <div className="flex items-center gap-2 text-red-700">
            <ThumbsDown className="h-5 w-5" />
            <span className="text-xl font-bold">{areaInfo.downvotes}</span>
            <span className="text-sm text-gray-600">had issues</span>
          </div>
        </div>
        {totalVotes > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${positivePercent}%` }} />
              </div>
              <span className={`text-sm font-bold ${positivePercent >= 70 ? "text-green-700" : positivePercent >= 50 ? "text-yellow-700" : "text-red-700"}`}>
                {positivePercent}% positive
              </span>
            </div>
            <p className="text-xs text-gray-400">Sentiment Score: {areaInfo.sentiment > 0 ? "+" : ""}{areaInfo.sentiment} based on {totalVotes} community signals</p>
          </div>
        )}
      </section>

      {/* Local Insights nearby */}
      {nearby.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Local Insights Near {areaInfo.text}</h2>
            <Link href={`/${cityInfo.slug}`} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
              All in {cityInfo.name} <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3">
            {nearby.slice(0, 5).map((n) => (
              <AreaCard
                key={n.id}
                text={n.text}
                citySlug={cityInfo.slug}
                areaSlug={n.slug || slugify(n.text)}
                safety={n.safety}
                cost={n.cost}
                vibes={n.vibe}
                sentiment={n.sentiment}
              />
            ))}
          </div>
        </section>
      )}

      {/* Similar areas */}
      {similarAreas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-2">Explore Similar Areas</h2>
          <p className="text-xs text-gray-400 mb-2">
            Areas with similar safety or <Link href={`/${cityInfo.slug}/affordable-areas`} className="text-teal-600 hover:underline">{areaInfo.cost} cost of living in {cityInfo.name}</Link>:
          </p>
          <div className="flex flex-wrap gap-2">
            {similarAreas.map((n) => (
              <Link key={n.id} href={`/${cityInfo.slug}/${n.slug || slugify(n.text)}`} className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-colors">
                {n.text} ({n.cost}, {n.safety}/5★)
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Is {areaInfo.text} a Good Place to Live?</h2>
        <div className="space-y-3">
          {[
            {
              q: `Is ${areaInfo.text} safe?`,
              a: `${areaInfo.text} has a safety score of ${areaInfo.safety}/5 based on ${totalVotes} local signals — rated "${safetyLabel(areaInfo.safety)}". ${positivePercent}% of community votes are positive. ${areaInfo.safety >= 4 ? "This is one of the safer areas in " + cityInfo.name + "." : ""}`,
            },
            {
              q: `What is the cost of living in ${areaInfo.text}?`,
              a: `${areaInfo.text} is rated ${areaInfo.cost} (${COST_LABELS[areaInfo.cost] || areaInfo.cost}) — ${COST_DESC[areaInfo.cost] || ""}`,
            },
            {
              q: `What is ${areaInfo.text} known for?`,
              a: areaInfo.vibe.length > 0
                ? `${areaInfo.text} is known for its ${areaInfo.vibe.join(", ")} vibe${areaInfo.category ? ` and ${areaInfo.category}` : ""}. Community sentiment: ${areaInfo.sentiment > 0 ? "+" : ""}${areaInfo.sentiment}.`
                : `${areaInfo.text} is a neighborhood in ${cityInfo.name} with a community score of ${areaInfo.sentiment > 0 ? "+" : ""}${areaInfo.sentiment} from ${totalVotes} votes.`,
            },
          ].map(({ q, a }) => (
            <details key={q} className="bg-white rounded-xl border border-gray-200 group">
              <summary className="px-5 py-4 cursor-pointer font-semibold text-gray-900 flex items-center justify-between list-none">
                {q}
                <span className="text-teal-600 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Was this helpful? */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Was this guide helpful?</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleHelpful("up")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${helpfulVote === "up" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:text-green-700"}`}
          >
            <ThumbsUp className="h-4 w-4" />
            Yes, helpful
          </button>
          <button
            onClick={() => handleHelpful("down")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${helpfulVote === "down" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600"}`}
          >
            <ThumbsDown className="h-4 w-4" />
            Needs improvement
          </button>
          {helpfulVote === "up" && <span className="text-xs text-green-700">Thanks for the feedback!</span>}
          {helpfulVote === "down" && <span className="text-xs text-gray-500">We'll work to improve this.</span>}
        </div>
      </section>

      {/* SEO prose */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">About {areaInfo.text} in {cityInfo.name}</h2>
        <div className="prose prose-sm text-gray-600 max-w-none space-y-3">
          <p>
            <strong>Is {areaInfo.text} safe?</strong> It earns a <strong>{areaInfo.safety}/5 safety score</strong> ({safetyLabel(areaInfo.safety)}) from {totalVotes} community signals — <strong>{positivePercent}% positive</strong>.
            {areaInfo.safety >= 4
              ? ` It's one of the ${safetyLabel(areaInfo.safety).toLowerCase()} areas in ${cityInfo.name}, great for families and expats.`
              : ` Exercise normal caution when visiting.`}
          </p>
          <p>
            <strong>Cost of living in {areaInfo.text}:</strong> Rated <strong>{areaInfo.cost}</strong> ({COST_LABELS[areaInfo.cost] || areaInfo.cost}).
            {areaInfo.vibe.length > 0 && ` Locals describe the vibe as ${areaInfo.vibe.map((v) => `"${v}"`).join(", ")}.`}
            {(areaInfo.cost === "$" || areaInfo.cost === "$$") && (
              <>{" "}Looking for more budget options? See all{" "}
                <Link href={`/${cityInfo.slug}/affordable-areas`} className="text-teal-700 hover:underline">affordable areas in {cityInfo.name}</Link>
                {["mumbai", "delhi", "bangalore", "pune", "hyderabad"].includes(cityInfo.slug) && (
                  <> or the full{" "}
                    <Link href={`/${cityInfo.slug}/cheap-areas-to-live`} className="text-teal-700 hover:underline">cheap areas guide for {cityInfo.name}</Link>
                  </>
                )}.
              </>
            )}
          </p>
          <p>
            Explore more{" "}
            <Link href={`/${cityInfo.slug}`} className="text-teal-700 hover:underline">neighborhoods in {cityInfo.name}</Link>,
            or find the{" "}
            <Link href={`/${cityInfo.slug}/safe-neighborhoods`} className="text-teal-700 hover:underline">safest neighborhoods in {cityInfo.name}</Link>,{" "}
            <Link href={`/${cityInfo.slug}/affordable-areas`} className="text-teal-700 hover:underline">affordable areas in {cityInfo.name}</Link>,{" "}
            and <Link href={`/${cityInfo.slug}/best-areas-for-young-professionals`} className="text-teal-700 hover:underline">best areas for professionals in {cityInfo.name}</Link>.
          </p>
          {/* City-specific comparison links */}
          {cityInfo.slug === "delhi" && (
            <p>Considering a move? Compare:{" "}
              <Link href="/compare/delhi-vs-gurgaon" className="text-teal-700 hover:underline">Delhi vs Gurgaon</Link>,{" "}
              <Link href="/compare/delhi-vs-mumbai" className="text-teal-700 hover:underline">Delhi vs Mumbai</Link>,{" "}
              <Link href="/compare/delhi-vs-noida" className="text-teal-700 hover:underline">Delhi vs Noida</Link>.
            </p>
          )}
          {cityInfo.slug === "mumbai" && (
            <p>Considering a move? Compare:{" "}
              <Link href="/compare/mumbai-vs-pune" className="text-teal-700 hover:underline">Mumbai vs Pune</Link>,{" "}
              <Link href="/compare/delhi-vs-mumbai" className="text-teal-700 hover:underline">Delhi vs Mumbai</Link>,{" "}
              <Link href="/compare/kolkata-vs-mumbai" className="text-teal-700 hover:underline">Kolkata vs Mumbai</Link>.
            </p>
          )}
          {cityInfo.slug === "bangalore" && (
            <p>Considering a move? Compare:{" "}
              <Link href="/compare/bangalore-vs-hyderabad" className="text-teal-700 hover:underline">Bangalore vs Hyderabad</Link>,{" "}
              <Link href="/compare/bangalore-vs-pune" className="text-teal-700 hover:underline">Bangalore vs Pune</Link>,{" "}
              <Link href="/compare/chennai-vs-bangalore" className="text-teal-700 hover:underline">Chennai vs Bangalore</Link>.{" "}
              Also see <Link href="/bangalore/it-hub-areas" className="text-teal-700 hover:underline">IT hub areas in Bangalore</Link>.
            </p>
          )}
          {cityInfo.slug === "pune" && (
            <p>Considering a move? Compare:{" "}
              <Link href="/compare/mumbai-vs-pune" className="text-teal-700 hover:underline">Mumbai vs Pune</Link>,{" "}
              <Link href="/compare/bangalore-vs-pune" className="text-teal-700 hover:underline">Bangalore vs Pune</Link>.{" "}
              Also see <Link href="/pune/student-friendly-areas" className="text-teal-700 hover:underline">student-friendly areas in Pune</Link>.
            </p>
          )}
          {cityInfo.slug === "hyderabad" && (
            <p>Considering a move? Compare:{" "}
              <Link href="/compare/bangalore-vs-hyderabad" className="text-teal-700 hover:underline">Bangalore vs Hyderabad</Link>,{" "}
              <Link href="/compare/hyderabad-vs-pune" className="text-teal-700 hover:underline">Hyderabad vs Pune</Link>,{" "}
              <Link href="/compare/chennai-vs-hyderabad" className="text-teal-700 hover:underline">Chennai vs Hyderabad</Link>.
            </p>
          )}
          {cityInfo.slug === "chennai" && (
            <p>Considering a move? Compare:{" "}
              <Link href="/compare/chennai-vs-bangalore" className="text-teal-700 hover:underline">Chennai vs Bangalore</Link>,{" "}
              <Link href="/compare/chennai-vs-hyderabad" className="text-teal-700 hover:underline">Chennai vs Hyderabad</Link>.
            </p>
          )}
        </div>
      </section>

      {/* Compare CTA */}
      <div className="bg-gradient-to-r from-teal-50 to-purple-50 rounded-2xl border border-teal-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <GitCompare className="h-4 w-4 text-teal-600" />
          <h3 className="font-bold text-gray-900">Is {areaInfo.text} right for you?</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">Compare it with other areas or explore all of {cityInfo.name}.</p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${cityInfo.slug}`} className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-teal-700 transition-colors">
            All {cityInfo.name} neighborhoods →
          </Link>
          <Link href={`/${cityInfo.slug}/safe-neighborhoods`} className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg px-4 py-2 hover:border-teal-300 transition-colors">
            🛡️ Safest areas
          </Link>
          <Link href={`/${cityInfo.slug}/affordable-areas`} className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg px-4 py-2 hover:border-teal-300 transition-colors">
            💰 Cheapest areas
          </Link>
        </div>
      </div>
    </SEOLayout>
  );
}
