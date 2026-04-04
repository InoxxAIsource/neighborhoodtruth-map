/**
 * Intent page SSR generator (e.g., safe neighborhoods, affordable areas)
 * Renders filtered views by intent/category
 */

import { db, labelsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ssrHtmlShell } from "./ssrShared";

interface CityDef {
  slug: string;
  name: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

interface AreaData {
  text: string;
  slug: string;
  safety: number;
  cost: string;
  sentiment: number;
}

const CITIES: CityDef[] = [
  { slug: "new-york", name: "New York", latMin: 40.4, latMax: 41.0, lngMin: -74.3, lngMax: -73.7 },
  { slug: "san-francisco", name: "San Francisco", latMin: 37.6, latMax: 37.9, lngMin: -122.6, lngMax: -122.3 },
  { slug: "los-angeles", name: "Los Angeles", latMin: 33.7, latMax: 34.4, lngMin: -118.7, lngMax: -118.0 },
  { slug: "toronto", name: "Toronto", latMin: 43.5, latMax: 43.9, lngMin: -79.7, lngMax: -79.1 },
  { slug: "mexico-city", name: "Mexico City", latMin: 19.2, latMax: 19.6, lngMin: -99.4, lngMax: -98.9 },
  { slug: "buenos-aires", name: "Buenos Aires", latMin: -34.8, latMax: -34.4, lngMin: -58.7, lngMax: -58.2 },
  { slug: "london", name: "London", latMin: 51.3, latMax: 51.7, lngMin: -0.3, lngMax: 0.1 },
  { slug: "amsterdam", name: "Amsterdam", latMin: 52.3, latMax: 52.5, lngMin: 4.7, lngMax: 5.1 },
  { slug: "rome", name: "Rome", latMin: 41.7, latMax: 42.1, lngMin: 12.3, lngMax: 12.7 },
  { slug: "istanbul", name: "Istanbul", latMin: 40.8, latMax: 41.3, lngMin: 28.6, lngMax: 29.5 },
  { slug: "tel-aviv", name: "Tel Aviv", latMin: 31.9, latMax: 32.2, lngMin: 34.7, lngMax: 35.05 },
  { slug: "jerusalem", name: "Jerusalem", latMin: 31.6, latMax: 31.9, lngMin: 35.1, lngMax: 35.4 },
  { slug: "tehran", name: "Tehran", latMin: 35.5, latMax: 36.0, lngMin: 51.0, lngMax: 51.7 },
  { slug: "cairo", name: "Cairo", latMin: 29.9, latMax: 30.2, lngMin: 31.1, lngMax: 31.5 },
  { slug: "cape-town", name: "Cape Town", latMin: -34.2, latMax: -33.7, lngMin: 18.3, lngMax: 18.7 },
  { slug: "tokyo", name: "Tokyo", latMin: 35.5, latMax: 35.8, lngMin: 139.5, lngMax: 139.9 },
  { slug: "seoul", name: "Seoul", latMin: 37.4, latMax: 37.7, lngMin: 126.8, lngMax: 127.3 },
  { slug: "hong-kong", name: "Hong Kong", latMin: 22.1, latMax: 22.6, lngMin: 113.9, lngMax: 114.5 },
  { slug: "bali", name: "Bali", latMin: -8.9, latMax: -8.3, lngMin: 115.0, lngMax: 115.5 },
  { slug: "karachi", name: "Karachi", latMin: 24.7, latMax: 25.2, lngMin: 66.8, lngMax: 67.4 },
  { slug: "lahore", name: "Lahore", latMin: 31.3, latMax: 31.7, lngMin: 74.1, lngMax: 74.5 },
  { slug: "mumbai", name: "Mumbai", latMin: 18.7, latMax: 19.4, lngMin: 72.4, lngMax: 73.3 },
  { slug: "delhi", name: "Delhi", latMin: 28.3, latMax: 29.1, lngMin: 76.7, lngMax: 77.5 },
  { slug: "bangalore", name: "Bangalore", latMin: 12.5, latMax: 13.4, lngMin: 77.2, lngMax: 78.0 },
  { slug: "hyderabad", name: "Hyderabad", latMin: 16.9, latMax: 17.8, lngMin: 78.0, lngMax: 78.9 },
  { slug: "pune", name: "Pune", latMin: 18.0, latMax: 18.9, lngMin: 73.4, lngMax: 74.3 },
  { slug: "chennai", name: "Chennai", latMin: 12.6, latMax: 13.5, lngMin: 79.8, lngMax: 80.8 },
  { slug: "kolkata", name: "Kolkata", latMin: 22.1, latMax: 22.9, lngMin: 88.0, lngMax: 88.8 },
  { slug: "ahmedabad", name: "Ahmedabad", latMin: 22.5, latMax: 23.3, lngMin: 72.3, lngMax: 73.2 },
  { slug: "jaipur", name: "Jaipur", latMin: 26.4, latMax: 27.2, lngMin: 75.4, lngMax: 76.2 },
  { slug: "lucknow", name: "Lucknow", latMin: 26.3, latMax: 27.1, lngMin: 80.5, lngMax: 81.3 },
  { slug: "chandigarh", name: "Chandigarh", latMin: 30.3, latMax: 31.1, lngMin: 76.3, lngMax: 77.2 },
  { slug: "goa", name: "Goa", latMin: 14.8, latMax: 15.8, lngMin: 73.3, lngMax: 74.3 },
  { slug: "indore", name: "Indore", latMin: 22.2, latMax: 23.0, lngMin: 75.4, lngMax: 76.2 },
  { slug: "coimbatore", name: "Coimbatore", latMin: 10.8, latMax: 11.2, lngMin: 76.8, lngMax: 77.2 },
];

// Related intents shown as cross-links on each intent page
const INTENT_RELATED: Record<string, string[]> = {
  "safe-neighborhoods":          ["family-friendly", "quiet-neighborhoods", "walkable-neighborhoods"],
  "affordable-areas":            ["cheap-rent", "cost-of-living", "best-areas-for-students"],
  "nightlife-areas":             ["best-areas-for-students", "best-areas-for-young-professionals"],
  "family-friendly":             ["safe-neighborhoods", "quiet-neighborhoods", "walkable-neighborhoods"],
  "best-areas-for-students":     ["affordable-areas", "cheap-rent", "best-areas-for-young-professionals"],
  "quiet-neighborhoods":         ["family-friendly", "walkable-neighborhoods", "safe-neighborhoods"],
  "cheap-rent":                  ["affordable-areas", "cost-of-living", "best-areas-for-students"],
  "luxury-real-estate":          ["expensive-neighborhoods", "safe-neighborhoods"],
  "transit-friendly":            ["best-areas-for-young-professionals", "walkable-neighborhoods", "expat-neighborhoods"],
  "walkable-neighborhoods":      ["quiet-neighborhoods", "family-friendly", "transit-friendly"],
  "cost-of-living":              ["affordable-areas", "cheap-rent", "expat-neighborhoods"],
  "expat-neighborhoods":         ["safe-neighborhoods", "transit-friendly", "cost-of-living"],
  "expensive-neighborhoods":     ["luxury-real-estate", "safe-neighborhoods"],
  "best-areas-for-young-professionals": ["transit-friendly", "best-areas-for-students", "nightlife-areas"],
};

const INTENT_MAP: Record<
  string,
  {
    label: string;
    emoji: string;
    description: string;
    filter: (label: any) => boolean;
  }
> = {
  "safe-neighborhoods": {
    label: "Safe Neighborhoods",
    emoji: "🛡️",
    description: "neighborhoods with strong safety ratings",
    filter: (label) => label.safety >= 4,
  },
  "affordable-areas": {
    label: "Affordable Areas",
    emoji: "💰",
    description: "budget-friendly neighborhoods",
    filter: (label) => label.cost === "$",
  },
  "nightlife-areas": {
    label: "Best Nightlife",
    emoji: "🎉",
    description: "neighborhoods known for nightlife",
    filter: (label) => label.tags?.includes("good-nightlife"),
  },
  "family-friendly": {
    label: "Family-Friendly",
    emoji: "👨‍👩‍👧‍👦",
    description: "great neighborhoods for families",
    filter: (label) => label.tags?.includes("family-friendly"),
  },
  "best-areas-for-students": {
    label: "Best for Students",
    emoji: "🎓",
    description: "popular neighborhoods for students",
    filter: (label) => label.tags?.includes("good-for-students"),
  },
  "quiet-neighborhoods": {
    label: "Quiet Neighborhoods",
    emoji: "🌿",
    description: "peaceful, quiet neighborhoods",
    filter: (label) => label.tags?.includes("quiet"),
  },
  // --- Cost & Real Estate intents ---
  "cheap-rent": {
    label: "Cheap Rent",
    emoji: "🏠",
    description: "neighborhoods with low rent and budget housing options",
    filter: (label) => label.cost === "$",
  },
  "luxury-real-estate": {
    label: "Luxury Real Estate",
    emoji: "🏙️",
    description: "upscale, high-end neighborhoods with luxury housing",
    filter: (label) => label.cost === "$$$$",
  },
  "expensive-neighborhoods": {
    label: "Expensive Neighborhoods",
    emoji: "💎",
    description: "premium, high-cost neighborhoods",
    filter: (label) => label.cost === "$$$" || label.cost === "$$$$",
  },
  "cost-of-living": {
    label: "Low Cost of Living",
    emoji: "📊",
    description: "neighborhoods with a low overall cost of living",
    filter: (label) => label.cost === "$" || label.cost === "$$",
  },
  // --- Transport & Connectivity intents ---
  "transit-friendly": {
    label: "Transit-Friendly",
    emoji: "🚇",
    description: "well-connected neighborhoods with great public transport links",
    filter: (label) =>
      label.tags?.includes("well-connected") ||
      label.vibe?.includes("Busy") ||
      label.safety >= 3,
  },
  "walkable-neighborhoods": {
    label: "Walkable Neighborhoods",
    emoji: "🚶",
    description: "walkable, pedestrian-friendly neighborhoods",
    filter: (label) =>
      label.tags?.includes("quiet") ||
      label.vibe?.includes("Chill") ||
      label.safety >= 4,
  },
  // --- Lifestyle intents ---
  "expat-neighborhoods": {
    label: "Expat-Friendly",
    emoji: "🌍",
    description: "neighborhoods popular with expats and international residents",
    filter: (label) =>
      label.safety >= 3 && (label.cost === "$" || label.cost === "$$" || label.cost === "$$$"),
  },
  "best-areas-for-young-professionals": {
    label: "Best for Young Professionals",
    emoji: "💼",
    description: "neighborhoods loved by young professionals",
    filter: (label) =>
      label.tags?.includes("well-connected") ||
      label.tags?.includes("good-nightlife") ||
      label.safety >= 3,
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-");
}

async function getIntentData(
  citySlug: string,
  intentSlug: string
): Promise<{
  city: CityDef;
  intent: { slug: string; label: string; emoji: string; description: string };
  areas: AreaData[];
  stats: { avgSafety: number; modeCost: string; labelCount: number };
} | null> {
  const city = CITIES.find((c) => c.slug === citySlug);
  const intent = INTENT_MAP[intentSlug];

  if (!city || !intent) return null;

  const labels = await db
    .select()
    .from(labelsTable)
    .where(
      sql`lat >= ${city.latMin} AND lat <= ${city.latMax} AND lng >= ${city.lngMin} AND lng <= ${city.lngMax}`
    );

  const areas: AreaData[] = [];
  const areaMap = new Map<string, AreaData>();

  for (const label of labels) {
    if (!intent.filter(label)) continue;

    const areaSlug = slugify(label.text);
    if (!areaMap.has(areaSlug)) {
      areaMap.set(areaSlug, {
        text: label.text,
        slug: areaSlug,
        safety: label.safety ?? 3,
        cost: label.cost ?? "$$",
        sentiment: 0,
      });
    }
    const area = areaMap.get(areaSlug)!;
    area.sentiment = (label.upvotes ?? 0) - (label.downvotes ?? 0);
  }

  areas.push(...Array.from(areaMap.values()).sort((a, b) => b.sentiment - a.sentiment));

  const avgSafety = areas.length > 0 ? Math.round((areas.reduce((sum, a) => sum + a.safety, 0) / areas.length) * 10) / 10 : 3;
  const modeCost = areas.length > 0 ? areas[0].cost : "$$";

  return {
    city,
    intent: { slug: intentSlug, label: intent.label, emoji: intent.emoji, description: intent.description },
    areas: areas.slice(0, 15),
    stats: { avgSafety, modeCost, labelCount: areas.length },
  };
}

export async function getIntentHtml(citySlug: string, intentSlug: string): Promise<string | null> {
  const data = await getIntentData(citySlug, intentSlug);
  if (!data) return null;

  // If no data yet, render a graceful "coming soon" page (never 404 a sitemap URL)
  if (data.areas.length === 0) {
    const { city, intent } = data;
    const related = (INTENT_RELATED[intentSlug] ?? []).filter((s) => INTENT_MAP[s]);
    const bodyHtml = `
      <div class="mb-8">
        <div class="text-4xl mb-3">${intent.emoji}</div>
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">${escapeHtml(intent.label)} in ${escapeHtml(city.name)}</h1>
        <p class="text-gray-600 text-lg leading-relaxed max-w-2xl">We're collecting community data on ${intent.description} in ${escapeHtml(city.name)}. Be the first to label your neighborhood!</p>
      </div>
      <section class="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 class="text-base font-bold text-gray-900 mb-2">🗺️ Help map ${escapeHtml(city.name)}</h2>
        <p class="text-sm text-gray-600 mb-3">PlaceLabels is crowd-sourced — every pin you drop helps others find the right neighborhood. Open the interactive map and start labeling areas in ${escapeHtml(city.name)}.</p>
        <a href="/" class="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">Add a label now →</a>
      </section>
      ${related.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-4">Related Guides for ${escapeHtml(city.name)}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${related.map((s) => {
            const rel = INTENT_MAP[s];
            return `<a href="/${city.slug}/${s}" class="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-md transition-all group">
              <span class="text-2xl flex-shrink-0">${rel.emoji}</span>
              <div><p class="font-semibold text-gray-900 group-hover:text-teal-700 text-sm">${escapeHtml(rel.label)}</p>
              <p class="text-xs text-gray-400 mt-0.5">in ${escapeHtml(city.name)}</p></div>
            </a>`;
          }).join("")}
        </div>
      </section>` : ""}
    `;
    return ssrHtmlShell({
      title: `${intent.emoji} ${intent.label} in ${city.name} | PlaceLabels`,
      description: `Discover ${intent.description} in ${city.name}. Community-powered neighborhood data — add your own label and help build the map.`,
      canonical: `https://placelabels.com/${city.slug}/${intent.slug}`,
      bodyHtml,
      schemaJson: { "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "PlaceLabels", item: "https://placelabels.com" },
          { "@type": "ListItem", position: 2, name: city.name, item: `https://placelabels.com/${city.slug}` },
          { "@type": "ListItem", position: 3, name: intent.label, item: `https://placelabels.com/${city.slug}/${intent.slug}` },
        ]
      },
    });
  }

  const { city, intent, areas, stats } = data;
  const year = new Date().getFullYear();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "PlaceLabels",
        item: "https://placelabels.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: city.name,
        item: `https://placelabels.com/${city.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: intent.label,
        item: `https://placelabels.com/${city.slug}/${intent.slug}`,
      },
    ],
  };

  const bodyHtml = `
    <div class="mb-8">
      <div class="text-4xl mb-3">${intent.emoji}</div>
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">${escapeHtml(intent.label)} in ${escapeHtml(city.name)}</h1>
      <p class="text-gray-600 text-lg leading-relaxed max-w-2xl">Browse ${stats.labelCount} ${intent.description} based on real community data from locals and visitors in ${escapeHtml(city.name)}.</p>
    </div>

    <section class="mb-10">
      <div class="grid sm:grid-cols-3 gap-4">
        <div class="rounded-xl px-4 py-3 text-center bg-gray-100 text-gray-700">
          <p class="text-2xl font-bold">${stats.labelCount}</p>
          <p class="text-xs font-medium mt-0.5 opacity-75">Areas Found</p>
        </div>
        <div class="rounded-xl px-4 py-3 text-center bg-blue-100 text-blue-700">
          <p class="text-2xl font-bold">${stats.avgSafety}/5</p>
          <p class="text-xs font-medium mt-0.5 opacity-75">Avg Safety</p>
        </div>
        <div class="rounded-xl px-4 py-3 text-center bg-green-100 text-green-700">
          <p class="text-2xl font-bold">${escapeHtml(stats.modeCost)}</p>
          <p class="text-xs font-medium mt-0.5 opacity-75">Avg Cost</p>
        </div>
      </div>
    </section>

    ${
      areas.length > 0
        ? `
    <section class="mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-3">Top ${intent.label} in ${escapeHtml(city.name)}</h2>
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-gray-50">
              <th class="text-left px-4 py-3 text-gray-500 font-medium w-8">#</th>
              <th class="text-left px-4 py-3 text-gray-500 font-medium">Neighborhood</th>
              <th class="text-center px-3 py-3 text-gray-500 font-medium">Safety</th>
              <th class="text-center px-3 py-3 text-gray-500 font-medium">Cost</th>
              <th class="text-center px-3 py-3 text-gray-500 font-medium">Score</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            ${areas
              .map(
                (area, i) => `
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-gray-400 font-bold">${i + 1}</td>
                <td class="px-4 py-3"><a href="/${city.slug}/${area.slug}" class="font-medium text-gray-900 hover:text-teal-700">${escapeHtml(area.text)}</a></td>
                <td class="text-center px-3 py-3"><span class="text-xs font-bold px-2 py-0.5 rounded-full ${area.safety >= 4 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}">${area.safety}/5</span></td>
                <td class="text-center px-3 py-3 font-medium text-gray-700">${escapeHtml(area.cost)}</td>
                <td class="text-center px-3 py-3 font-bold ${area.sentiment > 0 ? "text-green-700" : "text-red-700"}">${area.sentiment > 0 ? "+" : ""}${area.sentiment}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
    `
        : ""
    }

    <section class="bg-white rounded-2xl border border-gray-200 p-6 mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-3">About ${intent.label} in ${escapeHtml(city.name)}</h2>
      <p class="text-gray-600 leading-relaxed">
        This guide features ${stats.labelCount} ${intent.description} in ${escapeHtml(city.name)}.
        All data comes from real community feedback and local insights. Average safety rating: <strong>${stats.avgSafety}/5</strong> · Typical cost: <strong>${escapeHtml(stats.modeCost)}</strong>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Explore "${intent.label}" in Other Cities</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        ${CITIES.filter((c) => c.slug !== city.slug)
          .slice(0, 8)
          .map(
            (c) => `
          <a href="/${c.slug}/${intent.slug}" class="bg-white border border-gray-200 rounded-lg p-4 text-center hover:border-teal-300 hover:shadow-md transition-all">
            <p class="font-semibold text-gray-900">${escapeHtml(c.name)}</p>
            <p class="text-xs text-gray-400 mt-1">${intent.emoji} ${intent.label}</p>
          </a>
        `
          )
          .join("")}
      </div>
    </section>

    ${(() => {
      const related = (INTENT_RELATED[intentSlug] ?? []).filter((s) => INTENT_MAP[s]);
      if (related.length === 0) return "";
      return `
    <section class="mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Related Guides for ${escapeHtml(city.name)}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        ${related.map((s) => {
          const rel = INTENT_MAP[s];
          return `
          <a href="/${city.slug}/${s}" class="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-md transition-all group">
            <span class="text-2xl flex-shrink-0">${rel.emoji}</span>
            <div>
              <p class="font-semibold text-gray-900 group-hover:text-teal-700 text-sm">${escapeHtml(rel.label)}</p>
              <p class="text-xs text-gray-400 mt-0.5">in ${escapeHtml(city.name)}</p>
            </div>
          </a>
        `}).join("")}
      </div>
    </section>`;
    })()}

    <section class="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-2xl p-6">
      <h2 class="text-base font-bold text-gray-900 mb-2">📍 See live cost data on the map</h2>
      <p class="text-sm text-gray-600 mb-3">Every label on PlaceLabels shows real-time local cost estimates — coffee, lunch, dinner, groceries, and 1BR rent — plus travel time and transport cost between any two neighborhoods.</p>
      <a href="/" class="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">Explore the interactive map →</a>
    </section>
  `;

  return ssrHtmlShell({
    title: `${intent.emoji} ${intent.label} in ${city.name} | PlaceLabels`,
    description: `Discover ${stats.labelCount} ${intent.description.toLowerCase()} in ${city.name}. Community-reviewed neighborhoods with safety, cost, and real local insights.`,
    canonical: `https://placelabels.com/${city.slug}/${intent.slug}`,
    bodyHtml,
    schemaJson: breadcrumbSchema,
  });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
