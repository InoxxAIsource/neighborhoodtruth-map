import L from "leaflet";
import type { LabelData } from "./MapView";

export interface ZoneCategory {
  name: string;
  color: string;
  emoji: string;
}

export const ZONE_CATEGORIES: Record<string, ZoneCategory> = {
  suits: { name: "Suits", color: "#64b5f6", emoji: "💼" },
  rich: { name: "Rich", color: "#4caf50", emoji: "💰" },
  cool: { name: "Cool", color: "#ffeb3b", emoji: "😎" },
  tourists: { name: "Tourists", color: "#ef5350", emoji: "📸" },
  uni: { name: "Uni", color: "#1565c0", emoji: "🎓" },
  normies: { name: "Normies", color: "#9e9e9e", emoji: "🏠" },
  edgy: { name: "Edgy", color: "#424242", emoji: "🔥" },
};

const AREAS = [
  { name: "Upper East Side", lat: 40.774, lng: -73.956, r: 0.015 },
  { name: "Upper West Side", lat: 40.787, lng: -73.975, r: 0.015 },
  { name: "Midtown", lat: 40.755, lng: -73.984, r: 0.015 },
  { name: "Chelsea", lat: 40.746, lng: -74.001, r: 0.010 },
  { name: "Greenwich Village", lat: 40.733, lng: -73.998, r: 0.010 },
  { name: "East Village", lat: 40.727, lng: -73.984, r: 0.010 },
  { name: "SoHo", lat: 40.723, lng: -74.000, r: 0.008 },
  { name: "Lower East Side", lat: 40.715, lng: -73.985, r: 0.010 },
  { name: "Financial District", lat: 40.707, lng: -74.009, r: 0.010 },
  { name: "Harlem", lat: 40.811, lng: -73.950, r: 0.015 },
  { name: "Washington Heights", lat: 40.843, lng: -73.939, r: 0.015 },
  { name: "Williamsburg", lat: 40.714, lng: -73.953, r: 0.012 },
  { name: "DUMBO", lat: 40.703, lng: -73.988, r: 0.008 },
  { name: "Park Slope", lat: 40.672, lng: -73.977, r: 0.012 },
  { name: "Bushwick", lat: 40.694, lng: -73.921, r: 0.012 },
  { name: "Crown Heights", lat: 40.671, lng: -73.944, r: 0.012 },
  { name: "Bed-Stuy", lat: 40.687, lng: -73.941, r: 0.012 },
  { name: "Astoria", lat: 40.772, lng: -73.930, r: 0.012 },
  { name: "Long Island City", lat: 40.744, lng: -73.948, r: 0.010 },
  { name: "Jackson Heights", lat: 40.749, lng: -73.883, r: 0.012 },
  { name: "Flushing", lat: 40.763, lng: -73.830, r: 0.015 },
  { name: "South Bronx", lat: 40.817, lng: -73.918, r: 0.015 },
  { name: "Fordham", lat: 40.862, lng: -73.891, r: 0.012 },
  { name: "Bay Ridge", lat: 40.634, lng: -74.024, r: 0.012 },
  { name: "Prospect Heights", lat: 40.677, lng: -73.966, r: 0.008 },
  { name: "Greenpoint", lat: 40.727, lng: -73.951, r: 0.010 },
  { name: "Hell's Kitchen", lat: 40.764, lng: -73.993, r: 0.010 },
  { name: "Tribeca", lat: 40.717, lng: -74.008, r: 0.008 },
  { name: "NoHo", lat: 40.728, lng: -73.993, r: 0.006 },
  { name: "Chinatown", lat: 40.716, lng: -73.997, r: 0.006 },
];

function classifyArea(labels: LabelData[]): string {
  if (labels.length === 0) return "normies";

  const costMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
  const avgCost = labels.reduce((s, l) => s + (costMap[l.cost] || 2), 0) / labels.length;
  const avgSafety = labels.reduce((s, l) => s + l.safety, 0) / labels.length;

  const allVibes: string[] = [];
  labels.forEach((l) => (l.vibe ?? []).forEach((v) => allVibes.push(v.toLowerCase())));

  const hasVibe = (keywords: string[]) =>
    allVibes.some((v) => keywords.some((k) => v.includes(k)));

  // Classification rules
  if (avgCost >= 3.5 && avgSafety >= 4) return "rich";
  if (avgCost >= 3 && avgSafety >= 3.5) return "suits";
  if (hasVibe(["artsy", "nightlife", "trendy", "hipster", "creative"])) return "cool";
  if (avgSafety <= 2.5 && hasVibe(["loud", "nightlife", "gritty"])) return "edgy";
  if (hasVibe(["chill", "quiet", "student", "cheap"]) && avgCost <= 1.5) return "uni";
  if (hasVibe(["tourist", "landmark", "busy", "scenic"])) return "tourists";
  return "normies";
}

export function computeZones(labels: LabelData[]): Array<{
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  category: string;
  zone: ZoneCategory;
}> {
  return AREAS.map((area) => {
    const nearby = labels.filter((l) => {
      const dist = Math.sqrt((l.lat - area.lat) ** 2 + (l.lng - area.lng) ** 2);
      return dist <= area.r;
    });

    const categoryKey = classifyArea(nearby);
    const zone = ZONE_CATEGORIES[categoryKey];

    // Convert degree radius to approximate meters (1 degree lat ≈ 111km)
    const radiusMeters = area.r * 111000;

    return {
      name: area.name,
      lat: area.lat,
      lng: area.lng,
      radiusMeters,
      category: categoryKey,
      zone,
    };
  });
}

export function renderZoneLayer(map: L.Map, labels: LabelData[]): L.LayerGroup {
  const zones = computeZones(labels);
  const layerGroup = L.layerGroup();

  zones.forEach((z) => {
    const circle = L.circle([z.lat, z.lng], {
      radius: z.radiusMeters,
      color: z.zone.color,
      fillColor: z.zone.color,
      fillOpacity: 0.22,
      weight: 1,
      opacity: 0.4,
      interactive: false,
    });

    // Add zone label
    const labelIcon = L.divIcon({
      html: `<div style="
        font-size: 11px;
        font-weight: 800;
        color: ${z.zone.color};
        text-shadow: 0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.7);
        white-space: nowrap;
        text-transform: uppercase;
        letter-spacing: 1px;
        pointer-events: none;
        opacity: 0.7;
      ">${z.zone.emoji} ${z.zone.name}</div>`,
      className: "zone-label-icon",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker([z.lat, z.lng], { icon: labelIcon, interactive: false });

    circle.addTo(layerGroup);
    marker.addTo(layerGroup);
  });

  layerGroup.addTo(map);
  return layerGroup;
}
