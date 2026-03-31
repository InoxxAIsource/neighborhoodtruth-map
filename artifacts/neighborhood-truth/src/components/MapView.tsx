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
  topTags?: string[];
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
  myVotes?: { labelId: string; voteType: string }[];
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

const PREDEFINED_TAGS: { key: string; label: string; emoji: string }[] = [
  { key: "safe-at-night", label: "Safe at night", emoji: "🌙" },
  { key: "noisy-on-weekends", label: "Noisy weekends", emoji: "🔊" },
  { key: "family-friendly", label: "Family-friendly", emoji: "👨‍👩‍👧" },
  { key: "expensive", label: "Expensive", emoji: "💎" },
  { key: "good-nightlife", label: "Good nightlife", emoji: "🎉" },
  { key: "quiet", label: "Quiet", emoji: "🌿" },
  { key: "good-for-students", label: "Good for students", emoji: "🎓" },
  { key: "well-connected", label: "Well connected", emoji: "🚇" },
];

const TAG_LABEL_MAP: Record<string, string> = Object.fromEntries(
  PREDEFINED_TAGS.map((t) => [t.key, `${t.emoji} ${t.label}`])
);

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

function renderTopTagBadges(topTags: string[]): string {
  if (!topTags.length) return "";
  return `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
    ${topTags.map((key) => {
      const info = PREDEFINED_TAGS.find((t) => t.key === key);
      if (!info) return "";
      return `<span style="display:inline-flex;align-items:center;gap:3px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:2px 8px;font-size:11px;color:#166534;font-weight:600;">${escapeHtml(info.emoji)} ${escapeHtml(info.label)}</span>`;
    }).join("")}
  </div>`;
}

function buildPopupContent(
  label: LabelData,
  onVote: MapViewProps["onVote"],
  apiBase: string,
  voterId: string,
  myVotes?: { labelId: string; voteType: string }[],
): { el: HTMLElement; onOpen: () => void } {
  const wrapper = document.createElement("div");
  wrapper.style.fontFamily = "system-ui, sans-serif";
  wrapper.style.minWidth = "220px";
  wrapper.style.maxWidth = "300px";

  const score = getScore(label);
  const vibes = (label.vibe ?? [])
    .map((v) => `<span style="display:inline-block;background:#f3f4f6;border-radius:4px;padding:2px 7px;font-size:11px;margin:0 3px 3px 0;color:#374151;">${escapeHtml(v)}</span>`)
    .join("");

  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < label.safety ? '#facc15' : '#e5e7eb'};font-size:14px;">★</span>`
  ).join("");

  const scoreBadgeColor = score > 0 ? "#dcfce7" : score < 0 ? "#fee2e2" : "#f3f4f6";
  const scoreBadgeText = score > 0 ? "#166534" : score < 0 ? "#991b1b" : "#374151";

  const existingVote = myVotes?.find((v) => v.labelId === label.id);
  const alreadyVoted = !!existingVote;
  const upvotedStyle = existingVote?.voteType === "upvote" ? "background:#dcfce7;border-color:#86efac;" : "background:#f9fafb;border:1px solid #d1d5db;";
  const downvotedStyle = existingVote?.voteType === "downvote" ? "background:#fee2e2;border-color:#fca5a5;" : "background:#f9fafb;border:1px solid #d1d5db;";
  const accurateStyle = existingVote?.voteType === "accurate" ? "background:#e0f2fe;border-color:#7dd3fc;" : "background:#f9fafb;border:1px solid #d1d5db;";
  const voteCursor = alreadyVoted ? "default" : "pointer";
  const voteTitle = alreadyVoted ? "You already voted on this label" : "";

  let currentUpvotes = label.upvotes;
  let currentDownvotes = label.downvotes;

  const topTagsHtml = renderTopTagBadges(label.topTags ?? []);

  wrapper.innerHTML = `
    <div style="margin-bottom:8px;">
      <p style="font-size:14px;font-weight:700;margin:0 0 4px;line-height:1.3;">${escapeHtml(label.text)}</p>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span>${stars}</span>
        <span style="font-size:12px;color:#6b7280;">·</span>
        <span style="font-size:13px;font-weight:600;color:#374151;">${escapeHtml(label.cost)}</span>
      </div>
      ${vibes ? `<div style="margin-top:4px;">${vibes}</div>` : ""}
      ${topTagsHtml ? `<div style="margin-top:6px;" data-top-tags>${topTagsHtml}</div>` : `<div style="margin-top:6px;" data-top-tags></div>`}
    </div>
    <div style="display:flex;align-items:center;gap:6px;border-top:1px solid #e5e7eb;padding-top:8px;flex-wrap:wrap;">
      <button data-vote="upvote" title="${voteTitle}" style="cursor:${voteCursor};${upvotedStyle};border-radius:8px;padding:4px 10px;font-size:12px;display:flex;align-items:center;gap:3px;">👍 <strong data-count="upvotes">${label.upvotes}</strong></button>
      <button data-vote="downvote" title="${voteTitle}" style="cursor:${voteCursor};${downvotedStyle};border-radius:8px;padding:4px 10px;font-size:12px;display:flex;align-items:center;gap:3px;">👎 <strong data-count="downvotes">${label.downvotes}</strong></button>
      <button data-vote="accurate" title="${voteTitle}" style="cursor:${voteCursor};${accurateStyle};border-radius:8px;padding:4px 10px;font-size:12px;display:flex;align-items:center;gap:3px;">🔁 Still accurate</button>
      <span data-score-badge style="margin-left:auto;background:${scoreBadgeColor};color:${scoreBadgeText};border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;">${score > 0 ? '+' : ''}${score}</span>
    </div>
    <div style="margin-top:8px;">
      <button data-action="ask-ai" style="cursor:pointer;width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;">✨ Ask AI about this area</button>
    </div>
    <div style="margin-top:10px;border-top:1px solid #e5e7eb;padding-top:10px;">
      <p style="font-size:11px;font-weight:700;color:#374151;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Tag this area <span style="font-weight:400;color:#9ca3af;">(pick up to 4)</span></p>
      <div data-tag-picker style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px;"></div>
      <p data-tag-msg style="font-size:11px;color:#6b7280;margin:4px 0 0;display:none;"></p>
    </div>
  `;

  const upBtn = wrapper.querySelector('button[data-vote="upvote"]') as HTMLButtonElement;
  const downBtn = wrapper.querySelector('button[data-vote="downvote"]') as HTMLButtonElement;
  const accurateBtn = wrapper.querySelector('button[data-vote="accurate"]') as HTMLButtonElement;
  const scoreBadge = wrapper.querySelector('[data-score-badge]') as HTMLElement;
  const tagPicker = wrapper.querySelector('[data-tag-picker]') as HTMLElement;
  const tagMsg = wrapper.querySelector('[data-tag-msg]') as HTMLElement;
  const topTagsEl = wrapper.querySelector('[data-top-tags]') as HTMLElement;

  function lockVoteButtons() {
    [upBtn, downBtn, accurateBtn].forEach((btn) => {
      btn.style.cursor = "default";
      btn.style.opacity = "0.8";
    });
  }

  function updateScoreBadge(up: number, down: number) {
    const s = up - down;
    const bg = s > 0 ? "#dcfce7" : s < 0 ? "#fee2e2" : "#f3f4f6";
    const fg = s > 0 ? "#166534" : s < 0 ? "#991b1b" : "#374151";
    scoreBadge.style.background = bg;
    scoreBadge.style.color = fg;
    scoreBadge.textContent = `${s > 0 ? '+' : ''}${s}`;
  }

  if (alreadyVoted) {
    lockVoteButtons();
  }

  upBtn.addEventListener("click", () => {
    if (alreadyVoted) return;
    currentUpvotes++;
    const countEl = upBtn.querySelector('[data-count="upvotes"]');
    if (countEl) countEl.textContent = String(currentUpvotes);
    upBtn.style.background = "#dcfce7";
    upBtn.style.borderColor = "#86efac";
    updateScoreBadge(currentUpvotes, currentDownvotes);
    lockVoteButtons();
    onVote(label.id, "upvote");
  });

  downBtn.addEventListener("click", () => {
    if (alreadyVoted) return;
    currentDownvotes++;
    const countEl = downBtn.querySelector('[data-count="downvotes"]');
    if (countEl) countEl.textContent = String(currentDownvotes);
    downBtn.style.background = "#fee2e2";
    downBtn.style.borderColor = "#fca5a5";
    updateScoreBadge(currentUpvotes, currentDownvotes);
    lockVoteButtons();
    onVote(label.id, "downvote");
  });

  accurateBtn.addEventListener("click", async () => {
    if (alreadyVoted) return;
    accurateBtn.style.background = "#e0f2fe";
    accurateBtn.style.borderColor = "#7dd3fc";
    lockVoteButtons();
    try {
      await fetch(`${apiBase}/labels/${label.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, voteType: "accurate" }),
      });
    } catch {
    }
  });

  wrapper.querySelector('button[data-action="ask-ai"]')?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("hoodmap:askai", { detail: label }));
  });

  const userSelectedTags = new Set<string>();

  async function loadAndRenderTagPicker() {
    let liveCounts: Record<string, number> = {};
    try {
      const res = await fetch(`${apiBase}/labels/${label.id}/tags`);
      if (res.ok) {
        const data: { tagKey: string; count: number }[] = await res.json();
        for (const row of data) liveCounts[row.tagKey] = row.count;
      }
    } catch {
    }

    const topLiveKeys = Object.entries(liveCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);

    if (topLiveKeys.length > 0) {
      topTagsEl.innerHTML = renderTopTagBadges(topLiveKeys);
    }

    tagPicker.innerHTML = "";
    for (const tag of PREDEFINED_TAGS) {
      const count = liveCounts[tag.key] ?? 0;
      const selected = userSelectedTags.has(tag.key);
      const chip = document.createElement("button");
      chip.dataset.tagKey = tag.key;
      chip.style.cssText = `cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;border:1px solid ${selected ? "#0d9488" : "#d1d5db"};background:${selected ? "#f0fdfa" : "#f9fafb"};color:${selected ? "#0f766e" : "#374151"};transition:all 0.15s;`;
      chip.innerHTML = `${escapeHtml(tag.emoji)} ${escapeHtml(tag.label)}${count > 0 ? ` <span style="background:${selected ? "#ccfbf1" : "#e5e7eb"};border-radius:10px;padding:0 5px;font-size:10px;margin-left:2px;">${count}</span>` : ""}`;
      chip.addEventListener("click", async () => {
        if (userSelectedTags.size >= 4 && !userSelectedTags.has(tag.key)) {
          tagMsg.textContent = "Max 4 tags per label.";
          tagMsg.style.display = "block";
          return;
        }
        tagMsg.style.display = "none";
        if (userSelectedTags.has(tag.key)) {
          userSelectedTags.delete(tag.key);
        } else {
          userSelectedTags.add(tag.key);
          try {
            const res = await fetch(`${apiBase}/labels/${label.id}/tags`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tagKey: tag.key, voterId }),
            });
            if (res.ok) {
              liveCounts[tag.key] = (liveCounts[tag.key] ?? 0) + 1;
            }
          } catch {
          }
        }
        loadAndRenderTagPicker();
      });
      tagPicker.appendChild(chip);
    }
  }

  const onOpen = () => loadAndRenderTagPicker();
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
  myVotes,
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
      const { el: popupEl, onOpen } = buildPopupContent(label, onVote, apiBase, voterId, myVotes);
      marker.bindPopup(popupEl, { maxWidth: 320, className: "hoodmap-popup" });
      marker.on("popupopen", onOpen);
      if (onLabelClick) {
        marker.on("click", () => onLabelClick(label));
      }
      marker.addTo(markerLayer);
    });
  }, [filteredLabels, showLabels, selectedCategories, onVote, onLabelClick, apiBase, voterId, myVotes]);

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
        const { el: popupEl, onOpen } = buildPopupContent(label, onVote, apiBase, voterId, myVotes);
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
