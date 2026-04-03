import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { MapPin, TrendingUp, Shield, DollarSign, Star, Music, Home, GraduationCap, Briefcase, Leaf, Calendar } from "lucide-react";
import { SEOLayout, API, StatBadge, AreaCard, LoadingState, ErrorState, safetyLabel, slugify } from "./SEOLayout";

interface CityData {
  city: { slug: string; name: string; country: string };
  stats: {
    avgSafety: number;
    modeCost: string;
    vibes: string[];
    sentiment: number;
    totalUpvotes: number;
    labelCount: number;
    topLabel: string;
  };
  areas: Array<{
    id: string;
    slug: string;
    text: string;
    safety: number;
    cost: string;
    vibe: string[];
    sentiment: number;
    upvotes: number;
    downvotes: number;
    category: string | null;
  }>;
  intents: Array<{ slug: string; label: string; url: string }>;
}

const PRIMARY_INTENT_ICONS: Record<string, string> = {
  "safe-neighborhoods": "🛡️",
  "affordable-areas": "💰",
  "nightlife-areas": "🎉",
  "family-friendly": "👨‍👩‍👧‍👦",
};

const SECONDARY_INTENT_ICONS: Record<string, string> = {
  "best-areas-for-students": "🎓",
  "best-areas-for-young-professionals": "💼",
  "quiet-neighborhoods": "🌿",
  "expensive-neighborhoods": "💎",
};

const COST_FULL: Record<string, string> = {
  "$": "very affordable (budget-friendly)",
  "$$": "affordable (mid-range)",
  "$$$": "moderately expensive",
  "$$$$": "expensive (premium)",
};

function getUpdatedLabel(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function CityPage() {
  const { city } = useParams<{ city: string }>();

  const { data, isLoading, isError } = useQuery<CityData>({
    queryKey: ["seo-city", city],
    queryFn: () => fetch(`${API}/seo/city/${city}`).then((r) => r.json()),
    enabled: !!city,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  // Placeholder meta tags for loading/error states
  const placeholderTitle = `${city ? city.charAt(0).toUpperCase() + city.slice(1) : "City"} Neighborhoods | PlaceLabels`;
  const placeholderDescription = "Discover real neighborhood vibes from locals. Check safety, cost, and local vibes for every neighborhood.";

  if (isLoading) {
    return (
      <SEOLayout>
        <>
          <Helmet>
            <title>{placeholderTitle}</title>
            <meta name="description" content={placeholderDescription} />
            <meta property="og:title" content={placeholderTitle} />
            <meta property="og:description" content={placeholderDescription} />
            <link rel="canonical" href={`https://placelabels.com/${city}`} />
          </Helmet>
          <LoadingState />
        </>
      </SEOLayout>
    );
  }
  if (isError || !data?.city) {
    return (
      <SEOLayout>
        <>
          <Helmet>
            <title>City Not Found | PlaceLabels</title>
            <meta name="description" content="The city you're looking for doesn't have community data yet." />
            <link rel="canonical" href={`https://placelabels.com/${city}`} />
          </Helmet>
          <ErrorState message="City not found. Try exploring the map instead." />
        </>
      </SEOLayout>
    );
  }

  const { city: cityInfo, stats, areas, intents } = data;
  const top5 = areas.slice(0, 5);
  const top10 = areas.slice(0, 10);
  const safeAreas = areas.filter((a) => a.safety >= 4).slice(0, 6);
  const affordableAreas = areas.filter((a) => ["$", "$$"].includes(a.cost)).slice(0, 6);
  const nightlifeAreas = areas.filter((a) => (a.vibe ?? []).some((v) => ["Nightlife", "Bars", "Loud"].includes(v)) || a.category === "Bars").slice(0, 5);
  const familyAreas = areas.filter((a) => (a.vibe ?? []).includes("Family") || a.category === "Parks").slice(0, 5);

  const primaryIntents = intents.filter((i) => Object.keys(PRIMARY_INTENT_ICONS).includes(i.slug));
  const secondaryIntents = intents.filter((i) => Object.keys(SECONDARY_INTENT_ICONS).includes(i.slug));

  const year = new Date().getFullYear();
  const title = `${stats.labelCount} Best Neighborhoods in ${cityInfo.name} (Safe, Affordable & Ranked ${year})`;
  const description = `Discover the ${stats.labelCount} best neighborhoods in ${cityInfo.name} based on ${stats.labelCount} real community signals. Safety: ${stats.avgSafety}/5. Cost: ${stats.modeCost}. Top area: "${stats.topLabel}". Find where to live, visit & explore.`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "PlaceLabels", "item": "https://placelabels.com" },
      { "@type": "ListItem", "position": 2, "name": cityInfo.name, "item": `https://placelabels.com/${cityInfo.slug}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What are the best neighborhoods in ${cityInfo.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `The top-rated neighborhoods in ${cityInfo.name} based on ${stats.labelCount} community signals are: ${top5.map((a) => a.text).join(", ")}. These areas have the highest community sentiment scores.`,
        },
      },
      {
        "@type": "Question",
        "name": `Is ${cityInfo.name} safe to live in?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${cityInfo.name} has an average safety rating of ${stats.avgSafety}/5 across ${stats.labelCount} community insights, which is considered "${safetyLabel(stats.avgSafety)}". Safest areas include ${safeAreas.slice(0, 3).map((a) => a.text).join(", ")}.`,
        },
      },
      {
        "@type": "Question",
        "name": `What is the cost of living in ${cityInfo.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Most areas in ${cityInfo.name} are rated ${stats.modeCost} (${COST_FULL[stats.modeCost] || stats.modeCost}) by the community. Budget-friendly options include ${affordableAreas.slice(0, 2).map((a) => a.text).join(" and ")}.`,
        },
      },
      {
        "@type": "Question",
        "name": `Where should I live in ${cityInfo.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Where to live in ${cityInfo.name} depends on your priorities. For safety, consider ${safeAreas.slice(0, 2).map((a) => a.text).join(" or ")}. For affordability, look at ${affordableAreas.slice(0, 2).map((a) => a.text).join(" or ")}. For nightlife, ${nightlifeAreas.slice(0, 2).map((a) => a.text).join(" or ")} are community favorites.`,
        },
      },
    ],
  };

  return (
    <SEOLayout breadcrumbs={[{ label: cityInfo.name }]}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://placelabels.com/${cityInfo.slug}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Freshness badge */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <Calendar className="h-3 w-3" />
        <span>Updated {getUpdatedLabel()} · Based on {stats.labelCount} real local signals · Safety score {stats.avgSafety}/5</span>
      </div>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-teal-600 text-sm mb-2">
          <MapPin className="h-4 w-4" />
          <span>{cityInfo.country}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {stats.labelCount} Best Neighborhoods in {cityInfo.name} ({year})
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
          Based on <strong>{stats.labelCount} real local signals</strong> — safety, cost, and vibe data from actual residents and visitors.
          Average safety: <strong>{stats.avgSafety}/5 ({safetyLabel(stats.avgSafety)})</strong>. Typical cost: <strong>{stats.modeCost}</strong>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBadge label="Safety Score" value={`${stats.avgSafety}/5`} color="bg-green-50 text-green-800" />
        <StatBadge label="Typical Cost" value={stats.modeCost} color="bg-blue-50 text-blue-800" />
        <StatBadge label="Community Score" value={`+${stats.sentiment}`} color="bg-purple-50 text-purple-800" />
        <StatBadge label="Local Signals" value={stats.labelCount} color="bg-orange-50 text-orange-800" />
      </div>

      {/* Overview */}
      <section className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl border border-teal-100 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Overview: Where to Live in {cityInfo.name}</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          {cityInfo.name} has <strong>{stats.labelCount} verified neighborhood signals</strong> covering safety, cost of living, and local vibes.
          The community rates the city <strong>{stats.avgSafety}/5 for safety</strong> ({safetyLabel(stats.avgSafety)}) with most areas in the <strong>{stats.modeCost}</strong> price range.
          The standout area is <strong>"{stats.topLabel}"</strong> — the city's highest-rated neighborhood.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Popular local vibes: {stats.vibes.slice(0, 4).map((v) => `"${v}"`).join(", ")}.
          Whether you're looking for <Link href={`/${cityInfo.slug}/safe-neighborhoods`} className="text-teal-700 font-medium hover:underline">the safest neighborhoods in {cityInfo.name}</Link>,{" "}
          <Link href={`/${cityInfo.slug}/affordable-areas`} className="text-teal-700 font-medium hover:underline">cheap areas in {cityInfo.name}</Link>, or{" "}
          <Link href={`/${cityInfo.slug}/nightlife-areas`} className="text-teal-700 font-medium hover:underline">the best nightlife neighborhoods in {cityInfo.name}</Link>,
          this guide has you covered.
        </p>
      </section>

      {/* Browse by Need — primary */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Browse {cityInfo.name} by Need</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {primaryIntents.map((intent) => (
            <Link key={intent.slug} href={`/${cityInfo.slug}/${intent.slug}`}>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-teal-300 hover:shadow-md transition-all cursor-pointer">
                <div className="text-2xl mb-1">{PRIMARY_INTENT_ICONS[intent.slug] || "📍"}</div>
                <p className="text-sm font-semibold text-gray-800">{intent.label}</p>
              </div>
            </Link>
          ))}
        </div>
        {/* Secondary intent pills */}
        {secondaryIntents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {secondaryIntents.map((intent) => (
              <Link key={intent.slug} href={`/${cityInfo.slug}/${intent.slug}`}>
                <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-1.5 text-sm hover:border-purple-300 hover:text-purple-700 transition-colors cursor-pointer">
                  <span>{SECONDARY_INTENT_ICONS[intent.slug]}</span>
                  {intent.label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top Neighborhoods table */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-bold text-gray-900">Top {top5.length} Neighborhoods in {cityInfo.name} (Ranked)</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Ranked by community sentiment score based on {stats.totalUpvotes.toLocaleString()} upvotes from real locals.</p>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium w-8">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Neighborhood</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">Safety</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">Cost</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium hidden sm:table-cell">Score</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium hidden sm:table-cell">% Pos</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {top5.map((area, i) => {
                const totalVotes = area.upvotes + area.downvotes;
                const pct = totalVotes > 0 ? Math.round((area.upvotes / totalVotes) * 100) : 0;
                return (
                  <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-bold">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/${cityInfo.slug}/${area.slug || slugify(area.text)}`} className="font-medium text-gray-900 hover:text-teal-700 transition-colors">
                        {area.text}
                      </Link>
                      {area.vibe.length > 0 && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {area.vibe.slice(0, 2).map((v) => (
                            <span key={v} className="text-xs text-gray-400">{v}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="text-center px-3 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${area.safety >= 4 ? "bg-green-100 text-green-700" : area.safety >= 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                        {area.safety}/5
                      </span>
                    </td>
                    <td className="text-center px-3 py-3 font-medium text-gray-700">{area.cost}</td>
                    <td className={`text-center px-3 py-3 font-bold hidden sm:table-cell ${area.sentiment > 0 ? "text-green-700" : "text-red-700"}`}>
                      {area.sentiment > 0 ? "+" : ""}{area.sentiment}
                    </td>
                    <td className="text-center px-3 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-semibold ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {top10.slice(5).length > 0 && (
          <div className="grid gap-3">
            {top10.slice(5).map((area, i) => (
              <AreaCard
                key={area.id}
                text={area.text}
                citySlug={cityInfo.slug}
                areaSlug={area.slug || slugify(area.text)}
                safety={area.safety}
                cost={area.cost}
                vibes={area.vibe}
                sentiment={area.sentiment}
                rank={i + 6}
              />
            ))}
          </div>
        )}
      </section>

      {/* Safest Areas */}
      {safeAreas.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Safest Neighborhoods in {cityInfo.name}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Areas rated 4/5 or higher for safety based on {stats.labelCount} local signals. Perfect for{" "}
            <Link href={`/${cityInfo.slug}/family-friendly`} className="text-teal-600 hover:underline">families</Link> and solo travelers.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {safeAreas.map((area) => (
              <Link key={area.id} href={`/${cityInfo.slug}/${area.slug || slugify(area.text)}`}>
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{area.text}</p>
                    <p className="text-xs text-gray-400">{area.cost} · {area.vibe.slice(0, 2).join(", ")}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold bg-green-100 text-green-700 rounded-full px-2 py-0.5 ml-3">{area.safety}/5 ★</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <Link href={`/${cityInfo.slug}/safe-neighborhoods`} className="text-sm text-teal-600 hover:underline font-medium">
              → See all {safeAreas.length}+ safest neighborhoods in {cityInfo.name}
            </Link>
          </div>
        </section>
      )}

      {/* Affordable Areas */}
      {affordableAreas.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Affordable Areas in {cityInfo.name}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Budget-friendly neighborhoods rated $ or $$ — the cheapest places to live in {cityInfo.name} according to community data.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {affordableAreas.map((area) => (
              <Link key={area.id} href={`/${cityInfo.slug}/${area.slug || slugify(area.text)}`}>
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{area.text}</p>
                    <p className="text-xs text-gray-400">{area.safety}/5 safety · {area.vibe.slice(0, 1).join(", ")}</p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-blue-700 ml-3">{area.cost}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <Link href={`/${cityInfo.slug}/affordable-areas`} className="text-sm text-teal-600 hover:underline font-medium">
              → See all affordable areas in {cityInfo.name}
            </Link>
          </div>
        </section>
      )}

      {/* Nightlife */}
      {nightlifeAreas.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Music className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Best Nightlife Areas in {cityInfo.name}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Neighborhoods with bars, clubs, and after-dark energy — {cityInfo.name}'s best nightlife scene according to locals.</p>
          <div className="grid gap-3">
            {nightlifeAreas.map((area) => (
              <AreaCard key={area.id} text={area.text} citySlug={cityInfo.slug} areaSlug={area.slug || slugify(area.text)} safety={area.safety} cost={area.cost} vibes={area.vibe} sentiment={area.sentiment} />
            ))}
          </div>
          <div className="mt-3">
            <Link href={`/${cityInfo.slug}/nightlife-areas`} className="text-sm text-teal-600 hover:underline font-medium">
              → See all best nightlife neighborhoods in {cityInfo.name}
            </Link>
          </div>
        </section>
      )}

      {/* Family-friendly */}
      {familyAreas.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-5 w-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Family-Friendly Neighborhoods in {cityInfo.name}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Quiet, safe areas with parks and community vibe — top family neighborhoods in {cityInfo.name}.</p>
          <div className="grid gap-3">
            {familyAreas.map((area) => (
              <AreaCard key={area.id} text={area.text} citySlug={cityInfo.slug} areaSlug={area.slug || slugify(area.text)} safety={area.safety} cost={area.cost} vibes={area.vibe} sentiment={area.sentiment} />
            ))}
          </div>
          <div className="mt-3">
            <Link href={`/${cityInfo.slug}/family-friendly`} className="text-sm text-teal-600 hover:underline font-medium">
              → See all family-friendly neighborhoods in {cityInfo.name}
            </Link>
          </div>
        </section>
      )}

      {/* Secondary intent quicklinks */}
      {secondaryIntents.length > 0 && (
        <section className="mb-10 bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">More {cityInfo.name} Neighborhood Guides</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {secondaryIntents.map((intent) => (
              <Link key={intent.slug} href={`/${cityInfo.slug}/${intent.slug}`}>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer">
                  <span className="text-lg">{SECONDARY_INTENT_ICONS[intent.slug]}</span>
                  <span className="text-sm font-medium text-gray-800">{intent.label} in {cityInfo.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Vibes */}
      {stats.vibes.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold text-gray-900">What Locals Say About {cityInfo.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.vibes.map((v) => (
              <span key={v} className="bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-4 py-1.5 text-sm font-medium">{v}</span>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions About {cityInfo.name}</h2>
        <div className="space-y-3">
          {[
            {
              q: `What are the best neighborhoods in ${cityInfo.name}?`,
              a: `The top-rated neighborhoods in ${cityInfo.name} based on ${stats.labelCount} community signals are: ${top5.map((a) => a.text).join(", ")}. Ranked by community sentiment score.`,
            },
            {
              q: `Is ${cityInfo.name} safe to live in?`,
              a: `${cityInfo.name} has an average safety rating of ${stats.avgSafety}/5 across ${stats.labelCount} crowd-sourced data points — considered "${safetyLabel(stats.avgSafety)}". ${safeAreas.length} areas score 4/5 or higher for safety.`,
            },
            {
              q: `What is the cost of living in ${cityInfo.name}?`,
              a: `Most areas in ${cityInfo.name} fall in the ${stats.modeCost} (${COST_FULL[stats.modeCost] || stats.modeCost}) cost bracket according to ${stats.labelCount} community data points. Budget-friendly options include ${affordableAreas.slice(0, 3).map((a) => a.text).join(", ")}.`,
            },
            {
              q: `Where should I live in ${cityInfo.name}?`,
              a: `It depends on your priorities. For safety: ${safeAreas.slice(0, 2).map((a) => a.text).join(", ")}. For affordability: ${affordableAreas.slice(0, 2).map((a) => a.text).join(", ")}. For nightlife: ${nightlifeAreas.slice(0, 2).map((a) => a.text).join(", ")}.`,
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

      {/* SEO prose */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Where to Live in {cityInfo.name} — {year} Guide
        </h2>
        <div className="prose prose-sm text-gray-600 max-w-none space-y-3">
          <p>
            Looking for the <strong>best neighborhoods in {cityInfo.name}</strong>? Our crowd-sourced guide covers {stats.labelCount} areas based on real local signals.
            The city earns an overall safety rating of <strong>{stats.avgSafety}/5</strong> ({safetyLabel(stats.avgSafety)}),
            with a typical cost of <strong>{stats.modeCost}</strong>.
          </p>
          <p>
            The highest-rated neighborhood is <strong>"{stats.topLabel}"</strong>.
            Popular local vibes: {stats.vibes.slice(0, 4).map((v) => `"${v}"`).join(", ")}.
          </p>
          <p>
            Use our guides to narrow your search:{" "}
            <Link href={`/${cityInfo.slug}/safe-neighborhoods`} className="text-teal-700 hover:underline">safest neighborhoods in {cityInfo.name}</Link>,{" "}
            <Link href={`/${cityInfo.slug}/affordable-areas`} className="text-teal-700 hover:underline">affordable areas in {cityInfo.name}</Link>,{" "}
            <Link href={`/${cityInfo.slug}/nightlife-areas`} className="text-teal-700 hover:underline">best nightlife neighborhoods in {cityInfo.name}</Link>,{" "}
            <Link href={`/${cityInfo.slug}/family-friendly`} className="text-teal-700 hover:underline">family-friendly neighborhoods in {cityInfo.name}</Link>,{" "}
            <Link href={`/${cityInfo.slug}/best-areas-for-students`} className="text-teal-700 hover:underline">best areas for students in {cityInfo.name}</Link>, and{" "}
            <Link href={`/${cityInfo.slug}/quiet-neighborhoods`} className="text-teal-700 hover:underline">quiet neighborhoods in {cityInfo.name}</Link>.
          </p>
        </div>
      </section>
    </SEOLayout>
  );
}
