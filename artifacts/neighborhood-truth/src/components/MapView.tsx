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
  apiBase: string;
  voterId: string;
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

interface CommentItem {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initials(authorId: string): string {
  return authorId.slice(0, 2).toUpperCase();
}

function renderComments(list: CommentItem[]): string {
  if (list.length === 0) {
    return `<p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;padding:8px 0;">No comments yet. Be the first!</p>`;
  }
  return list.map((c) => `
    <div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-start;">
      <div style="flex-shrink:0;width:26px;height:26px;border-radius:50%;background:#e0e7ff;color:#4338ca;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">${escapeHtml(initials(c.authorId))}</div>
      <div style="flex:1;min-width:0;">
        <p style="font-size:12px;color:#1f2937;margin:0 0 2px;word-break:break-word;">${escapeHtml(c.body)}</p>
        <span style="font-size:10px;color:#9ca3af;">${escapeHtml(timeAgo(c.createdAt))}</span>
      </div>
    </div>
  `).join("");
}

async function loadAndRenderComments(commentsEl: HTMLElement, labelId: string, apiBase: string) {
  commentsEl.innerHTML = `<p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">Loading…</p>`;
  try {
    const res = await fetch(`${apiBase}/labels/${labelId}/comments`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: CommentItem[] = await res.json();
    commentsEl.innerHTML = renderComments(data);
  } catch {
    commentsEl.innerHTML = `<p style="font-size:12px;color:#ef4444;margin:0;">Failed to load comments.</p>`;
  }
}

function buildPopupContent(
  label: LabelData,
  onVote: MapViewProps["onVote"],
  apiBase: string,
  voterId: string,
): { el: HTMLElement; onOpen: () => void } {
  const wrapper = document.createElement("div");
  wrapper.style.fontFamily = "system-ui, sans-serif";
  wrapper.style.minWidth = "220px";
  wrapper.style.maxWidth = "280px";

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
    <div style="margin-top:10px;border-top:1px solid #e5e7eb;padding-top:10px;">
      <p style="font-size:11px;font-weight:700;color:#374151;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Comments</p>
      <div data-comments-list style="margin-bottom:8px;"></div>
      <div style="display:flex;gap:6px;align-items:flex-end;">
        <textarea data-comment-input rows="2" maxlength="200" placeholder="Add a comment…" style="flex:1;font-size:12px;border:1px solid #d1d5db;border-radius:6px;padding:5px 8px;resize:none;font-family:inherit;outline:none;color:#1f2937;"></textarea>
        <button data-action="post-comment" style="cursor:pointer;background:#6366f1;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:600;white-space:nowrap;height:52px;">Post</button>
      </div>
      <p data-comment-error style="font-size:11px;color:#ef4444;margin:4px 0 0;display:none;"></p>
    </div>
  `;

  wrapper.querySelector('button[data-vote="upvote"]')?.addEventListener("click", () => onVote(label.id, "upvote"));
  wrapper.querySelector('button[data-vote="downvote"]')?.addEventListener("click", () => onVote(label.id, "downvote"));
  wrapper.querySelector('button[data-action="ask-ai"]')?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("hoodmap:askai", { detail: label }));
  });

  const commentsEl = wrapper.querySelector("[data-comments-list]") as HTMLElement;
  const textareaEl = wrapper.querySelector("[data-comment-input]") as HTMLTextAreaElement;
  const errorEl = wrapper.querySelector("[data-comment-error]") as HTMLElement;
  const postBtn = wrapper.querySelector('button[data-action="post-comment"]') as HTMLButtonElement;

  postBtn.addEventListener("click", async () => {
    const body = textareaEl.value.trim();
    if (!body) return;
    errorEl.style.display = "none";
    postBtn.disabled = true;
    postBtn.textContent = "…";
    try {
      const res = await fetch(`${apiBase}/labels/${label.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId: voterId, body }),
      });
      if (!res.ok) throw new Error("Failed");
      textareaEl.value = "";
      await loadAndRenderComments(commentsEl, label.id, apiBase);
    } catch {
      errorEl.textContent = "Failed to post. Try again.";
      errorEl.style.display = "block";
    } finally {
      postBtn.disabled = false;
      postBtn.textContent = "Post";
    }
  });

  const onOpen = () => loadAndRenderComments(commentsEl, label.id, apiBase);
  return { el: wrapper, onOpen };
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
  apiBase,
  voterId,
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
      center: [20, 0],
      zoom: 2,
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

    const onLocationError = () => {
      onLocated?.();
    };

    map.on("locationfound", onLocate);
    map.on("locationerror", onLocationError);

    return () => {
      map.off("locationfound", onLocate);
      map.off("locationerror", onLocationError);
    };
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
      const { el: popupEl, onOpen } = buildPopupContent(label, onVote, apiBase, voterId);
      marker.bindPopup(popupEl, { maxWidth: 320, className: "hoodmap-popup" });
      marker.on("popupopen", onOpen);
      if (onLabelClick) {
        marker.on("click", () => onLabelClick(label));
      }
      marker.addTo(markerLayer);
    });
  }, [filteredLabels, showLabels, selectedCategories, onVote, onLabelClick, apiBase, voterId]);

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
        const { el: popupEl, onOpen } = buildPopupContent(label, onVote, apiBase, voterId);
        marker.bindPopup(popupEl, { maxWidth: 320, className: "hoodmap-popup" });
        marker.on("popupopen", onOpen);
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
