import { useEffect, useRef, useMemo } from "react";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// Extend Leaflet types for heat layer
declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: Record<string, unknown>
  ): L.Layer;
}

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
  const color = getLabelColor(score);
  const size = getLabelSize(score);
  const opacity = getLabelOpacity(score);
  const weight = Math.abs(score) >= 5 ? 800 : Math.abs(score) >= 2 ? 700 : 600;

  const html = `<div style="
    color: ${color};
    font-size: ${size}px;
    font-weight: ${weight};
    font-family: system-ui, -apple-system, sans-serif;
    text-shadow: 
      -1px -1px 0 rgba(255,255,255,0.9),
       1px -1px 0 rgba(255,255,255,0.9),
      -1px  1px 0 rgba(255,255,255,0.9),
       1px  1px 0 rgba(255,255,255,0.9),
       0    2px 4px rgba(0,0,0,0.1);
    white-space: nowrap;
    opacity: ${opacity};
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    letter-spacing: -0.01em;
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

function applyFilters(labels: LabelData[], filters: Filters): LabelData[] {
  return labels.filter((l) => {
    const score = getScore(l);
    if (l.safety < filters.safetyMin || l.safety > filters.safetyMax) return false;
    if (filters.costs.length > 0 && !filters.costs.includes(l.cost)) return false;
    if (filters.vibes.length > 0 && !(l.vibe ?? []).some((v) => filters.vibes.includes(v))) return false;
    if (score < filters.minScore) return false;
    return true;
  });
}

export function MapView({ labels, isPlacingPin, onMapClick, onVote, showHeatmap, filters }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);

  const filteredLabels = useMemo(() => {
    const filtered = applyFilters(labels, filters);
    return [...filtered]
      .sort((a, b) => Math.abs(getScore(b)) - Math.abs(getScore(a)))
      .slice(0, 150);
  }, [labels, filters]);

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

  // Click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isPlacingPin) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handleClick);
    return () => { map.off("click", handleClick); };
  }, [isPlacingPin, onMapClick]);

  // Cursor
  useEffect(() => {
    const el = mapContainerRef.current;
    if (el) el.style.cursor = isPlacingPin ? "crosshair" : "";
  }, [isPlacingPin]);

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

  // Render heatmap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!showHeatmap) return;

    // Build heat data: [lat, lng, intensity]
    // Positive labels add positive intensity, negative add negative
    // We split into two layers: positive (green) and negative (red)
    const heatPoints: Array<[number, number, number]> = filteredLabels.map((l) => {
      const score = getScore(l);
      // Normalize to 0-1 range, with 0.5 as neutral
      const intensity = Math.max(0.1, Math.min(1, (score + 20) / 40));
      return [l.lat, l.lng, intensity];
    });

    const heat = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 25,
      maxZoom: 15,
      max: 1,
      gradient: {
        0.0: "#dc2626",  // red (negative)
        0.3: "#ef4444",
        0.45: "#fbbf24", // yellow (neutral)
        0.55: "#facc15",
        0.7: "#22c55e",  // green (positive)
        1.0: "#15803d",
      },
    });

    heat.addTo(map);
    heatLayerRef.current = heat;
  }, [filteredLabels, showHeatmap]);

  return (
    <>
      <style>{`
        .hoodmap-label { background: none !important; border: none !important; }
        .hoodmap-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 4px;
        }
        .hoodmap-popup .leaflet-popup-tip { box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        .hoodmap-popup button:hover { background: #e5e7eb !important; }
      `}</style>
      <div ref={mapContainerRef} className="h-full w-full z-0" />
    </>
  );
}
