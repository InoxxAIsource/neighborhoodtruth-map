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
  // New York City
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
  { name: "Hell's Kitchen", lat: 40.764, lng: -73.993, r: 0.010 },
  { name: "Tribeca", lat: 40.717, lng: -74.008, r: 0.008 },
  { name: "Chinatown", lat: 40.716, lng: -73.997, r: 0.006 },
  { name: "Greenpoint", lat: 40.727, lng: -73.951, r: 0.010 },

  // Delhi
  { name: "Connaught Place", lat: 28.6315, lng: 77.2167, r: 0.015 },
  { name: "Hauz Khas", lat: 28.5494, lng: 77.2001, r: 0.013 },
  { name: "Lajpat Nagar", lat: 28.5680, lng: 77.2410, r: 0.012 },
  { name: "Karol Bagh", lat: 28.6519, lng: 77.1909, r: 0.013 },
  { name: "Chandni Chowk", lat: 28.6507, lng: 77.2311, r: 0.012 },
  { name: "Saket", lat: 28.5216, lng: 77.2099, r: 0.013 },
  { name: "Defence Colony", lat: 28.5697, lng: 77.2280, r: 0.010 },
  { name: "Greater Kailash", lat: 28.5447, lng: 77.2440, r: 0.013 },
  { name: "South Extension", lat: 28.5691, lng: 77.2196, r: 0.010 },
  { name: "Vasant Kunj", lat: 28.5225, lng: 77.1585, r: 0.015 },
  { name: "Dwarka", lat: 28.5921, lng: 77.0460, r: 0.020 },
  { name: "Rohini", lat: 28.7279, lng: 77.1173, r: 0.018 },
  { name: "Pitampura", lat: 28.6952, lng: 77.1309, r: 0.013 },
  { name: "Paharganj", lat: 28.6441, lng: 77.2128, r: 0.010 },
  { name: "Nizamuddin", lat: 28.5896, lng: 77.2502, r: 0.010 },
  { name: "Mehrauli", lat: 28.5244, lng: 77.1855, r: 0.012 },
  { name: "Laxmi Nagar", lat: 28.6307, lng: 77.2845, r: 0.012 },
  { name: "Preet Vihar", lat: 28.6450, lng: 77.2964, r: 0.010 },

  // Mumbai
  { name: "Bandra", lat: 19.0596, lng: 72.8295, r: 0.018 },
  { name: "Juhu", lat: 19.1002, lng: 72.8269, r: 0.015 },
  { name: "Colaba", lat: 18.9067, lng: 72.9162, r: 0.013 },
  { name: "Andheri", lat: 19.1136, lng: 72.8697, r: 0.018 },
  { name: "Powai", lat: 19.1197, lng: 72.9051, r: 0.015 },
  { name: "Lower Parel", lat: 18.9984, lng: 72.8310, r: 0.013 },
  { name: "Worli", lat: 19.0095, lng: 72.8183, r: 0.012 },
  { name: "Dadar", lat: 19.0178, lng: 72.8478, r: 0.012 },
  { name: "Kurla", lat: 19.0706, lng: 72.8798, r: 0.013 },
  { name: "Malad", lat: 19.1874, lng: 72.8481, r: 0.015 },
  { name: "Navi Mumbai", lat: 19.0330, lng: 73.0297, r: 0.020 },
  { name: "Marine Drive", lat: 18.9432, lng: 72.8232, r: 0.010 },

  // London
  { name: "Shoreditch", lat: 51.5248, lng: -0.0786, r: 0.013 },
  { name: "Soho", lat: 51.5137, lng: -0.1337, r: 0.010 },
  { name: "Notting Hill", lat: 51.5134, lng: -0.2050, r: 0.012 },
  { name: "Canary Wharf", lat: 51.5054, lng: -0.0235, r: 0.013 },
  { name: "Camden Town", lat: 51.5390, lng: -0.1426, r: 0.012 },
  { name: "Brixton", lat: 51.4611, lng: -0.1145, r: 0.013 },
  { name: "Hackney", lat: 51.5451, lng: -0.0553, r: 0.015 },
  { name: "Greenwich", lat: 51.4833, lng: -0.0090, r: 0.013 },
  { name: "Kensington", lat: 51.5010, lng: -0.1919, r: 0.013 },
  { name: "Mayfair", lat: 51.5116, lng: -0.1487, r: 0.010 },

  // Tokyo
  { name: "Shibuya", lat: 35.6598, lng: 139.7005, r: 0.015 },
  { name: "Shinjuku", lat: 35.6938, lng: 139.7035, r: 0.015 },
  { name: "Akihabara", lat: 35.7022, lng: 139.7741, r: 0.010 },
  { name: "Harajuku", lat: 35.6715, lng: 139.7027, r: 0.010 },
  { name: "Roppongi", lat: 35.6627, lng: 139.7315, r: 0.012 },
  { name: "Ginza", lat: 35.6717, lng: 139.7670, r: 0.012 },
  { name: "Asakusa", lat: 35.7148, lng: 139.7967, r: 0.013 },
  { name: "Odaiba", lat: 35.6268, lng: 139.7756, r: 0.015 },

  // Paris
  { name: "Le Marais", lat: 48.8566, lng: 2.3575, r: 0.013 },
  { name: "Montmartre", lat: 48.8867, lng: 2.3431, r: 0.013 },
  { name: "Saint-Germain", lat: 48.8533, lng: 2.3361, r: 0.013 },
  { name: "Pigalle", lat: 48.8827, lng: 2.3366, r: 0.010 },
  { name: "Oberkampf", lat: 48.8638, lng: 2.3751, r: 0.010 },
  { name: "Bastille", lat: 48.8530, lng: 2.3691, r: 0.012 },
  { name: "Belleville", lat: 48.8705, lng: 2.3790, r: 0.012 },
  { name: "Champs-Elysées", lat: 48.8698, lng: 2.3078, r: 0.013 },

  // Dubai
  { name: "Dubai Marina", lat: 25.0805, lng: 55.1403, r: 0.015 },
  { name: "Downtown Dubai", lat: 25.1972, lng: 55.2744, r: 0.015 },
  { name: "Jumeirah", lat: 25.2048, lng: 55.2392, r: 0.018 },
  { name: "Deira", lat: 25.2770, lng: 55.3273, r: 0.015 },
  { name: "Business Bay", lat: 25.1862, lng: 55.2750, r: 0.013 },
  { name: "Al Quoz", lat: 25.1449, lng: 55.2229, r: 0.015 },

  // Singapore
  { name: "Orchard Road", lat: 1.3050, lng: 103.8320, r: 0.013 },
  { name: "Chinatown", lat: 1.2834, lng: 103.8436, r: 0.010 },
  { name: "Clarke Quay", lat: 1.2896, lng: 103.8465, r: 0.010 },
  { name: "Little India", lat: 1.3066, lng: 103.8519, r: 0.010 },
  { name: "Sentosa", lat: 1.2494, lng: 103.8303, r: 0.015 },

  // Sydney
  { name: "Bondi Beach", lat: -33.8908, lng: 151.2743, r: 0.015 },
  { name: "Newtown", lat: -33.8979, lng: 151.1794, r: 0.013 },
  { name: "Surry Hills", lat: -33.8871, lng: 151.2097, r: 0.012 },
  { name: "Darlinghurst", lat: -33.8767, lng: 151.2186, r: 0.010 },
  { name: "Manly", lat: -33.7975, lng: 151.2847, r: 0.013 },

  // Berlin
  { name: "Mitte", lat: 52.5200, lng: 13.4050, r: 0.015 },
  { name: "Kreuzberg", lat: 52.4988, lng: 13.3960, r: 0.015 },
  { name: "Prenzlauer Berg", lat: 52.5390, lng: 13.4231, r: 0.015 },
  { name: "Friedrichshain", lat: 52.5150, lng: 13.4541, r: 0.015 },
  { name: "Neukölln", lat: 52.4800, lng: 13.4350, r: 0.015 },

  // Barcelona
  { name: "Gothic Quarter", lat: 41.3833, lng: 2.1766, r: 0.012 },
  { name: "Eixample", lat: 41.3922, lng: 2.1577, r: 0.015 },
  { name: "Gràcia", lat: 41.4028, lng: 2.1568, r: 0.013 },
  { name: "El Raval", lat: 41.3797, lng: 2.1693, r: 0.012 },
  { name: "Barceloneta", lat: 41.3800, lng: 2.1893, r: 0.010 },

  // Bangkok
  { name: "Sukhumvit", lat: 13.7308, lng: 100.5694, r: 0.018 },
  { name: "Silom", lat: 13.7222, lng: 100.5238, r: 0.013 },
  { name: "Chatuchak", lat: 13.7993, lng: 100.5500, r: 0.013 },
  { name: "Khao San Road", lat: 13.7590, lng: 100.4971, r: 0.010 },
  { name: "Chinatown Bangkok", lat: 13.7404, lng: 100.5093, r: 0.012 },
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

  if (avgCost >= 3.5 && avgSafety >= 4) return "rich";
  if (avgCost >= 3 && avgSafety >= 3.5) return "suits";
  if (hasVibe(["artsy", "nightlife", "trendy", "hipster", "creative", "artsy", "chill"])) return "cool";
  if (avgSafety <= 2.5 && hasVibe(["loud", "nightlife", "gritty"])) return "edgy";
  if (hasVibe(["student", "cheap", "chill", "quiet"]) && avgCost <= 1.5) return "uni";
  if (hasVibe(["tourist", "landmark", "busy", "scenic", "touristy"])) return "tourists";
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
