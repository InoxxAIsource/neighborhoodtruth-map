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
  onLabelClick?: (label: LabelData) => void;
  showHeatmap: boolean;
  filters: Filters;
  onAreaClick?: (area: AreaSummary) => void;
  showLabels?: boolean;
  selectedCategories?: string[];
  locateUser?: boolean;
  onLocated?: () => void;
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
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

function buildPopupContent(
  label: LabelData,
  onVote: MapViewProps["onVote"],
) {
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
    <div style="margin-top:8px;">
      <button data-action="ask-ai" style="cursor:pointer;width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;">✨ Ask AI about this area</button>
    </div>
  `;

  wrapper.querySelector('button[data-vote="upvote"]')?.addEventListener("click", () => onVote(label.id, "upvote"));
  wrapper.querySelector('button[data-vote="downvote"]')?.addEventListener("click", () => onVote(label.id, "downvote"));
  wrapper.querySelector('button[data-action="ask-ai"]')?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("hoodmap:askai", { detail: label }));
  });

  return wrapper;
}

function getNearbyLabels(labels: LabelData[], lat: number, lng: number, radius = 0.015): LabelData[] {
  return labels.filter((l) => {
    const dist = Math.sqrt((l.lat - lat) ** 2 + (l.lng - lng) ** 2);
    return dist <= radius;
  });
}

function computeAreaSummary(labels: LabelData[], lat: number, lng: number, name: string): AreaSummary | null {
  const nearby = getNearbyLabels(labels, lat, lng);
  if (nearby.length < 1) return null;

  const avgSafety = nearby.reduce((s, l) => s + l.safety, 0) / nearby.length;
  const costMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
  const costLabels = ["$", "$$", "$$$", "$$$$"];
  const avgCostNum = nearby.reduce((s, l) => s + (costMap[l.cost] || 2), 0) / nearby.length;
  const avgCost = costLabels[Math.round(avgCostNum) - 1] || "$$";

  const vibeCounts: Record<string, number> = {};
  nearby.forEach((l) => (l.vibe ?? []).forEach((v) => { vibeCounts[v] = (vibeCounts[v] || 0) + 1; }));
  const topVibes = Object.entries(vibeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([v]) => v);

  const positiveCount = nearby.filter((l) => getScore(l) > 0).length;
  const sentimentPercent = Math.round((positiveCount / nearby.length) * 100);
  const topLabels = [...nearby].sort((a, b) => getScore(b) - getScore(a)).slice(0, 5);

  return { lat, lng, name, labelCount: nearby.length, avgSafety: Math.round(avgSafety * 10) / 10, avgCost, topVibes, sentimentPercent, topLabels };
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

export function MapView({
  labels,
  isPlacingPin,
  onMapClick,
  onVote,
  onLabelClick,
  showHeatmap = false,
  filters = DEFAULT_FILTERS,
  onAreaClick,
  showLabels = true,
  selectedCategories = [],
  locateUser = false,
  onLocated,
  flyToLocation,
  onFlownTo,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const zoneLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [40.755, -73.984],
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Map click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isPlacingPin) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on("click", handleClick);
    map.getContainer().style.cursor = isPlacingPin ? "crosshair" : "";

    return () => { map.off("click", handleClick); };
  }, [isPlacingPin, onMapClick]);

  // Locate user
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !locateUser) return;

    map.locate({ setView: true, maxZoom: 15 });

    const onLocate = (e: L.LocationEvent) => {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }

      const pulsingIcon = L.divIcon({
        html: `<div class="user-location-dot">
          <div class="user-location-pulse"></div>
          <div class="user-location-core"></div>
        </div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([e.latlng.lat, e.latlng.lng], {
        icon: pulsingIcon,
        zIndexOffset: 2000,
        interactive: false,
      }).addTo(map);

      userLocationMarkerRef.current = marker;
      onLocated?.();
    };

    map.on("locationfound", onLocate);

    return () => { map.off("locationfound", onLocate); };
  }, [locateUser, onLocated]);

  // Fly to location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToLocation) return;
    map.flyTo([flyToLocation.lat, flyToLocation.lng], flyToLocation.zoom ?? 11, { duration: 1.5 });
    onFlownTo?.();
  }, [flyToLocation, onFlownTo]);

  // Update markers
  const filteredLabels = useMemo(() => applyFilters(labels, filters), [labels, filters]);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markersRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    if (!showLabels) return;

    const zoom = map.getZoom();
    const minZoom = 3;
    if (zoom < minZoom) return;

    const labelsToShow = selectedCategories.length > 0
      ? filteredLabels.filter((l) => l.category && selectedCategories.includes(l.category))
      : filteredLabels;

    labelsToShow.forEach((label) => {
      const icon = createTextIcon(label);
      const marker = L.marker([label.lat, label.lng], { icon });
      const popupEl = buildPopupContent(label, onVote);
      marker.bindPopup(popupEl, { maxWidth: 320, className: "hoodmap-popup" });
      if (onLabelClick) {
        marker.on("click", () => onLabelClick(label));
      }
      marker.addTo(markerLayer);
    });
  }, [filteredLabels, showLabels, selectedCategories, onVote, onLabelClick]);

  // Re-render markers on zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onZoom = () => {
      const markerLayer = markersRef.current;
      if (!markerLayer) return;
      markerLayer.clearLayers();

      const zoom = map.getZoom();
      const minZoom = 3;
      if (zoom < minZoom || !showLabels) return;

      const labelsToShow = selectedCategories.length > 0
        ? filteredLabels.filter((l) => l.category && selectedCategories.includes(l.category))
        : filteredLabels;

      labelsToShow.forEach((label) => {
        const icon = createTextIcon(label);
        const marker = L.marker([label.lat, label.lng], { icon });
        const popupEl = buildPopupContent(label, onVote);
        marker.bindPopup(popupEl, { maxWidth: 320, className: "hoodmap-popup" });
        if (onLabelClick) {
          marker.on("click", () => onLabelClick(label));
        }
        marker.addTo(markerLayer);
      });
    };

    map.on("zoomend", onZoom);
    return () => { map.off("zoomend", onZoom); };
  }, [filteredLabels, showLabels, selectedCategories, onVote, onLabelClick]);

  // Update zone layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (zoneLayerRef.current) {
      zoneLayerRef.current.remove();
      zoneLayerRef.current = null;
    }

    zoneLayerRef.current = renderZoneLayer(map, labels);
  }, [labels]);

  // Heatmap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (showHeatmap && filteredLabels.length > 0) {
      import("leaflet.heat").then(() => {
        const points = filteredLabels.map((l) => [l.lat, l.lng, 0.5] as [number, number, number]);
        // @ts-expect-error leaflet.heat types
        const heat = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 17 });
        heat.addTo(map);
        heatLayerRef.current = heat;
      });
    }
  }, [showHeatmap, filteredLabels]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
      className="z-0"
    />
  );
}
