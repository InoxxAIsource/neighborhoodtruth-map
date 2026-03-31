import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { MapPin, ArrowUpRight, ThumbsUp, ThumbsDown } from "lucide-react";
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

export default function AreaPage() {
  const { city, area } = useParams<{ city: string; area: string }>();

  const { data, isLoading, isError } = useQuery<AreaData>({
    queryKey: ["seo-area", city, area],
    queryFn: () => fetch(`${API}/seo/area/${city}/${area}`).then((r) => r.json()),
    enabled: !!city && !!area,
  });

  if (isLoading) {
    return (
      <SEOLayout>
        <LoadingState />
      </SEOLayout>
    );
  }

  if (isError || !data?.area) {
    return (
      <SEOLayout>
        <ErrorState message="Area not found. Try browsing the city instead." />
      </SEOLayout>
    );
  }

  const { city: cityInfo, area: areaInfo, nearby, stats } = data;
  const sentimentPositive = areaInfo.sentiment > 0;

  const title = `${areaInfo.text} — ${cityInfo.name} Neighborhood Guide | HoodSignal`;
  const description = `Crowd-sourced insights for "${areaInfo.text}" in ${cityInfo.name}. Safety: ${areaInfo.safety}/5 (${safetyLabel(areaInfo.safety)}). Cost: ${areaInfo.cost}. Vibes: ${areaInfo.vibe.slice(0, 3).join(", ")}. Community score: ${areaInfo.sentiment > 0 ? "+" : ""}${areaInfo.sentiment}.`;

  return (
    <SEOLayout
      breadcrumbs={[
        { label: cityInfo.name, href: `/${cityInfo.slug}` },
        { label: areaInfo.text },
      ]}
    >
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://hoodsignal.com/${cityInfo.slug}/${areaInfo.slug}`} />
      </Helmet>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-teal-600 text-sm mb-2">
          <MapPin className="h-4 w-4" />
          <Link href={`/${cityInfo.slug}`} className="hover:underline">{cityInfo.name}</Link>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {areaInfo.text}
        </h1>
        {areaInfo.category && (
          <span className="inline-block bg-teal-100 text-teal-800 text-sm font-medium rounded-full px-3 py-1 mb-3">
            {areaInfo.category}
          </span>
        )}
        <p className="text-gray-600 text-lg max-w-2xl">
          A crowd-sourced neighborhood insight in {cityInfo.name} rated{" "}
          <strong>{safetyLabel(areaInfo.safety)}</strong> with a community score of{" "}
          <strong className={sentimentPositive ? "text-green-700" : "text-red-700"}>
            {areaInfo.sentiment > 0 ? "+" : ""}{areaInfo.sentiment}
          </strong>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBadge label="Safety" value={`${areaInfo.safety}/5`} color="bg-green-50 text-green-800" />
        <StatBadge label="Cost" value={areaInfo.cost} color="bg-blue-50 text-blue-800" />
        <StatBadge
          label="Score"
          value={`${areaInfo.sentiment > 0 ? "+" : ""}${areaInfo.sentiment}`}
          color={sentimentPositive ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}
        />
        <StatBadge label="Upvotes" value={areaInfo.upvotes} color="bg-purple-50 text-purple-800" />
      </div>

      {/* Vibes */}
      {areaInfo.vibe.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-2">Vibes & Character</h2>
          <div className="flex flex-wrap gap-2">
            {areaInfo.vibe.map((v) => (
              <span key={v} className="bg-purple-50 border border-purple-200 text-purple-800 rounded-full px-4 py-1.5 text-sm font-medium">{v}</span>
            ))}
          </div>
        </section>
      )}

      {/* Community rating */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
        <h2 className="text-base font-bold text-gray-800 mb-3">Community Verdict</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-green-700">
            <ThumbsUp className="h-5 w-5" />
            <span className="text-xl font-bold">{areaInfo.upvotes}</span>
            <span className="text-sm">found it great</span>
          </div>
          <div className="flex items-center gap-2 text-red-700">
            <ThumbsDown className="h-5 w-5" />
            <span className="text-xl font-bold">{areaInfo.downvotes}</span>
            <span className="text-sm">had issues</span>
          </div>
        </div>
        {stats && (
          <p className="text-sm text-gray-500 mt-3">
            Including {stats.labelCount} nearby data points, the area average safety is{" "}
            <strong>{stats.avgSafety}/5</strong> with typical cost of <strong>{stats.modeCost}</strong>.
          </p>
        )}
      </section>

      {/* Nearby areas */}
      {nearby.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nearby in {cityInfo.name}</h2>
            <Link href={`/${cityInfo.slug}`} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
              All areas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3">
            {nearby.map((n) => (
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

      {/* SEO prose */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          About "{areaInfo.text}" in {cityInfo.name}
        </h2>
        <div className="prose prose-sm text-gray-600 max-w-none space-y-3">
          <p>
            "{areaInfo.text}" is a crowd-sourced neighborhood insight in <strong>{cityInfo.name}</strong>, rated{" "}
            <strong>{areaInfo.safety} out of 5 stars</strong> for safety by the community.
            The area is generally considered <strong>{safetyLabel(areaInfo.safety)}</strong> with a typical cost level of{" "}
            <strong>{areaInfo.cost}</strong>.
          </p>
          {areaInfo.vibe.length > 0 && (
            <p>
              Locals describe the vibe as {areaInfo.vibe.map((v) => `"${v}"`).join(", ")}.
              {areaInfo.category ? ` It's particularly known for: ${areaInfo.category}.` : ""}
            </p>
          )}
          <p>
            The community score of <strong>{areaInfo.sentiment > 0 ? "+" : ""}{areaInfo.sentiment}</strong> ({areaInfo.upvotes} upvotes, {areaInfo.downvotes} downvotes)
            reflects genuine sentiment from people who have spent time in this area.
          </p>
        </div>
      </section>

      {/* Compare CTA */}
      <div className="mt-6 bg-gradient-to-r from-teal-50 to-purple-50 rounded-2xl border border-teal-100 p-5">
        <h3 className="font-bold text-gray-900 mb-1">Want to compare?</h3>
        <p className="text-sm text-gray-600 mb-3">See how "{areaInfo.text}" stacks up against other neighborhoods.</p>
        <Link href={`/${cityInfo.slug}`} className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-teal-700 transition-colors">
          Explore {cityInfo.name} →
        </Link>
      </div>
    </SEOLayout>
  );
}
