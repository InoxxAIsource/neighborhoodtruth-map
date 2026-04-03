import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Filter, CheckCircle, Calendar } from "lucide-react";
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
    topTags?: string[];
    url: string;
  }>;
  allIntents: Array<{ slug: string; label: string; url: string; active: boolean }>;
}

interface IntentMeta {
  emoji: string;
  headline: (city: string, count: number, year: number) => string;
  intro: (city: string, count: number, avgSafety: number) => string;
  why: (city: string, count: number, avgSafety: number, cost: string) => string;
  criteria: string[];
}

const INTENT_META: Record<string, IntentMeta> = {
  safe: {
    emoji: "🛡️",
    headline: (city, count, year) => `${count} Safest Neighborhoods in ${city} (${year})`,
    intro: (city, count, avg) =>
      `Discover the ${count} safest areas in ${city}, rated ${avg}/5 or higher for safety by locals and visitors. Ideal for families, solo travelers, and anyone prioritizing peace of mind.`,
    why: (city, count, avg) =>
      `These ${count} neighborhoods in ${city} were selected because they each score 4/5 or higher on community safety ratings. With an average safety score of ${avg}/5, they represent the most trusted parts of ${city} according to real locals.`,
    criteria: ["Safety rating ≥ 4/5 from community", "Verified by multiple locals", "Positive community sentiment"],
  },
  affordable: {
    emoji: "💰",
    headline: (city, count, year) => `${count} Most Affordable Areas in ${city} (${year})`,
    intro: (city, count) =>
      `Explore ${count} budget-friendly neighborhoods in ${city} where you can live, eat, and explore without breaking the bank. Rated $ or $$ by the community.`,
    why: (city, count) =>
      `These ${count} areas are the most affordable in ${city} based on community cost ratings. They're rated $ (Budget) or $$ (Affordable), offering the best value without sacrificing amenities or safety.`,
    criteria: ["Cost rating $ or $$ (community-verified)", "Good value for money", "Accessible for most budgets"],
  },
  nightlife: {
    emoji: "🎉",
    headline: (city, count, year) => `${count} Best Nightlife Areas in ${city} (${year})`,
    intro: (city, count) =>
      `${city} has ${count} vibrant nightlife hotspots according to locals. From underground bars to lively party districts, these neighborhoods come alive after dark.`,
    why: (city, count) =>
      `These ${count} areas in ${city} were flagged by the community for nightlife, bars, and after-dark energy. Locals have tagged them with "Nightlife", "Bars", and "Loud" vibes — reliable signals for the city's party scene.`,
    criteria: ["Tagged Nightlife, Bars, or Loud vibe", "Community-endorsed venues", "Active after-hours scene"],
  },
  family: {
    emoji: "👨‍👩‍👧‍👦",
    headline: (city, count, year) => `${count} Family-Friendly Neighborhoods in ${city} (${year})`,
    intro: (city, count) =>
      `Discover ${count} family-friendly areas in ${city} loved by locals for their parks, safe streets, and community vibe. Perfect for raising kids or enjoying a relaxed lifestyle.`,
    why: (city, count) =>
      `These ${count} areas have been flagged by the community as family-friendly — featuring parks, quiet streets, and a safe, welcoming environment. Locals with children give them high safety ratings and positive sentiment.`,
    criteria: ["Family vibe or parks category", "High safety ratings (≥ 3/5)", "Positive community feedback"],
  },
  students: {
    emoji: "🎓",
    headline: (city, count, year) => `${count} Best Areas for Students in ${city} (${year})`,
    intro: (city, count) =>
      `Looking for affordable, lively neighborhoods in ${city} as a student? These ${count} areas balance low cost with a youthful, artsy, or social vibe — perfect for student life.`,
    why: (city, count) =>
      `These ${count} neighborhoods in ${city} were selected for students based on two key factors: affordable cost ($ or $$) and a social vibe (artsy, chill, or bar scene). Safety is factored in too — all areas score ≥ 3/5.`,
    criteria: ["Affordable cost ($ or $$)", "Social/artsy/chill vibe", "Safety rating ≥ 3/5"],
  },
  "young-professionals": {
    emoji: "💼",
    headline: (city, count, year) => `${count} Best Areas for Young Professionals in ${city} (${year})`,
    intro: (city, count) =>
      `Explore ${count} neighborhoods in ${city} that appeal to young professionals — a blend of safety, style, and social scene without the ultra-premium price tag.`,
    why: (city, count) =>
      `These ${count} areas were selected for young professionals because they combine decent safety (≥ 3/5) with a vibrant or stylish vibe (artsy, chill, or bougie). They're the sweet spot between liveability and lifestyle.`,
    criteria: ["Safety rating ≥ 3/5", "Artsy, Chill, or Bougie vibe", "Good work-life balance"],
  },
  quiet: {
    emoji: "🌿",
    headline: (city, count, year) => `${count} Quietest Neighborhoods in ${city} (${year})`,
    intro: (city, count) =>
      `Escape the noise. These ${count} peaceful neighborhoods in ${city} are safe, calm, and free from the crowds — ideal for remote workers, retirees, and anyone craving tranquility.`,
    why: (city, count) =>
      `These ${count} areas stand out for their lack of nightlife noise and loud crowds. None are tagged as "Loud" or "Nightlife" by the community, and all maintain a safety rating ≥ 3/5 — making them genuinely quiet AND safe.`,
    criteria: ["No Loud or Nightlife tags", "Safety rating ≥ 3/5", "Calm residential character"],
  },
  expensive: {
    emoji: "💎",
    headline: (city, count, year) => `${count} Most Expensive Neighborhoods in ${city} (${year})`,
    intro: (city, count) =>
      `Explore ${city}'s ${count} premium neighborhoods — the city's most upscale, exclusive, and high-cost areas according to local community data.`,
    why: (city, count) =>
      `These ${count} areas are rated $$$ or $$$$ (Mid-range to Luxury) by the community — ${city}'s most expensive neighborhoods. They often feature premium amenities, high safety, and prestigious addresses.`,
    criteria: ["Cost rating $$$ or $$$$ (community-verified)", "Premium amenities", "Prestigious locations"],
  },
};

const PRIMARY_INTENTS = ["safe-neighborhoods", "affordable-areas", "nightlife-areas", "family-friendly"];
const SECONDARY_INTENTS = ["best-areas-for-students", "best-areas-for-young-professionals", "quiet-neighborhoods", "expensive-neighborhoods"];

const COST_LABEL: Record<string, string> = { "$": "Budget", "$$": "Affordable", "$$$": "Mid-range", "$$$$": "Luxury" };

function getUpdatedLabel(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

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

  // Placeholder meta tags for loading/error states
  const placeholderTitle = `Neighborhoods in ${city} | PlaceLabels`;
  const placeholderDescription = "Browse neighborhoods by safety, affordability, nightlife, family-friendliness, and more.";

  if (isLoading) {
    return (
      <SEOLayout>
        <Helmet>
          <title>{placeholderTitle}</title>
          <meta name="description" content={placeholderDescription} />
          <meta property="og:title" content={placeholderTitle} />
          <meta property="og:description" content={placeholderDescription} />
          <link rel="canonical" href={`https://placelabels.com/${city}/${intentSlug}`} />
        </Helmet>
        <LoadingState />
      </SEOLayout>
    );
  }
  if (isError || !data?.city) {
    return (
      <SEOLayout>
        <Helmet>
          <title>Page Not Found | PlaceLabels</title>
          <meta name="description" content="This page doesn't have community data yet." />
          <link rel="canonical" href={`https://placelabels.com/${city}/${intentSlug}`} />
        </Helmet>
        <ErrorState message="Page not found. Try browsing the city instead." />
      </SEOLayout>
    );
  }

  const { city: cityInfo, intent, stats, areas, allIntents } = data;
  const meta = INTENT_META[intent.key] ?? INTENT_META.safe;
  const year = new Date().getFullYear();
  const top5 = areas.slice(0, 5);

  const primaryIntents = allIntents.filter((i) => PRIMARY_INTENTS.includes(i.slug));
  const secondaryIntents = allIntents.filter((i) => SECONDARY_INTENTS.includes(i.slug));

  const title = `${meta.headline(cityInfo.name, areas.length, year)} — PlaceLabels`;
  const description = stats
    ? meta.intro(cityInfo.name, areas.length, stats.avgSafety)
    : `${intent.label} in ${cityInfo.name} — crowd-sourced neighborhood guide.`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "PlaceLabels", "item": "https://placelabels.com" },
      { "@type": "ListItem", "position": 2, "name": cityInfo.name, "item": `https://placelabels.com/${cityInfo.slug}` },
      { "@type": "ListItem", "position": 3, "name": intent.label, "item": `https://placelabels.com/${cityInfo.slug}/${intent.slug}` },
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
        <link rel="canonical" href={`https://placelabels.com/${cityInfo.slug}/${intent.slug}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <Calendar className="h-3 w-3" />
          <span>Updated {getUpdatedLabel()} · Based on latest community data</span>
        </div>
        <div className="text-4xl mb-3">{meta.emoji}</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {meta.headline(cityInfo.name, areas.length, year)}
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">{description}</p>
      </div>

      {/* Data badges */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatBadge label="Avg Safety Score" value={`${stats.avgSafety}/5`} color="bg-green-50 text-green-800" />
          <StatBadge label="Typical Cost" value={stats.modeCost} color="bg-blue-50 text-blue-800" />
          <StatBadge label="Areas Found" value={areas.length} color="bg-teal-50 text-teal-800" />
          <StatBadge label="Community Score" value={`+${stats.sentiment}`} color="bg-purple-50 text-purple-800" />
        </div>
      )}

      {/* Primary filter tabs */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Top guides for {cityInfo.name}:</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {primaryIntents.map((i) => (
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
        {secondaryIntents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {secondaryIntents.map((i) => (
              <Link
                key={i.slug}
                href={`/${cityInfo.slug}/${i.slug}`}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                  i.active
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-purple-300"
                }`}
              >
                {i.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top 5 comparison table */}
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
                  <th className="text-center px-3 py-3 text-gray-500 font-medium hidden sm:table-cell">Score</th>
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
                        <p className="text-xs text-gray-400 mt-0.5">{pct}% positive · {area.upvotes + area.downvotes} signals</p>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${area.safety >= 4 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {area.safety}/5
                        </span>
                      </td>
                      <td className="text-center px-3 py-3 font-semibold text-gray-700">{area.cost}</td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {area.topTags && area.topTags.length > 0
                            ? area.topTags.slice(0, 2).map((key) => {
                                const TAG_EMOJIS: Record<string, string> = {
                                  "safe-at-night": "🌙",
                                  "noisy-on-weekends": "🔊",
                                  "family-friendly": "👨‍👩‍👧",
                                  "expensive": "💎",
                                  "good-nightlife": "🎉",
                                  "quiet": "🌿",
                                  "good-for-students": "🎓",
                                  "well-connected": "🚇",
                                };
                                const TAG_LABELS: Record<string, string> = {
                                  "safe-at-night": "Safe at night",
                                  "noisy-on-weekends": "Noisy",
                                  "family-friendly": "Family",
                                  "expensive": "Expensive",
                                  "good-nightlife": "Nightlife",
                                  "quiet": "Quiet",
                                  "good-for-students": "Students",
                                  "well-connected": "Connected",
                                };
                                return (
                                  <span key={key} className="text-xs bg-green-50 border border-green-200 text-green-700 rounded-full px-2 py-0.5">
                                    {TAG_EMOJIS[key]} {TAG_LABELS[key] ?? key}
                                  </span>
                                );
                              })
                            : area.vibe.slice(0, 2).map((v) => (
                                <span key={v} className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{v}</span>
                              ))
                          }
                        </div>
                      </td>
                      <td className={`text-center px-3 py-3 font-bold hidden sm:table-cell ${area.sentiment > 0 ? "text-green-700" : "text-red-700"}`}>
                        {area.sentiment > 0 ? "+" : ""}{area.sentiment}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Full list */}
      {areas.length > 5 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            All {areas.length} {intent.label} in {cityInfo.name}
          </h2>
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
        </section>
      )}

      {/* Why These Areas */}
      {stats && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Why These Areas?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            {meta.why(cityInfo.name, areas.length, stats.avgSafety, stats.modeCost)}
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            {meta.criteria.map((c) => (
              <div key={c} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{c}</span>
              </div>
            ))}
          </div>
          {stats.vibes.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 font-medium mb-2">Common vibes across these {cityInfo.name} neighborhoods:</p>
              <div className="flex flex-wrap gap-2">
                {stats.vibes.map((v) => (
                  <span key={v} className="bg-teal-50 border border-teal-200 text-teal-800 rounded-full px-3 py-1 text-sm font-medium">{v}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* SEO prose */}
      <section className="bg-gradient-to-r from-gray-50 to-teal-50 rounded-2xl border border-gray-200 p-5 mb-6">
        <p className="text-sm text-gray-600 leading-relaxed">
          Looking for the <strong>{intent.label.toLowerCase()} in {cityInfo.name}</strong>?
          This guide is based on <strong>{areas.length} community-verified insights</strong> from real locals and visitors.
          {stats && ` Average safety across these areas: ${stats.avgSafety}/5 · Typical cost: ${stats.modeCost} (${COST_LABEL[stats.modeCost] || stats.modeCost}).`}
          {" "}Explore other guides:{" "}
          {primaryIntents.filter((i) => !i.active).map((i, idx) => (
            <span key={i.slug}>
              <Link href={`/${cityInfo.slug}/${i.slug}`} className="text-teal-700 hover:underline">{i.label.toLowerCase()} in {cityInfo.name}</Link>
              {idx < primaryIntents.filter((i) => !i.active).length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </section>

      {/* Footer nav */}
      <div className="flex flex-wrap gap-3 items-center text-sm text-gray-500 justify-center border-t pt-6">
        <Link href={`/${cityInfo.slug}`} className="text-teal-600 hover:underline font-medium">
          ← All neighborhoods in {cityInfo.name}
        </Link>
        {allIntents.filter((i) => !i.active).slice(0, 4).map((i) => (
          <Link key={i.slug} href={`/${cityInfo.slug}/${i.slug}`} className="text-teal-600 hover:underline">
            {i.label}
          </Link>
        ))}
      </div>
    </SEOLayout>
  );
}
