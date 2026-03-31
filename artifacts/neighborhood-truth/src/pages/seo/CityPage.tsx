import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { MapPin, TrendingUp, Shield, DollarSign, Star } from "lucide-react";
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

const INTENT_ICONS: Record<string, string> = {
  "safe-neighborhoods": "🛡️",
  "affordable-areas": "💰",
  "nightlife-areas": "🎉",
  "family-friendly": "👨‍👩‍👧‍👦",
};

export default function CityPage() {
  const { city } = useParams<{ city: string }>();

  const { data, isLoading, isError } = useQuery<CityData>({
    queryKey: ["seo-city", city],
    queryFn: () => fetch(`${API}/seo/city/${city}`).then((r) => r.json()),
    enabled: !!city,
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
        <ErrorState message="City not found. Try exploring the map instead." />
      </SEOLayout>
    );
  }

  const { city: cityInfo, stats, areas, intents } = data;
  const topAreas = areas.slice(0, 10);
  const safeAreas = [...areas].filter((a) => a.safety >= 4).slice(0, 5);
  const affordableAreas = [...areas].filter((a) => ["$", "$$"].includes(a.cost)).slice(0, 5);

  const title = `${cityInfo.name} Neighborhoods Guide — HoodSignal`;
  const description = `Explore ${stats.labelCount} crowd-sourced neighborhood insights in ${cityInfo.name}. Average safety: ${stats.avgSafety}/5. Top vibes: ${stats.vibes.slice(0, 3).join(", ")}. Find the best areas to live, visit, and explore.`;

  return (
    <SEOLayout breadcrumbs={[{ label: cityInfo.name }]}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://hoodsignal.com/${cityInfo.slug}`} />
      </Helmet>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-teal-600 text-sm mb-2">
          <MapPin className="h-4 w-4" />
          <span>{cityInfo.country}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {cityInfo.name} Neighborhoods
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
          {stats.labelCount} crowd-sourced insights from locals and visitors.
          The "{stats.topLabel}" area is the highest-rated spot. Average safety rating is {stats.avgSafety}/5.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBadge label="Avg Safety" value={`${stats.avgSafety}/5`} color="bg-green-50 text-green-800" />
        <StatBadge label="Typical Cost" value={stats.modeCost} color="bg-blue-50 text-blue-800" />
        <StatBadge label="Community Score" value={`+${stats.sentiment}`} color="bg-purple-50 text-purple-800" />
        <StatBadge label="Insights" value={stats.labelCount} color="bg-orange-50 text-orange-800" />
      </div>

      {/* Intent shortcuts */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Browse by Need</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {intents.map((intent) => (
            <Link key={intent.slug} href={`/${cityInfo.slug}/${intent.slug}`}>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-teal-300 hover:shadow-md transition-all cursor-pointer">
                <div className="text-2xl mb-1">{INTENT_ICONS[intent.slug] || "📍"}</div>
                <p className="text-sm font-semibold text-gray-800">{intent.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top-rated areas */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-bold text-gray-900">Top-Rated Areas in {cityInfo.name}</h2>
        </div>
        <div className="grid gap-3">
          {topAreas.map((area, i) => (
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
      </section>

      {/* Two column highlights */}
      <div className="grid sm:grid-cols-2 gap-8 mb-10">
        {safeAreas.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-green-600" />
              <h2 className="text-base font-bold text-gray-900">Safest Spots</h2>
            </div>
            <div className="flex flex-col gap-2">
              {safeAreas.map((area) => (
                <Link key={area.id} href={`/${cityInfo.slug}/${area.slug || slugify(area.text)}`}>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-green-300 transition-colors cursor-pointer">
                    <span className="text-sm text-gray-800 truncate">{area.text}</span>
                    <span className="text-xs text-green-700 font-bold ml-2">{"★".repeat(area.safety)}</span>
                  </div>
                </Link>
              ))}
              <Link href={`/${cityInfo.slug}/safe-neighborhoods`} className="text-xs text-teal-600 hover:underline mt-1">
                See all safe neighborhoods →
              </Link>
            </div>
          </section>
        )}

        {affordableAreas.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Most Affordable</h2>
            </div>
            <div className="flex flex-col gap-2">
              {affordableAreas.map((area) => (
                <Link key={area.id} href={`/${cityInfo.slug}/${area.slug || slugify(area.text)}`}>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 transition-colors cursor-pointer">
                    <span className="text-sm text-gray-800 truncate">{area.text}</span>
                    <span className="text-xs text-blue-700 font-bold ml-2">{area.cost}</span>
                  </div>
                </Link>
              ))}
              <Link href={`/${cityInfo.slug}/affordable-areas`} className="text-xs text-teal-600 hover:underline mt-1">
                See all affordable areas →
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Top vibes */}
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

      {/* SEO prose */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Living & Exploring {cityInfo.name} — Insider Guide
        </h2>
        <div className="prose prose-sm text-gray-600 max-w-none space-y-3">
          <p>
            {cityInfo.name} has {stats.labelCount} verified neighborhood insights contributed by real locals and visitors.
            The community gives the city an overall safety rating of <strong>{stats.avgSafety}/5</strong> ({safetyLabel(stats.avgSafety)}),
            with most areas falling in the <strong>{stats.modeCost}</strong> cost range.
          </p>
          <p>
            The top-rated spot is <strong>"{stats.topLabel}"</strong>, which has earned the highest community score.
            Popular vibes across the city include {stats.vibes.slice(0, 4).map((v) => `"${v}"`).join(", ")}.
          </p>
          <p>
            Browse the curated guides below to find your perfect neighborhood:
            {" "}<Link href={`/${cityInfo.slug}/safe-neighborhoods`} className="text-teal-700 hover:underline">safe areas</Link>,{" "}
            <Link href={`/${cityInfo.slug}/affordable-areas`} className="text-teal-700 hover:underline">budget-friendly neighborhoods</Link>,{" "}
            <Link href={`/${cityInfo.slug}/nightlife-areas`} className="text-teal-700 hover:underline">nightlife hotspots</Link>, and{" "}
            <Link href={`/${cityInfo.slug}/family-friendly`} className="text-teal-700 hover:underline">family-friendly zones</Link>.
          </p>
        </div>
      </section>
    </SEOLayout>
  );
}
