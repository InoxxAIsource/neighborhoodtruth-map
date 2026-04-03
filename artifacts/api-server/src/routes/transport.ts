import { Router, type IRouter } from "express";
import { computeTransportEstimate } from "../lib/costIntelligence";

const router: IRouter = Router();

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const OSRM_TIMEOUT_MS = 5000;

interface OsrmRoute {
  distance: number;
  duration: number;
}

interface OsrmResponse {
  code: string;
  routes?: OsrmRoute[];
}

async function fetchOsrmRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<{ distanceM: number; durationSec: number } | null> {
  const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json() as OsrmResponse;
    if (data.code !== "Ok" || !data.routes?.length) return null;
    return {
      distanceM: data.routes[0].distance,
      durationSec: data.routes[0].duration,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * GET /api/transport/estimate
 * Returns estimated travel cost between two lat/lng points.
 * Uses OSRM open-source routing for routed road distance and travel time.
 * City-specific cost rates are applied to the OSRM routed distance.
 */
router.get("/estimate", async (req, res) => {
  const { from_lat, from_lng, to_lat, to_lng } = req.query;

  const fromLat = parseFloat(from_lat as string);
  const fromLng = parseFloat(from_lng as string);
  const toLat = parseFloat(to_lat as string);
  const toLng = parseFloat(to_lng as string);

  if ([fromLat, fromLng, toLat, toLng].some(isNaN)) {
    res.status(400).json({ error: "from_lat, from_lng, to_lat, to_lng are required numbers" });
    return;
  }

  const osrm = await fetchOsrmRoute(fromLat, fromLng, toLat, toLng);

  let distanceKm: number;
  let routeDurationSec: number | null;

  if (osrm) {
    distanceKm = osrm.distanceM / 1000;
    routeDurationSec = osrm.durationSec;
  } else {
    // Haversine fallback if OSRM is unavailable
    const R = 6371;
    const dLat = ((toLat - fromLat) * Math.PI) / 180;
    const dLng = ((toLng - fromLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((fromLat * Math.PI) / 180) *
        Math.cos((toLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    routeDurationSec = null;
  }

  const result = computeTransportEstimate(fromLat, fromLng, distanceKm, routeDurationSec);

  if (!result) {
    res.status(404).json({ error: "No city data found for these coordinates" });
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(result);
});

export default router;
