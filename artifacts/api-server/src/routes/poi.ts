import { Router, type Request, type Response } from "express";

const router = Router();

const CATEGORY_QUERIES: Record<string, string> = {
  temple:     '[amenity=place_of_worship][religion=hindu]',
  mosque:     '[amenity=place_of_worship][religion=muslim]',
  church:     '[amenity=place_of_worship][religion=christian]',
  hospital:   '[amenity=hospital]',
  school:     '[amenity=school]',
  fuel:       '[amenity=fuel]',
  ev_charger: '[amenity=charging_station]',
};

interface CacheEntry { ts: number; geojson: object }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

router.get("/", async (req: Request, res: Response) => {
  const { category, south, west, north, east } = req.query as Record<string, string>;

  if (!category || !CATEGORY_QUERIES[category]) {
    return res.status(400).json({ error: "Invalid or missing category" });
  }
  const s = parseFloat(south), w = parseFloat(west), n = parseFloat(north), e = parseFloat(east);
  if ([s, w, n, e].some(isNaN)) {
    return res.status(400).json({ error: "Missing or invalid bbox params (south/west/north/east)" });
  }

  const bboxStr = `${s},${w},${n},${e}`;
  const cacheKey = `${category}:${bboxStr}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.geojson);
  }

  const filter = CATEGORY_QUERIES[category];
  const overpassQuery = `[out:json][timeout:10];node${filter}(${bboxStr});out body 100;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!resp.ok) throw new Error(`Overpass HTTP ${resp.status}`);
    const data = await resp.json() as { elements: { type: string; id: number; lat: number; lon: number; tags?: Record<string, string> }[] };

    const geojson = {
      type: "FeatureCollection",
      features: data.elements.map((el) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [el.lon, el.lat] },
        properties: {
          id: el.id,
          name: el.tags?.name ?? el.tags?.["name:en"] ?? "Unnamed",
          category,
        },
      })),
    };

    cache.set(cacheKey, { ts: Date.now(), geojson });
    return res.json(geojson);
  } catch (err) {
    return res.status(502).json({ error: "POI fetch failed", detail: String(err) });
  }
});

export default router;
