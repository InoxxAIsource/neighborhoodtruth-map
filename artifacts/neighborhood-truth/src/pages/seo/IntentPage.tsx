import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Filter } from "lucide-react";
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

const INTENT_META: Record<string, { emoji: string; headline: (city: string) => string; intro: (city: string, count: number, avgSafety: number) => string }> = {
  safe: {
    emoji: "🛡️",
    headline: (city) => `Safest Neighborhoods in ${city}`,
    intro: (city, count, avg) =>
      `Discover the ${count} safest areas in ${city}, rated ${avg}/5 or higher for safety by locals and visitors. These neighborhoods are considered ${safetyLabel(avg)} — ideal for families, solo travelers, and anyone prioritizing peace of mind.`,
  },
  affordable: {
    emoji: "💰",
    headline: (city) => `Affordable Areas in ${city}`,
    intro: (city, count) =>
      `Explore ${count} budget-friendly neighborhoods in ${city} where you can live, eat, and explore without breaking the bank. These areas are rated $ or $$ by the community — great value for money.`,
  },
  nightlife: {
    emoji: "🎉",
    headline: (city) => `Best Nightlife Areas in ${city}`,
    intro: (city, count) =>
      `${city} has ${count} vibrant nightlife hotspots according to locals. From underground bars to lively party districts, these neighborhoods come alive after dark.`,
  },
  family: {
    emoji: "👨‍👩‍👧‍👦",
    headline: (city) => `Family-Friendly Neighborhoods in ${city}`,
    intro: (city, count) =>
      `Discover ${count} family-friendly areas in ${city} loved by locals for their parks, safe streets, and community vibe. Perfect for raising kids or enjoying a relaxed, wholesome lifestyle.`,
  },
};

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

  if (isLoading) {
    return (
      <SEOLayout>
        <LoadingState />
      </SEOLayout>
    );
  }

  if (isError || !data?.city) {
    return (
      <SEOLayout>
        <ErrorState message="Page not found. Try browsing the city instead." />
      </SEOLayout>
    );
  }

  const { city: cityInfo, intent, stats, areas, allIntents } = data;
  const meta = INTENT_META[intent.key] ?? INTENT_META.safe;

  const title = `${meta.headline(cityInfo.name)} — HoodSignal`;
  const description = stats
    ? meta.intro(cityInfo.name, areas.length, stats.avgSafety)
    : `${intent.label} in ${cityInfo.name} — crowd-sourced neighborhood guide.`;

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
      </Helmet>

      {/* Hero */}
      <div className="mb-8">
        <div className="text-4xl mb-3">{meta.emoji}</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {meta.headline(cityInfo.name)}
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
          <StatBadge label="Areas Found" value={stats.labelCount} color="bg-teal-50 text-teal-800" />
        </div>
      )}

      {/* Filter tabs */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Browse other guides for {cityInfo.name}:</span>
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

      {/* Area results */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {areas.length} {intent.label} in {cityInfo.name}
        </h2>
        {areas.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            No areas found for this filter yet. Data grows as the community adds more insights.
          </div>
        ) : (
          <div className="grid gap-3">
            {areas.map((area, i) => (
              <AreaCard
                key={area.id}
                text={area.text}
                citySlug={cityInfo.slug}
                areaSlug={area.slug || slugify(area.text)}
                safety={area.safety}
                cost={area.cost}
                vibes={area.vibe}
                sentiment={area.sentiment}
                rank={i + 1}
              />
            ))}
          </div>
        )}
      </section>

      {/* Vibes summary */}
      {stats && stats.vibes.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-2">Common Vibes in These Areas</h2>
          <div className="flex flex-wrap gap-2">
            {stats.vibes.map((v) => (
              <span key={v} className="bg-teal-50 border border-teal-200 text-teal-800 rounded-full px-4 py-1.5 text-sm font-medium">{v}</span>
            ))}
          </div>
        </section>
      )}

      {/* Back to city */}
      <div className="text-center">
        <Link href={`/${cityInfo.slug}`} className="text-teal-600 hover:underline text-sm">
          ← See all neighborhoods in {cityInfo.name}
        </Link>
      </div>
    </SEOLayout>
  );
}
