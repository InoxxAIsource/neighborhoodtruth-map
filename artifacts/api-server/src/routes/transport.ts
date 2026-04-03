import { Router, type IRouter } from "express";
import { computeTransportEstimate } from "../lib/costIntelligence";

const router: IRouter = Router();

/**
 * GET /api/transport/estimate
 * Returns estimated travel cost between two lat/lng points
 * Uses Haversine distance calculation - no external API needed for cost
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

  // Haversine distance formula
  const R = 6371; // Earth radius km
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const result = computeTransportEstimate(fromLat, fromLng, distanceKm);

  if (!result) {
    res.status(404).json({ error: "No city data found for these coordinates" });
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(result);
});

export default router;
