import { useEffect, useRef, useMemo } from "react";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderZoneLayer, ZONE_CATEGORIES } from "./ZoneOverlay";

export interface LabelData {
  id: string;
  lat: number;
  lng: number;
  text: string;
  safety: number;
  vibe: string[] | null;
  cost: string;
  upvotes: number;
  downvotes: number;
  color?: string | null;
  category?: string | null;
}

export interface Filters {
  safetyMin: number;
  safetyMax: number;
  costs: string[];
  vibes: string[];
  minScore: number;
}

interface MapViewProps {
  labels: LabelData[];
  isPlacingPin: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onVote: (labelId: string, voteType: "upvote" | "downvote") => void;
  showHeatmap: boolean;
  filters: Filters;
  onAreaClick?: (area: AreaSummary) => void;
  onLabelClick?: (label: LabelData, nearbyLabels: LabelData[], areaName: string) => void;
  showLabels?: boolean;
  selectedCategories?: string[];
  locateUser?: boolean;
  onLocated?: () => void;
  flyToLocation?: { lat: number; lng: number } | null;
  onFlownTo?: () => void;
}

export interface AreaSummary {
  lat: number;
  lng: number;
  name: string;
  labelCount: number;
  avgSafety: number;
  avgCost: string;
  topVibes: string[];
  sentimentPercent: number;
  topLabels: LabelData[];
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

function getScore(label: LabelData) {
  return label.upvotes - label.downvotes;
}

function getLabelColor(score: number) {
  if (score >= 5) return "#15803d";
  if (score >= 2) return "#22c55e";
  if (score <= -5) return "#dc2626";
  if (score <= -2) return "#ef4444";
  return "#6b7280";
}

function getLabelSize(score: number) {
  const abs = Math.abs(score);
  if (abs >= 10) return 16;
  if (abs >= 5) return 14;
  if (abs >= 2) return 13;
  return 12;
}

function getLabelOpacity(score: number) {
  const abs = Math.abs(score);
  if (abs >= 5) return 1;
  if (abs >= 2) return 0.85;
  return 0.65;
}

function createTextIcon(label: LabelData) {
  const score = getScore(label);
  const color = label.color || getLabelColor(score);
  const size = getLabelSize(score);
  const opacity = getLabelOpacity(score);

  const html = `<div style="
    color: ${color};
    font-size: ${Math.max(size, 14)}px;
    font-weight: 900;
    font-family: 'Arial Black', 'Impact', system-ui, sans-serif;
    text-shadow: 
      -2px -2px 0 #fff,
       2px -2px 0 #fff,
      -2px  2px 0 #fff,
       2px  2px 0 #fff,
       0   -2px 0 #fff,
       0    2px 0 #fff,
      -2px  0   0 #fff,
       2px  0   0 #fff,
       0    3px 6px rgba(0,0,0,0.15);
    white-space: nowrap;
    opacity: ${opacity};
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    letter-spacing: 0.02em;
  ">${escapeHtml(label.text)}</div>`;

  return L.divIcon({
    html,
    className: "hoodmap-label",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function buildPopupContent(label: LabelData, onVote: MapViewProps["onVote"]) {
  const wrapper = document.createElement("div");
  wrapper.style.fontFamily = "system-ui, sans-serif";
  wrapper.style.minWidth = "200px";

  const score = getScore(label);
  const vibes = (label.vibe ?? [])
    .map((v) => `<span style="display:inline-block;background:#f3f4f6;border-radius:4px;padding:2px 7px;font-size:11px;margin:0 3px 3px 0;color:#374151;">${escapeHtml(v)}</span>`)
    .join("");

  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < label.safety ? '#facc15' : '#e5e7eb'};font-size:14px;">★</span>`
  ).join("");

  const scoreBadgeColor = score > 0 ? "#dcfce7" : score < 0 ? "#fee2e2" : "#f3f4f6";
  const scoreBadgeText = score > 0 ? "#166534" : score < 0 ? "#991b1b" : "#374151";

  wrapper.innerHTML = `
    <div style="margin-bottom:8px;">
      <p style="font-size:14px;font-weight:700;margin:0 0 4px;line-height:1.3;">${escapeHtml(label.text)}</p>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span>${stars}</span>
        <span style="font-size:12px;color:#6b7280;">·</span>
        <span style="font-size:13px;font-weight:600;color:#374151;">${escapeHtml(label.cost)}</span>
      </div>
      ${vibes ? `<div style="margin-top:4px;">${vibes}</div>` : ""}
    </div>
    <div style="display:flex;align-items:center;gap:8px;border-top:1px solid #e5e7eb;padding-top:8px;">
      <button data-vote="upvote" style="cursor:pointer;background:#f9fafb;border:1px solid #d1d5db;border-radius:8px;padding:5px 12px;font-size:13px;display:flex;align-items:center;gap:4px;">👍 <strong>${label.upvotes}</strong></button>
      <button data-vote="downvote" style="cursor:pointer;background:#f9fafb;border:1px solid #d1d5db;border-radius:8px;padding:5px 12px;font-size:13px;display:flex;align-items:center;gap:4px;">👎 <strong>${label.downvotes}</strong></button>
      <span style="margin-left:auto;background:${scoreBadgeColor};color:${scoreBadgeText};border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;">${score > 0 ? '+' : ''}${score}</span>
    </div>
  `;

  wrapper.querySelector('button[data-vote="upvote"]')?.addEventListener("click", () => onVote(label.id, "upvote"));
  wrapper.querySelector('button[data-vote="downvote"]')?.addEventListener("click", () => onVote(label.id, "downvote"));

  return wrapper;
}

// Approximate area name based on coordinates
function getAreaName(lat: number, lng: number): string {
  const areas: Array<{ name: string; lat: number; lng: number; r: number }> = [
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

  let closest = { name: "This Area", dist: Infinity };
  for (const a of areas) {
    const dist = Math.sqrt((lat - a.lat) ** 2 + (lng - a.lng) ** 2);
    if (dist < a.r && dist < closest.dist) {
      closest = { name: a.name, dist };
    }
  }
  return closest.name;
}

// Find labels within a radius (in degrees, ~0.01 ≈ 1km)
function getNearbyLabels(labels: LabelData[], lat: number, lng: number, radius = 0.015): LabelData[] {
  return labels.filter((l) => {
    const dist = Math.sqrt((l.lat - lat) ** 2 + (l.lng - lng) ** 2);
    return dist <= radius;
  });
}

function computeAreaSummary(labels: LabelData[], lat: number, lng: number): AreaSummary | null {
  const nearby = getNearbyLabels(labels, lat, lng);
  if (nearby.length < 2) return null;

  const avgSafety = nearby.reduce((s, l) => s + l.safety, 0) / nearby.length;

  // Average cost
  const costMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
  const costLabels = ["$", "$$", "$$$", "$$$$"];
  const avgCostNum = nearby.reduce((s, l) => s + (costMap[l.cost] || 2), 0) / nearby.length;
  const avgCost = costLabels[Math.round(avgCostNum) - 1] || "$$";

  // Top vibes
  const vibeCounts: Record<string, number> = {};
  nearby.forEach((l) => (l.vibe ?? []).forEach((v) => { vibeCounts[v] = (vibeCounts[v] || 0) + 1; }));
  const topVibes = Object.entries(vibeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([v]) => v);

  // Sentiment
  const positiveCount = nearby.filter((l) => getScore(l) > 0).length;
  const sentimentPercent = Math.round((positiveCount / nearby.length) * 100);

  // Top labels by score
  const topLabels = [...nearby].sort((a, b) => getScore(b) - getScore(a)).slice(0, 5);

  return {
    lat,
    lng,
    name: getAreaName(lat, lng),
    labelCount: nearby.length,
    avgSafety: Math.round(avgSafety * 10) / 10,
    avgCost,
    topVibes,
    sentimentPercent,
    topLabels,
  };
}

function buildAreaPopupContent(summary: AreaSummary, onExplore?: (area: AreaSummary) => void): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.fontFamily = "system-ui, sans-serif";
  wrapper.style.minWidth = "240px";
  wrapper.style.maxWidth = "300px";

  const sentimentEmoji = summary.sentimentPercent >= 70 ? "🔥" : summary.sentimentPercent >= 40 ? "😐" : "⚠️";
  const sentimentColor = summary.sentimentPercent >= 70 ? "#15803d" : summary.sentimentPercent >= 40 ? "#ca8a04" : "#dc2626";
  const sentimentBg = summary.sentimentPercent >= 70 ? "#dcfce7" : summary.sentimentPercent >= 40 ? "#fef9c3" : "#fee2e2";

  const safetyStars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < Math.round(summary.avgSafety) ? '#facc15' : '#e5e7eb'};font-size:13px;">★</span>`
  ).join("");

  const vibeHtml = summary.topVibes
    .map((v) => `<span style="display:inline-block;background:#f3f4f6;border-radius:4px;padding:2px 8px;font-size:11px;color:#374151;font-weight:500;">${escapeHtml(v)}</span>`)
    .join(" ");

  const topLabelHtml = summary.topLabels.slice(0, 3)
    .map((l) => {
      const score = getScore(l);
      const color = score > 0 ? "#15803d" : score < 0 ? "#dc2626" : "#6b7280";
      return `<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:3px;">
        <span style="color:${color};font-size:10px;font-weight:700;min-width:24px;">${score > 0 ? '+' : ''}${score}</span>
        <span style="font-size:11px;color:#374151;line-height:1.3;">${escapeHtml(l.text.length > 45 ? l.text.slice(0, 43) + '…' : l.text)}</span>
      </div>`;
    }).join("");

  wrapper.innerHTML = `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <h3 style="font-size:16px;font-weight:800;margin:0;color:#111827;">${escapeHtml(summary.name)}</h3>
        <span style="font-size:11px;color:#9ca3af;">${summary.labelCount} labels</span>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <div style="flex:1;background:#f9fafb;border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Safety</div>
          <div>${safetyStars}</div>
          <div style="font-size:11px;font-weight:600;color:#374151;">${summary.avgSafety}/5</div>
        </div>
        <div style="flex:1;background:#f9fafb;border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Cost</div>
          <div style="font-size:18px;font-weight:700;color:#374151;">${escapeHtml(summary.avgCost)}</div>
        </div>
        <div style="flex:1;background:${sentimentBg};border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Vibe</div>
          <div style="font-size:16px;">${sentimentEmoji}</div>
          <div style="font-size:11px;font-weight:700;color:${sentimentColor};">${summary.sentimentPercent}%</div>
        </div>
      </div>

      ${vibeHtml ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">${vibeHtml}</div>` : ""}

      <div style="border-top:1px solid #e5e7eb;padding-top:8px;">
        <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Top Insights</div>
        ${topLabelHtml}
      </div>

      <button data-action="explore" style="
        margin-top:10px;
        width:100%;
        padding:8px 0;
        background:linear-gradient(135deg, #0d9488, #14b8a6);
        color:white;
        border:none;
        border-radius:8px;
        font-size:13px;
        font-weight:600;
        cursor:pointer;
        letter-spacing:0.02em;
      ">Explore details →</button>
    </div>
  `;

  wrapper.querySelector('button[data-action="explore"]')?.addEventListener("click", () => {
    onExplore?.(summary);
  });

  return wrapper;
}

const DEFAULT_FILTERS: Filters = { safetyMin: 1, safetyMax: 5, costs: [], vibes: [], minScore: -99 };

function applyFilters(labels: LabelData[], filters: Filters = DEFAULT_FILTERS): LabelData[] {
  return labels.filter((l) => {
    const score = getScore(l);
    if (l.safety < filters.safetyMin || l.safety > filters.safetyMax) return false;
    if (filters.costs.length > 0 && !filters.costs.includes(l.cost)) return false;
    if (filters.vibes.length > 0 && !(l.vibe ?? []).some((v) => filters.vibes.includes(v))) return false;
    if (score < filters.minScore) return false;
    return true;
  });
}

export function MapView({ labels, isPlacingPin, onMapClick, onVote, showHeatmap = false, filters = DEFAULT_FILTERS, onAreaClick, showLabels = true, selectedCategories = [], locateUser = false, onLocated, flyToLocation, onFlownTo }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const labelsRef = useRef<LabelData[]>([]);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  // Keep labels ref in sync for use in click handler
  labelsRef.current = labels;

  const filteredLabels = useMemo(() => {
    if (!showLabels) return [];
    let filtered = applyFilters(labels, filters);
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((l) => l.category && selectedCategories.includes(l.category));
    }
    return [...filtered]
      .sort((a, b) => Math.abs(getScore(b)) - Math.abs(getScore(a)))
      .slice(0, 150);
  }, [labels, filters, showLabels, selectedCategories]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomAnimation: true,
      markerZoomAnimation: true,
    }).setView([40.7328, -73.970], 12);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      heatLayerRef.current = null;
    };
  }, []);

  // Click handler — placing pin OR area summary
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isPlacingPin) {
        onMapClick(e.latlng.lat, e.latlng.lng);
        return;
      }

      // Area summary on regular click
      const summary = computeAreaSummary(labelsRef.current, e.latlng.lat, e.latlng.lng);
      if (summary) {
        const popup = L.popup({
          maxWidth: 320,
          className: "area-summary-popup",
        })
          .setLatLng([e.latlng.lat, e.latlng.lng])
          .setContent(buildAreaPopupContent(summary, onAreaClick))
          .openOn(map);
      }
    };
    map.on("click", handleClick);
    return () => { map.off("click", handleClick); };
  }, [isPlacingPin, onMapClick, onAreaClick]);

  // Cursor
  useEffect(() => {
    const el = mapContainerRef.current;
    if (el) el.style.cursor = isPlacingPin ? "crosshair" : "";
  }, [isPlacingPin]);

  // Locate user
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !locateUser) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 15, { duration: 1.5 });

        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current);
        }
        userMarkerRef.current = L.circleMarker([latitude, longitude], {
          radius: 10,
          fillColor: "#3b82f6",
          fillOpacity: 0.9,
          color: "#fff",
          weight: 3,
        }).addTo(map);
        userMarkerRef.current.bindPopup("<strong>You are here</strong>");

        onLocated?.();
      },
      () => {
        onLocated?.();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [locateUser, onLocated]);

  // Fly to searched location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToLocation) return;
    map.flyTo([flyToLocation.lat, flyToLocation.lng], 13, { duration: 1.5 });
    onFlownTo?.();
  }, [flyToLocation, onFlownTo]);

  // Render labels
  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (!showHeatmap) {
      filteredLabels.forEach((label) => {
        const marker = L.marker([label.lat, label.lng], {
          icon: createTextIcon(label),
          interactive: true,
        }).addTo(layer);
        marker.bindPopup(buildPopupContent(label, onVote), {
          maxWidth: 280,
          className: "hoodmap-popup",
        });
      });
    }
  }, [filteredLabels, onVote, showHeatmap]);

  // Render zone overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!showHeatmap) return;

    const zoneLayer = renderZoneLayer(map, labels);
    heatLayerRef.current = zoneLayer;
  }, [labels, showHeatmap]);

  const legendItems = Object.values(ZONE_CATEGORIES);

  return (
    <>
      <style>{`
        .hoodmap-label { background: none !important; border: none !important; }
        .zone-label-icon { background: none !important; border: none !important; }
        .hoodmap-popup .leaflet-popup-content-wrapper,
        .area-summary-popup .leaflet-popup-content-wrapper {
          border-radius: 14px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.18);
          padding: 6px;
        }
        .hoodmap-popup .leaflet-popup-tip,
        .area-summary-popup .leaflet-popup-tip {
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .hoodmap-popup button:hover,
        .area-summary-popup button:hover {
          background: #e5e7eb !important;
        }
        .area-summary-popup button[data-action="explore"]:hover {
          background: linear-gradient(135deg, #0f766e, #0d9488) !important;
        }
        .area-summary-popup .leaflet-popup-content {
          margin: 10px 12px;
        }
      `}</style>
      <div className="relative h-full w-full">
        <div ref={mapContainerRef} className="h-full w-full z-0" />
        {showHeatmap && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-0 rounded-full overflow-hidden shadow-lg border border-white/30"
               style={{ backdropFilter: "blur(8px)" }}>
            {legendItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 px-3 py-2 text-white font-bold text-xs"
                style={{ backgroundColor: item.color, minWidth: 80, justifyContent: "center" }}
              >
                <span>{item.emoji}</span>
                <span className="uppercase tracking-wide" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
