import { Router, type IRouter } from "express";
import { db, labelsTable, labelTagsTable } from "@workspace/db";
import { sql, inArray } from "drizzle-orm";
import { generateSitemapXml } from "../lib/sitemap";

const router: IRouter = Router();

type LabelRow = typeof labelsTable.$inferSelect;
type TagCounts = Record<string, number>;

interface CityDef {
  slug: string;
  name: string;
  country: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  intents: Record<string, string>;
}

const CITIES: CityDef[] = [
  { slug: "new-york", name: "New York", country: "US", latMin: 40.4, latMax: 41.0, lngMin: -74.3, lngMax: -73.7, intents: { "safe-neighborhoods": "safe", "affordable-areas": "affordable", "nightlife-areas": "nightlife", "family-friendly": "family" } },
  { slug: "san-francisco", name: "San Francisco", country: "US", latMin: 37.6, latMax: 37.9, lngMin: -122.6, lngMax: -122.3, intents: {} },
  { slug: "los-angeles", name: "Los Angeles", country: "US", latMin: 33.7, latMax: 34.4, lngMin: -118.7, lngMax: -118.0, intents: {} },
  { slug: "mexico-city", name: "Mexico City", country: "MX", latMin: 19.2, latMax: 19.6, lngMin: -99.4, lngMax: -98.9, intents: {} },
  { slug: "istanbul", name: "Istanbul", country: "TR", latMin: 40.8, latMax: 41.3, lngMin: 28.6, lngMax: 29.5, intents: {} },
  { slug: "amsterdam", name: "Amsterdam", country: "NL", latMin: 52.3, latMax: 52.5, lngMin: 4.7, lngMax: 5.1, intents: {} },
  { slug: "buenos-aires", name: "Buenos Aires", country: "AR", latMin: -34.8, latMax: -34.4, lngMin: -58.7, lngMax: -58.2, intents: {} },
  { slug: "toronto", name: "Toronto", country: "CA", latMin: 43.5, latMax: 43.9, lngMin: -79.7, lngMax: -79.1, intents: {} },
  { slug: "seoul", name: "Seoul", country: "KR", latMin: 37.4, latMax: 37.7, lngMin: 126.8, lngMax: 127.3, intents: {} },
  { slug: "cairo", name: "Cairo", country: "EG", latMin: 29.9, latMax: 30.2, lngMin: 31.1, lngMax: 31.5, intents: {} },
  { slug: "hong-kong", name: "Hong Kong", country: "HK", latMin: 22.1, latMax: 22.6, lngMin: 113.9, lngMax: 114.5, intents: {} },
  { slug: "bali", name: "Bali", country: "ID", latMin: -8.9, latMax: -8.3, lngMin: 115.0, lngMax: 115.5, intents: {} },
  { slug: "cape-town", name: "Cape Town", country: "ZA", latMin: -34.2, latMax: -33.7, lngMin: 18.3, lngMax: 18.7, intents: {} },
  { slug: "rome", name: "Rome", country: "IT", latMin: 41.7, latMax: 42.1, lngMin: 12.3, lngMax: 12.7, intents: {} },
  { slug: "tehran", name: "Tehran", country: "IR", latMin: 35.5, latMax: 36.0, lngMin: 51.0, lngMax: 51.7, intents: {} },
  { slug: "tel-aviv", name: "Tel Aviv", country: "IL", latMin: 31.9, latMax: 32.2, lngMin: 34.7, lngMax: 35.05, intents: {} },
  { slug: "jerusalem", name: "Jerusalem", country: "IL", latMin: 31.6, latMax: 31.9, lngMin: 35.1, lngMax: 35.4, intents: {} },
  { slug: "karachi", name: "Karachi", country: "PK", latMin: 24.7, latMax: 25.2, lngMin: 66.8, lngMax: 67.4, intents: {} },
  { slug: "lahore", name: "Lahore", country: "PK", latMin: 31.3, latMax: 31.7, lngMin: 74.1, lngMax: 74.5, intents: {} },
  { slug: "mumbai", name: "Mumbai", country: "IN", latMin: 18.7, latMax: 19.4, lngMin: 72.4, lngMax: 73.3, intents: {} },
  { slug: "delhi", name: "Delhi", country: "IN", latMin: 28.3, latMax: 29.1, lngMin: 76.7, lngMax: 77.5, intents: {} },
  { slug: "bangalore", name: "Bangalore", country: "IN", latMin: 12.5, latMax: 13.4, lngMin: 77.2, lngMax: 78.0, intents: {} },
  { slug: "hyderabad", name: "Hyderabad", country: "IN", latMin: 16.9, latMax: 17.8, lngMin: 78.0, lngMax: 78.9, intents: {} },
  { slug: "chennai", name: "Chennai", country: "IN", latMin: 12.6, latMax: 13.5, lngMin: 79.8, lngMax: 80.8, intents: {} },
  { slug: "kolkata", name: "Kolkata", country: "IN", latMin: 22.1, latMax: 22.9, lngMin: 88.0, lngMax: 88.8, intents: {} },
  { slug: "pune", name: "Pune", country: "IN", latMin: 18.0, latMax: 18.9, lngMin: 73.4, lngMax: 74.3, intents: {} },
  { slug: "ahmedabad", name: "Ahmedabad", country: "IN", latMin: 22.5, latMax: 23.3, lngMin: 72.3, lngMax: 73.2, intents: {} },
  { slug: "jaipur", name: "Jaipur", country: "IN", latMin: 26.4, latMax: 27.2, lngMin: 75.4, lngMax: 76.2, intents: {} },
  { slug: "lucknow", name: "Lucknow", country: "IN", latMin: 26.3, latMax: 27.1, lngMin: 80.5, lngMax: 81.3, intents: {} },
  { slug: "chandigarh", name: "Chandigarh", country: "IN", latMin: 30.3, latMax: 31.1, lngMin: 76.3, lngMax: 77.2, intents: {} },
  { slug: "goa", name: "Goa", country: "IN", latMin: 14.8, latMax: 15.8, lngMin: 73.3, lngMax: 74.3, intents: {} },
  { slug: "indore", name: "Indore", country: "IN", latMin: 22.2, latMax: 23.0, lngMin: 75.4, lngMax: 76.2, intents: {} },
  { slug: "coimbatore", name: "Coimbatore", country: "IN", latMin: 10.8, latMax: 11.2, lngMin: 76.8, lngMax: 77.2, intents: {} },
  { slug: "london", name: "London", country: "GB", latMin: 51.3, latMax: 51.7, lngMin: -0.3, lngMax: 0.1, intents: { "safe-neighborhoods": "safe", "affordable-areas": "affordable", "nightlife-areas": "nightlife", "family-friendly": "family" } },
  { slug: "tokyo", name: "Tokyo", country: "JP", latMin: 35.5, latMax: 35.8, lngMin: 139.5, lngMax: 139.9, intents: {} },
];

const INTENT_TAG_MAP: Record<string, string> = {
  safe: "safe-at-night",
  quiet: "quiet",
  family: "family-friendly",
  students: "good-for-students",
  expensive: "expensive",
  nightlife: "good-nightlife",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-");
}

function getCityForLabel(label: LabelRow): CityDef | null {
  return CITIES.find(
    (c) =>
      label.lat >= c.latMin &&
      label.lat <= c.latMax &&
      label.lng >= c.lngMin &&
      label.lng <= c.lngMax
  ) ?? null;
}

function modeOf(arr: string[]): string {
  if (!arr.length) return "$$";
  const counts: Record<string, number> = {};
  for (const v of arr) counts[v] = (counts[v] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function topVibes(labels: LabelRow[], limit = 5): string[] {
  const counts: Record<string, number> = {};
  for (const l of labels) {
    for (const v of l.vibe ?? []) {
      counts[v] = (counts[v] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([v]) => v);
}

function aggregateArea(labels: LabelRow[]) {
  if (!labels.length) return null;
  const avgSafety = labels.reduce((s, l) => s + l.safety, 0) / labels.length;
  const modeCost = modeOf(labels.map((l) => l.cost));
  const vibes = topVibes(labels);
  const sentiment = labels.reduce((s, l) => s + (l.upvotes - l.downvotes), 0);
  const totalUpvotes = labels.reduce((s, l) => s + l.upvotes, 0);
  const totalDownvotes = labels.reduce((s, l) => s + l.downvotes, 0);
  const bestLabel = [...labels].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))[0];
  return {
    avgSafety: Math.round(avgSafety * 10) / 10,
    modeCost,
    vibes,
    sentiment,
    totalUpvotes,
    totalDownvotes,
    labelCount: labels.length,
    lat: bestLabel.lat,
    lng: bestLabel.lng,
    topLabel: bestLabel.text,
  };
}

function matchesIntent(label: LabelRow, intent: string, tagCounts: TagCounts = {}): boolean {
  const vibe = label.vibe ?? [];
  const tagKey = INTENT_TAG_MAP[intent];
  const tagCount = tagKey ? (tagCounts[tagKey] ?? 0) : 0;

  switch (intent) {
    case "safe":
      return label.safety >= 4 || tagCount >= 2;
    case "affordable":
      return label.cost === "$" || label.cost === "$$";
    case "nightlife":
      return vibe.some((v) => ["Nightlife", "Bars", "Loud"].includes(v)) ||
        label.category === "Bars" ||
        tagCount >= 2;
    case "family":
      return vibe.includes("Family") || label.category === "Parks" || tagCount >= 2;
    case "students":
      return (label.cost === "$" || label.cost === "$$") &&
        (vibe.some((v) => ["Artsy", "Chill", "Bars", "Nightlife"].includes(v)) || label.safety >= 3 || tagCount >= 1);
    case "young-professionals":
      return label.safety >= 3 &&
        (vibe.some((v) => ["Artsy", "Chill", "Bougie", "Bars"].includes(v)) || label.cost === "$$$");
    case "quiet":
      return (!vibe.includes("Loud") && !vibe.includes("Nightlife") && label.safety >= 3) || tagCount >= 2;
    case "expensive":
      return label.cost === "$$$" || label.cost === "$$$$" || tagCount >= 2;
    default:
      return true;
  }
}

function intentScore(label: LabelRow, intent: string, tagCounts: TagCounts = {}): number {
  const tagKey = INTENT_TAG_MAP[intent];
  const tagCount = tagKey ? (tagCounts[tagKey] ?? 0) : 0;
  const sentiment = label.upvotes - label.downvotes;
  return sentiment + tagCount * 2;
}

async function buildTagCountMap(labelIds: string[]): Promise<Record<string, TagCounts>> {
  if (!labelIds.length) return {};
  const rows = await db
    .select({
      labelId: labelTagsTable.labelId,
      tagKey: labelTagsTable.tagKey,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(labelTagsTable)
    .where(inArray(labelTagsTable.labelId, labelIds))
    .groupBy(labelTagsTable.labelId, labelTagsTable.tagKey);

  const map: Record<string, TagCounts> = {};
  for (const row of rows) {
    if (!map[row.labelId]) map[row.labelId] = {};
    map[row.labelId][row.tagKey] = row.count;
  }
  return map;
}

const INTENT_SLUGS: Record<string, string> = {
  "safe-neighborhoods": "safe",
  "affordable-areas": "affordable",
  "nightlife-areas": "nightlife",
  "family-friendly": "family",
  "best-areas-for-students": "students",
  "best-areas-for-young-professionals": "young-professionals",
  "quiet-neighborhoods": "quiet",
  "expensive-neighborhoods": "expensive",
};

const INTENT_LABELS: Record<string, string> = {
  safe: "Safe Neighborhoods",
  affordable: "Affordable Areas",
  nightlife: "Nightlife Areas",
  family: "Family-Friendly Neighborhoods",
  students: "Best Areas for Students",
  "young-professionals": "Best Areas for Young Professionals",
  quiet: "Quiet Neighborhoods",
  expensive: "Expensive Neighborhoods",
};

router.get("/cities", async (_req, res) => {
  const allLabels = await db.select().from(labelsTable);

  const result = CITIES.map((city) => {
    const cityLabels = allLabels.filter((l) => {
      const c = getCityForLabel(l);
      return c?.slug === city.slug;
    });
    if (!cityLabels.length) return null;
    const stats = aggregateArea(cityLabels);
    return {
      slug: city.slug,
      name: city.name,
      country: city.country,
      ...stats,
    };
  }).filter(Boolean);

  res.json(result);
});

// Guard: /city/sitemap.xml was generating 404s because Express treated
// "sitemap.xml" as a city slug. Redirect to the canonical sitemap instead.
router.get("/city/sitemap.xml", (_req, res) => {
  res.redirect(301, "/sitemap.xml");
});

router.get("/city/:city", async (req, res) => {
  const cityDef = CITIES.find((c) => c.slug === req.params.city);
  if (!cityDef) { res.status(404).json({ error: "City not found" }); return; }

  const allLabels = await db.select().from(labelsTable);
  const cityLabels = allLabels.filter((l) => {
    const c = getCityForLabel(l);
    return c?.slug === cityDef.slug;
  });

  const cityStats = aggregateArea(cityLabels);

  const areas = cityLabels.map((label) => {
    const s = label.upvotes - label.downvotes;
    return {
      id: label.id,
      slug: slugify(label.text),
      text: label.text,
      lat: label.lat,
      lng: label.lng,
      safety: label.safety,
      cost: label.cost,
      vibe: label.vibe ?? [],
      upvotes: label.upvotes,
      downvotes: label.downvotes,
      sentiment: s,
      category: label.category,
      color: label.color,
    };
  }).sort((a, b) => b.sentiment - a.sentiment);

  res.json({
    city: {
      slug: cityDef.slug,
      name: cityDef.name,
      country: cityDef.country,
    },
    stats: cityStats,
    areas,
    intents: Object.keys(INTENT_SLUGS).map((key) => ({
      slug: key,
      label: INTENT_LABELS[INTENT_SLUGS[key]],
      url: `/${cityDef.slug}/${key}`,
    })),
  });
});

router.get("/area/:city/:areaSlug", async (req, res) => {
  const cityDef = CITIES.find((c) => c.slug === req.params.city);
  if (!cityDef) { res.status(404).json({ error: "City not found" }); return; }

  const allLabels = await db.select().from(labelsTable);
  const cityLabels = allLabels.filter((l) => {
    const c = getCityForLabel(l);
    return c?.slug === cityDef.slug;
  });

  const matchedLabel = cityLabels.find((l) => slugify(l.text) === req.params.areaSlug);
  if (!matchedLabel) { res.status(404).json({ error: "Area not found" }); return; }

  const RADIUS = 0.03;
  const nearbyLabels = cityLabels.filter(
    (l) =>
      l.id !== matchedLabel.id &&
      Math.abs(l.lat - matchedLabel.lat) <= RADIUS &&
      Math.abs(l.lng - matchedLabel.lng) <= RADIUS
  );

  const areaStats = aggregateArea([matchedLabel, ...nearbyLabels]);

  res.json({
    city: { slug: cityDef.slug, name: cityDef.name },
    area: {
      id: matchedLabel.id,
      slug: req.params.areaSlug,
      text: matchedLabel.text,
      lat: matchedLabel.lat,
      lng: matchedLabel.lng,
      safety: matchedLabel.safety,
      cost: matchedLabel.cost,
      vibe: matchedLabel.vibe ?? [],
      upvotes: matchedLabel.upvotes,
      downvotes: matchedLabel.downvotes,
      sentiment: matchedLabel.upvotes - matchedLabel.downvotes,
      category: matchedLabel.category,
      color: matchedLabel.color,
    },
    nearby: nearbyLabels
      .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
      .slice(0, 10)
      .map((l) => ({
        id: l.id,
        slug: slugify(l.text),
        text: l.text,
        safety: l.safety,
        cost: l.cost,
        vibe: l.vibe ?? [],
        sentiment: l.upvotes - l.downvotes,
        url: `/${cityDef.slug}/${slugify(l.text)}`,
      })),
    stats: areaStats,
  });
});

router.get("/intent/:city/:intent", async (req, res) => {
  const cityDef = CITIES.find((c) => c.slug === req.params.city);
  if (!cityDef) { res.status(404).json({ error: "City not found" }); return; }

  const intentKey = INTENT_SLUGS[req.params.intent];
  if (!intentKey) { res.status(404).json({ error: "Intent not found" }); return; }

  const allLabels = await db.select().from(labelsTable);
  const cityLabels = allLabels.filter((l) => {
    const c = getCityForLabel(l);
    return c?.slug === cityDef.slug;
  });

  const cityLabelIds = cityLabels.map((l) => l.id);
  const tagCountMap = await buildTagCountMap(cityLabelIds);

  const filtered = cityLabels
    .filter((l) => matchesIntent(l, intentKey, tagCountMap[l.id] ?? {}))
    .sort((a, b) => intentScore(b, intentKey, tagCountMap[b.id] ?? {}) - intentScore(a, intentKey, tagCountMap[a.id] ?? {}));

  const stats = aggregateArea(filtered);

  res.json({
    city: { slug: cityDef.slug, name: cityDef.name },
    intent: {
      slug: req.params.intent,
      key: intentKey,
      label: INTENT_LABELS[intentKey],
    },
    stats,
    areas: filtered.map((l) => ({
      id: l.id,
      slug: slugify(l.text),
      text: l.text,
      lat: l.lat,
      lng: l.lng,
      safety: l.safety,
      cost: l.cost,
      vibe: l.vibe ?? [],
      sentiment: l.upvotes - l.downvotes,
      upvotes: l.upvotes,
      downvotes: l.downvotes,
      category: l.category,
      topTags: Object.entries(tagCountMap[l.id] ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k),
      url: `/${cityDef.slug}/${slugify(l.text)}`,
    })),
    allIntents: Object.keys(INTENT_SLUGS).map((key) => ({
      slug: key,
      label: INTENT_LABELS[INTENT_SLUGS[key]],
      url: `/${cityDef.slug}/${key}`,
      active: key === req.params.intent,
    })),
  });
});

router.get("/compare", async (req, res) => {
  const { a, b } = req.query as { a?: string; b?: string };
  if (!a || !b) { res.status(400).json({ error: "Provide ?a=area-slug&b=area-slug" }); return; }

  const allLabels = await db.select().from(labelsTable);

  const findArea = (slug: string) => {
    const label = allLabels.find((l) => slugify(l.text) === slug);
    if (!label) return null;
    const city = getCityForLabel(label);
    return { label, city };
  };

  const aData = findArea(a);
  const bData = findArea(b);

  if (!aData || !bData) {
    res.status(404).json({ error: "One or both areas not found" });
    return;
  }

  const formatArea = (data: { label: LabelRow; city: CityDef | null }) => ({
    id: data.label.id,
    slug: slugify(data.label.text),
    text: data.label.text,
    city: data.city ? { slug: data.city.slug, name: data.city.name } : null,
    safety: data.label.safety,
    cost: data.label.cost,
    vibe: data.label.vibe ?? [],
    upvotes: data.label.upvotes,
    downvotes: data.label.downvotes,
    sentiment: data.label.upvotes - data.label.downvotes,
    category: data.label.category,
    lat: data.label.lat,
    lng: data.label.lng,
  });

  const aFormatted = formatArea(aData);
  const bFormatted = formatArea(bData);

  const winner = (field: "safety" | "sentiment" | "upvotes") => {
    if (aFormatted[field] > bFormatted[field]) return "a";
    if (bFormatted[field] > aFormatted[field]) return "b";
    return "tie";
  };

  const costRank: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
  const cheaperArea = (costRank[aFormatted.cost] || 2) <= (costRank[bFormatted.cost] || 2) ? "a" : "b";

  res.json({
    a: aFormatted,
    b: bFormatted,
    verdict: {
      safer: winner("safety"),
      betterRated: winner("sentiment"),
      cheaper: cheaperArea,
      morePopular: winner("upvotes"),
    },
  });
});

// Redirect the old /api/seo/sitemap endpoint to the canonical sitemap.
// The prerendered static sitemap.xml (served by express.static) is authoritative
// — it includes all label pages generated at build time from the DB.
router.get("/sitemap", (_req, res) => {
  res.redirect(301, "/sitemap.xml");
});

export default router;
