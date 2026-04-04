/**
 * City page SSR generator
 * Renders city overview pages with neighborhood data
 */

import { db, labelsTable, labelTagsTable } from "@workspace/db";
import { sql, inArray, count as countFn } from "drizzle-orm";
import { ssrHtmlShell } from "./ssrShared";

interface CityDef {
  slug: string;
  name: string;
  country: string;
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
  upvotes: number;
  downvotes: number;
}

const CITIES: CityDef[] = [
  { slug: "new-york", name: "New York", country: "US", latMin: 40.4, latMax: 41.0, lngMin: -74.3, lngMax: -73.7 },
  { slug: "san-francisco", name: "San Francisco", country: "US", latMin: 37.6, latMax: 37.9, lngMin: -122.6, lngMax: -122.3 },
  { slug: "los-angeles", name: "Los Angeles", country: "US", latMin: 33.7, latMax: 34.4, lngMin: -118.7, lngMax: -118.0 },
  { slug: "toronto", name: "Toronto", country: "CA", latMin: 43.5, latMax: 43.9, lngMin: -79.7, lngMax: -79.1 },
  { slug: "mexico-city", name: "Mexico City", country: "MX", latMin: 19.2, latMax: 19.6, lngMin: -99.4, lngMax: -98.9 },
  { slug: "buenos-aires", name: "Buenos Aires", country: "AR", latMin: -34.8, latMax: -34.4, lngMin: -58.7, lngMax: -58.2 },
  { slug: "london", name: "London", country: "UK", latMin: 51.3, latMax: 51.7, lngMin: -0.3, lngMax: 0.1 },
  { slug: "amsterdam", name: "Amsterdam", country: "NL", latMin: 52.3, latMax: 52.5, lngMin: 4.7, lngMax: 5.1 },
  { slug: "rome", name: "Rome", country: "IT", latMin: 41.7, latMax: 42.1, lngMin: 12.3, lngMax: 12.7 },
  { slug: "istanbul", name: "Istanbul", country: "TR", latMin: 40.8, latMax: 41.3, lngMin: 28.6, lngMax: 29.5 },
  { slug: "tel-aviv", name: "Tel Aviv", country: "IL", latMin: 31.9, latMax: 32.2, lngMin: 34.7, lngMax: 35.05 },
  { slug: "jerusalem", name: "Jerusalem", country: "IL", latMin: 31.6, latMax: 31.9, lngMin: 35.1, lngMax: 35.4 },
  { slug: "tehran", name: "Tehran", country: "IR", latMin: 35.5, latMax: 36.0, lngMin: 51.0, lngMax: 51.7 },
  { slug: "cairo", name: "Cairo", country: "EG", latMin: 29.9, latMax: 30.2, lngMin: 31.1, lngMax: 31.5 },
  { slug: "cape-town", name: "Cape Town", country: "ZA", latMin: -34.2, latMax: -33.7, lngMin: 18.3, lngMax: 18.7 },
  { slug: "tokyo", name: "Tokyo", country: "JP", latMin: 35.5, latMax: 35.8, lngMin: 139.5, lngMax: 139.9 },
  { slug: "seoul", name: "Seoul", country: "KR", latMin: 37.4, latMax: 37.7, lngMin: 126.8, lngMax: 127.3 },
  { slug: "hong-kong", name: "Hong Kong", country: "HK", latMin: 22.1, latMax: 22.6, lngMin: 113.9, lngMax: 114.5 },
  { slug: "bali", name: "Bali", country: "ID", latMin: -8.9, latMax: -8.3, lngMin: 115.0, lngMax: 115.5 },
  { slug: "karachi", name: "Karachi", country: "PK", latMin: 24.7, latMax: 25.2, lngMin: 66.8, lngMax: 67.4 },
  { slug: "lahore", name: "Lahore", country: "PK", latMin: 31.3, latMax: 31.7, lngMin: 74.1, lngMax: 74.5 },
  { slug: "mumbai", name: "Mumbai", country: "IN", latMin: 18.7, latMax: 19.4, lngMin: 72.4, lngMax: 73.3 },
  { slug: "delhi", name: "Delhi", country: "IN", latMin: 28.3, latMax: 29.1, lngMin: 76.7, lngMax: 77.5 },
  { slug: "bangalore", name: "Bangalore", country: "IN", latMin: 12.5, latMax: 13.4, lngMin: 77.2, lngMax: 78.0 },
  { slug: "hyderabad", name: "Hyderabad", country: "IN", latMin: 16.9, latMax: 17.8, lngMin: 78.0, lngMax: 78.9 },
  { slug: "pune", name: "Pune", country: "IN", latMin: 18.0, latMax: 18.9, lngMin: 73.4, lngMax: 74.3 },
  { slug: "chennai", name: "Chennai", country: "IN", latMin: 12.6, latMax: 13.5, lngMin: 79.8, lngMax: 80.8 },
  { slug: "kolkata", name: "Kolkata", country: "IN", latMin: 22.1, latMax: 22.9, lngMin: 88.0, lngMax: 88.8 },
  { slug: "ahmedabad", name: "Ahmedabad", country: "IN", latMin: 22.5, latMax: 23.3, lngMin: 72.3, lngMax: 73.2 },
  { slug: "jaipur", name: "Jaipur", country: "IN", latMin: 26.4, latMax: 27.2, lngMin: 75.4, lngMax: 76.2 },
  { slug: "lucknow", name: "Lucknow", country: "IN", latMin: 26.3, latMax: 27.1, lngMin: 80.5, lngMax: 81.3 },
  { slug: "chandigarh", name: "Chandigarh", country: "IN", latMin: 30.3, latMax: 31.1, lngMin: 76.3, lngMax: 77.2 },
  { slug: "goa", name: "Goa", country: "IN", latMin: 14.8, latMax: 15.8, lngMin: 73.3, lngMax: 74.3 },
  { slug: "indore", name: "Indore", country: "IN", latMin: 22.2, latMax: 23.0, lngMin: 75.4, lngMax: 76.2 },
  { slug: "coimbatore", name: "Coimbatore", country: "IN", latMin: 10.8, latMax: 11.2, lngMin: 76.8, lngMax: 77.2 },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-");
}

async function getCityData(citySlug: string): Promise<{
  city: CityDef;
  areas: AreaData[];
  stats: { avgSafety: number; modeCost: string; labelCount: number; topLabel: string };
} | null> {
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) return null;

  const labels = await db
    .select()
    .from(labelsTable)
    .where(
      sql`lat >= ${city.latMin} AND lat <= ${city.latMax} AND lng >= ${city.lngMin} AND lng <= ${city.lngMax}`
    );

  const areas: AreaData[] = [];
  const areaMap = new Map<string, AreaData>();

  for (const label of labels) {
    const areaSlug = slugify(label.text);
    if (!areaMap.has(areaSlug)) {
      areaMap.set(areaSlug, {
        text: label.text,
        slug: areaSlug,
        safety: label.safety ?? 3,
        cost: label.cost ?? "$$",
        sentiment: 0,
        upvotes: 0,
        downvotes: 0,
      });
    }
    const area = areaMap.get(areaSlug)!;
    area.upvotes += label.upvotes ?? 0;
    area.downvotes += label.downvotes ?? 0;
    area.sentiment = area.upvotes - area.downvotes;
  }

  areas.push(...Array.from(areaMap.values()).sort((a, b) => b.sentiment - a.sentiment));

  const avgSafety = areas.length > 0 ? Math.round((areas.reduce((sum, a) => sum + a.safety, 0) / areas.length) * 10) / 10 : 3;
  const modeCost = areas.length > 0 ? areas[0].cost : "$$";
  const topLabel = areas[0]?.text ?? "Unknown";

  return {
    city,
    areas: areas.slice(0, 10),
    stats: { avgSafety, modeCost, labelCount: areas.length, topLabel },
  };
}

export async function getCityHtml(citySlug: string): Promise<string | null> {
  const data = await getCityData(citySlug);
  if (!data) return null;

  const { city, areas, stats } = data;
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
    ],
  };

  const bodyHtml = `
    <div class="mb-8">
      <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">${escapeHtml(city.name)} Neighborhoods</h1>
      <p class="text-gray-600 text-lg leading-relaxed max-w-2xl">Discover real neighborhood vibes from locals. Check safety, cost, and local vibes for every neighborhood in ${escapeHtml(city.name)}.</p>
    </div>

    <section class="mb-10">
      <div class="grid sm:grid-cols-4 gap-4">
        <div class="rounded-xl px-4 py-3 text-center bg-gray-100 text-gray-700">
          <p class="text-2xl font-bold">${stats.labelCount}</p>
          <p class="text-xs font-medium mt-0.5 opacity-75">Neighborhoods</p>
        </div>
        <div class="rounded-xl px-4 py-3 text-center bg-blue-100 text-blue-700">
          <p class="text-2xl font-bold">${stats.avgSafety}/5</p>
          <p class="text-xs font-medium mt-0.5 opacity-75">Avg Safety</p>
        </div>
        <div class="rounded-xl px-4 py-3 text-center bg-green-100 text-green-700">
          <p class="text-2xl font-bold">${stats.modeCost}</p>
          <p class="text-xs font-medium mt-0.5 opacity-75">Avg Cost</p>
        </div>
        <div class="rounded-xl px-4 py-3 text-center bg-amber-100 text-amber-700">
          <p class="text-2xl font-bold">${city.country}</p>
          <p class="text-xs font-medium mt-0.5 opacity-75">Country</p>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Top ${Math.min(5, areas.length)} Neighborhoods</h2>
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
              .slice(0, 5)
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

    <section class="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-bold text-gray-900 mb-3">Where to Live in ${escapeHtml(city.name)} — ${year} Guide</h2>
      <div class="text-gray-600 space-y-3">
        <p>Looking for the <strong>best neighborhoods in ${escapeHtml(city.name)}</strong>? Our crowd-sourced guide covers ${stats.labelCount} areas based on real local signals. The city earns an overall safety rating of <strong>${stats.avgSafety}/5</strong>, with a typical cost of <strong>${escapeHtml(stats.modeCost)}</strong>.</p>
        <p>The top-rated neighborhood is <strong>"${escapeHtml(stats.topLabel)}"</strong>. Every neighborhood page shows live cost estimates (coffee, lunch, rent) and transit costs to other areas.</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Explore ${escapeHtml(city.name)} by Category</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${[
          { slug: "safe-neighborhoods",          emoji: "🛡️", label: "Safe Neighborhoods",         sub: "High safety ratings" },
          { slug: "affordable-areas",             emoji: "💰", label: "Affordable Areas",            sub: "Budget-friendly living" },
          { slug: "cheap-rent",                   emoji: "🏠", label: "Cheap Rent",                  sub: "Low-cost housing options" },
          { slug: "cost-of-living",               emoji: "📊", label: "Low Cost of Living",          sub: "Best value neighborhoods" },
          { slug: "expensive-neighborhoods",      emoji: "💎", label: "Expensive Areas",             sub: "Premium & high-end zones" },
          { slug: "luxury-real-estate",           emoji: "🏙️", label: "Luxury Real Estate",         sub: "Upscale neighborhood guide" },
          { slug: "transit-friendly",             emoji: "🚇", label: "Transit-Friendly",            sub: "Best public transport links" },
          { slug: "walkable-neighborhoods",       emoji: "🚶", label: "Walkable Neighborhoods",      sub: "Pedestrian-friendly areas" },
          { slug: "expat-neighborhoods",          emoji: "🌍", label: "Expat-Friendly",              sub: "Popular with internationals" },
          { slug: "family-friendly",              emoji: "👨‍👩‍👧‍👦", label: "Family-Friendly",       sub: "Great for raising kids" },
          { slug: "nightlife-areas",              emoji: "🎉", label: "Best Nightlife",              sub: "Top entertainment zones" },
          { slug: "best-areas-for-young-professionals", emoji: "💼", label: "Young Professionals",   sub: "Work-life balance hubs" },
        ].map(({ slug, emoji, label, sub }) => `
          <a href="/${city.slug}/${slug}" class="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 hover:border-teal-300 hover:bg-white hover:shadow-sm transition-all group">
            <span class="text-xl flex-shrink-0">${emoji}</span>
            <div>
              <p class="text-sm font-semibold text-gray-900 group-hover:text-teal-700">${label} in ${escapeHtml(city.name)}</p>
              <p class="text-xs text-gray-400 mt-0.5">${sub}</p>
            </div>
          </a>
        `).join("")}
      </div>
    </section>

    <section class="mt-10">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Explore Other Cities</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        ${CITIES.filter((c) => c.slug !== city.slug)
          .slice(0, 6)
          .map(
            (c) => `
          <a href="/${c.slug}" class="bg-white border border-gray-200 rounded-lg p-4 text-center hover:border-teal-300 hover:shadow-md transition-all">
            <p class="font-semibold text-gray-900">${escapeHtml(c.name)}</p>
            <p class="text-xs text-gray-400 mt-1">Browse neighborhoods</p>
          </a>
        `
          )
          .join("")}
      </div>
    </section>
  `;

  return ssrHtmlShell({
    title: `${city.name} Neighborhoods | PlaceLabels`,
    description: `Discover real neighborhood vibes in ${city.name}. Browse ${stats.labelCount} areas with safety, cost, and community insights from locals.`,
    canonical: `https://placelabels.com/${city.slug}`,
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
