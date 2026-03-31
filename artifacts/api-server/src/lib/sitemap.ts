import { db, labelsTable } from "@workspace/db";

const CITIES = [
  { slug: "new-york", latMin: 40.4, latMax: 41.0, lngMin: -74.3, lngMax: -73.7 },
  { slug: "san-francisco", latMin: 37.6, latMax: 37.9, lngMin: -122.6, lngMax: -122.3 },
  { slug: "los-angeles", latMin: 33.7, latMax: 34.4, lngMin: -118.7, lngMax: -118.0 },
  { slug: "mexico-city", latMin: 19.2, latMax: 19.6, lngMin: -99.4, lngMax: -98.9 },
  { slug: "istanbul", latMin: 40.8, latMax: 41.3, lngMin: 28.6, lngMax: 29.5 },
  { slug: "amsterdam", latMin: 52.3, latMax: 52.5, lngMin: 4.7, lngMax: 5.1 },
  { slug: "buenos-aires", latMin: -34.8, latMax: -34.4, lngMin: -58.7, lngMax: -58.2 },
  { slug: "toronto", latMin: 43.5, latMax: 43.9, lngMin: -79.7, lngMax: -79.1 },
  { slug: "seoul", latMin: 37.4, latMax: 37.7, lngMin: 126.8, lngMax: 127.3 },
  { slug: "cairo", latMin: 29.9, latMax: 30.2, lngMin: 31.1, lngMax: 31.5 },
  { slug: "hong-kong", latMin: 22.1, latMax: 22.6, lngMin: 113.9, lngMax: 114.5 },
  { slug: "bali", latMin: -8.9, latMax: -8.3, lngMin: 115.0, lngMax: 115.5 },
  { slug: "cape-town", latMin: -34.2, latMax: -33.7, lngMin: 18.3, lngMax: 18.7 },
  { slug: "rome", latMin: 41.7, latMax: 42.1, lngMin: 12.3, lngMax: 12.7 },
  { slug: "tehran", latMin: 35.5, latMax: 36.0, lngMin: 51.0, lngMax: 51.7 },
  { slug: "tel-aviv", latMin: 31.9, latMax: 32.2, lngMin: 34.7, lngMax: 35.05 },
  { slug: "jerusalem", latMin: 31.6, latMax: 31.9, lngMin: 35.1, lngMax: 35.4 },
  { slug: "karachi", latMin: 24.7, latMax: 25.2, lngMin: 66.8, lngMax: 67.4 },
  { slug: "lahore", latMin: 31.3, latMax: 31.7, lngMin: 74.1, lngMax: 74.5 },
];

const INTENT_SLUGS = [
  "safe-neighborhoods",
  "affordable-areas",
  "nightlife-areas",
  "family-friendly",
  "best-areas-for-students",
  "best-areas-for-young-professionals",
  "quiet-neighborhoods",
  "expensive-neighborhoods",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-");
}

function toIsoDate(d: Date | null | undefined): string {
  const date = d ?? new Date();
  return date.toISOString().split("T")[0];
}

function getCitySlug(lat: number, lng: number): string | null {
  const city = CITIES.find(
    (c) => lat >= c.latMin && lat <= c.latMax && lng >= c.lngMin && lng <= c.lngMax
  );
  return city?.slug ?? null;
}

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

function xmlEscape(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function generateSitemapXml(baseUrl = "https://hoodsignal.com"): Promise<string> {
  const allLabels = await db.select().from(labelsTable);
  const today = toIsoDate(new Date());

  const entries: SitemapEntry[] = [];

  entries.push({ loc: `${baseUrl}/`, lastmod: today, changefreq: "daily", priority: "1.0" });

  const citiesWithLabels = new Map<string, { labels: typeof allLabels; maxDate: Date }>();

  for (const label of allLabels) {
    const citySlug = getCitySlug(label.lat, label.lng);
    if (!citySlug) continue;
    const existing = citiesWithLabels.get(citySlug);
    const labelDate = label.createdAt ?? new Date();
    if (!existing) {
      citiesWithLabels.set(citySlug, { labels: [label], maxDate: labelDate });
    } else {
      existing.labels.push(label);
      if (labelDate > existing.maxDate) existing.maxDate = labelDate;
    }
  }

  for (const [citySlug, { labels, maxDate }] of citiesWithLabels) {
    entries.push({
      loc: xmlEscape(`${baseUrl}/${citySlug}`),
      lastmod: toIsoDate(maxDate),
      changefreq: "weekly",
      priority: "0.9",
    });

    for (const intentSlug of INTENT_SLUGS) {
      entries.push({
        loc: xmlEscape(`${baseUrl}/${citySlug}/${intentSlug}`),
        lastmod: toIsoDate(maxDate),
        changefreq: "weekly",
        priority: "0.8",
      });
    }

    for (const label of labels) {
      entries.push({
        loc: xmlEscape(`${baseUrl}/${citySlug}/${slugify(label.text)}`),
        lastmod: toIsoDate(label.createdAt),
        changefreq: "monthly",
        priority: "0.7",
      });
    }
  }

  const slugs = allLabels.map((l) => ({ slug: slugify(l.text), date: l.createdAt }));
  for (let i = 0; i < slugs.length; i++) {
    const limit = Math.min(i + 5, slugs.length);
    for (let j = i + 1; j < limit; j++) {
      const a = slugs[i];
      const b = slugs[j];
      const maxDate = (a.date ?? new Date()) > (b.date ?? new Date()) ? a.date : b.date;
      entries.push({
        loc: xmlEscape(`${baseUrl}/compare/${a.slug}-vs-${b.slug}`),
        lastmod: toIsoDate(maxDate),
        changefreq: "monthly",
        priority: "0.5",
      });
    }
  }

  const urlEntries = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}
