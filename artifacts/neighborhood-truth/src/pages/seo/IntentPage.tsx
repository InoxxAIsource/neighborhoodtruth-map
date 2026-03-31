import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Filter, CheckCircle } from "lucide-react";
import { SEOLayout, API, StatBadge, AreaCard, LoadingState, ErrorState, safetyLabel, slugify } from "./SEOLayout";

interface IntentData {
  city: { slug: string; name: string };
  intent: { slug: string; key: string; label: string };
  stats: {
    avgSafety: number;
    modeCost: string;
    vibes: string[];
    sentiment: number;
    labelCount: number;
  } | null;
  areas: Array<{
    id: string;
    slug: string;
    text: string;
    lat: number;
    lng: number;
    safety: number;
    cost: string;
    vibe: string[];
    sentiment: number;
    upvotes: number;
    downvotes: number;
    url: string;
  }>;
  allIntents: Array<{ slug: string; label: string; url: string; active: boolean }>;
}

interface IntentMeta {
  emoji: string;
  headline: (city: string, year: number) => string;
  intro: (city: string, count: number, avgSafety: number) => string;
  why: (city: string, count: number, avgSafety: number, cost: string) => string;
  criteria: string[];
}

const INTENT_META: Record<string, IntentMeta> = {
  safe: {
    emoji: "🛡️",
    headline: (city, year) => `Safest Neighborhoods in ${city} (${year})`,
    intro: (city, count, avg) =>
      `Discover the ${count} safest areas in ${city}, rated ${avg}/5 or higher for safety by locals and visitors. These neighborhoods are considered ${safetyLabel(avg)} — ideal for families, solo travelers, and anyone prioritizing peace of mind.`,
    why: (city, count, avg) =>
      `These ${count} neighborhoods in ${city} were selected because they each score 4/5 or higher on community safety ratings. With an average safety score of ${avg}/5 across all filtered areas, they represent the most trusted and well-regarded parts of ${city} according to real locals.`,
    criteria: ["Safety rating ≥ 4/5", "Positive community sentiment", "Verified by multiple locals"],
  },
  affordable: {
    emoji: "💰",
    headline: (city, year) => `Affordable Areas in ${city} (${year})`,
    intro: (city, count) =>
      `Explore ${count} budget-friendly neighborhoods in ${city} where you can live, eat, and explore without breaking the bank. These areas are rated $ or $$ by the community — great value for money.`,
    why: (city, count) =>
      `These ${count} areas are the most affordable in ${city} based on community cost ratings. They're rated $ (Budget) or $$ (Affordable), offering the best value without sacrificing too much on amenities or safety.`,
    criteria: ["Cost rating $ or $$", "Good value for money", "Community-verified pricing"],
  },
  nightlife: {
    emoji: "🎉",
    headline: (city, year) => `Best Nightlife Areas in ${city} (${year})`,
    intro: (city, count) =>
      `${city} has ${count} vibrant nightlife hotspots according to locals. From underground bars to lively party districts, these neighborhoods come alive after dark.`,
    why: (city, count) =>
      `These ${count} areas in ${city} were flagged by the community for nightlife, bars, and after-dark energy. Locals have tagged them with vibes like "Nightlife", "Bars", and "Loud" — a reliable signal that these areas are the go-to spots when the sun goes down.`,
    criteria: ["Tagged with Nightlife or Bars vibe", "Active after dark", "Community-endorsed"],
  },
  family: {
    emoji: "👨‍👩‍👧‍👦",
    headline: (city, year) => `Family-Friendly Neighborhoods in ${city} (${year})`,
    intro: (city, count) =>
      `Discover ${count} family-friendly areas in ${city} loved by locals for their parks, safe streets, and community vibe. Perfect for raising kids or enjoying a relaxed, wholesome lifestyle.`,
    why: (city, count) =>
      `These ${count} areas in ${city} have been flagged by the community as family-friendly — they feature parks, quiet streets, and a safe, welcoming environment. Locals with children have given them high safety ratings and positive sentiment.`,
    criteria: ["Family vibe or parks category", "High safety ratings", "Positive community feedback"],
  },
};

const COST_LABEL: Record<string, string> = { "$": "Budget", "$$": "Affordable", "$$$": "Mid-range", "$$$$": "Luxury" };

export default function IntentPage() {
  const params = useParams<{ city: string }>();
  const city = params.city;
  const path = window.location.pathname;
  const intentSlug = path.split("/").pop() || "";

  const { data, isLoading, isError } = useQuery<IntentData>({
    queryKey: ["seo-intent", city, intentSlug],
    queryFn: () => fetch(`${API}/seo/intent/${city}/${intentSlug}`).then((r) => r.json()),
    enabled: !!city && !!intentSlug,
  });

  if (isLoading) return <SEOLayout><LoadingState /></SEOLayout>;
  if (isError || !data?.city) return <SEOLayout><ErrorState message="Page not found. Try browsing the city instead." /></SEOLayout>;

  const { city: cityInfo, intent, stats, areas, allIntents } = data;
  const meta = INTENT_META[intent.key] ?? INTENT_META.safe;
  const year = new Date().getFullYear();
  const top5 = areas.slice(0, 5);

  const title = `${meta.headline(cityInfo.name, year)} — HoodSignal`;
  const description = stats
    ? meta.intro(cityInfo.name, areas.length, stats.avgSafety)
    : `${intent.label} in ${cityInfo.name} — crowd-sourced neighborhood guide.`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "HoodSignal", "item": "https://hoodsignal.com" },
      { "@type": "ListItem", "position": 2, "name": cityInfo.name, "item": `https://hoodsignal.com/${cityInfo.slug}` },
      { "@type": "ListItem", "position": 3, "name": intent.label, "item": `https://hoodsignal.com/${cityInfo.slug}/${intent.slug}` },
    ],
  };

  return (
    <SEOLayout
      breadcrumbs={[
        { label: cityInfo.name, href: `/${cityInfo.slug}` },
        { label: intent.label },
      ]}
    >
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://hoodsignal.com/${cityInfo.slug}/${intent.slug}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Hero */}
      <div className="mb-8">
        <div className="text-4xl mb-3">{meta.emoji}</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {meta.headline(cityInfo.name, year)}
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <StatBadge label="Avg Safety" value={`${stats.avgSafety}/5`} color="bg-green-50 text-green-800" />
          <StatBadge label="Typical Cost" value={stats.modeCost} color="bg-blue-50 text-blue-800" />
          <StatBadge label="Areas Found" value={areas.length} color="bg-teal-50 text-teal-800" />
        </div>
      )}

      {/* Filter tabs */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">More guides for {cityInfo.name}:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allIntents.map((i) => (
            <Link
              key={i.slug}
              href={`/${cityInfo.slug}/${i.slug}`}
              className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
                i.active
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-teal-300"
              }`}
            >
              {i.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Comparison table for top 5 */}
      {top5.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Top {intent.label} in {cityInfo.name}
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Area</th>
                  <th className="text-center px-3 py-3 text-gray-500 font-medium">Safety</th>
                  <th className="text-center px-3 py-3 text-gray-500 font-medium">Cost</th>
                  <th className="text-left px-3 py-3 text-gray-500 font-medium hidden sm:table-cell">Vibe</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {top5.map((area, i) => (
                  <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/${cityInfo.slug}/${area.slug || slugify(area.text)}`} className="font-medium text-gray-900 hover:text-teal-700 transition-colors">
                        {area.text}
                      </Link>
                    </td>
                    <td className="text-center px-3 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${area.safety >= 4 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {area.safety}/5
                      </span>
                    </td>
                    <td className="text-center px-3 py-3 font-semibold text-gray-700">{area.cost}</td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {area.vibe.slice(0, 2).map((v) => (
                          <span key={v} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{v}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Full ranked list */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          All {areas.length} {intent.label} in {cityInfo.name}
        </h2>
        {areas.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            No areas found for this filter yet. Data grows as the community adds more insights.
          </div>
        ) : (
          <div className="grid gap-3">
            {areas.slice(5).map((area, i) => (
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

      {/* Why these areas */}
      {stats && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Why These Areas?
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            {meta.why(cityInfo.name, areas.length, stats.avgSafety, stats.modeCost)}
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {meta.criteria.map((c) => (
              <div key={c} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{c}</span>
              </div>
            ))}
          </div>
          {stats.vibes.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 font-medium mb-2">Common vibes across these areas:</p>
              <div className="flex flex-wrap gap-2">
                {stats.vibes.map((v) => (
                  <span key={v} className="bg-teal-50 border border-teal-200 text-teal-800 rounded-full px-3 py-1 text-sm font-medium">{v}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Internal links bottom */}
      <div className="flex flex-wrap gap-3 items-center text-sm text-gray-500 justify-center border-t pt-6">
        <span>Also explore in {cityInfo.name}:</span>
        {allIntents.filter((i) => !i.active).map((i) => (
          <Link key={i.slug} href={`/${cityInfo.slug}/${i.slug}`} className="text-teal-600 hover:underline font-medium">
            {i.label}
          </Link>
        ))}
        <Link href={`/${cityInfo.slug}`} className="text-teal-600 hover:underline font-medium">
          All {cityInfo.name} neighborhoods
        </Link>
      </div>
    </SEOLayout>
  );
}
