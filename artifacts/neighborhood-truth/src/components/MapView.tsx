import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { renderZoneLayer, ZONE_CATEGORIES } from "./ZoneOverlay";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LayerState } from "@/hooks/useLayerState";

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
  onVote: (labelId: string, voteType: "upvote" | "downvote" | "accurate") => void;
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
  onMapViewChange?: (lat: number, lng: number, zoom: number) => void;
  layers?: LayerState;
  hereApiKey?: string;
  onZoomChange?: (zoom: number) => void;
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

interface PendingTransport {
  fromLabel: LabelData;
  originMarker: L.Marker | null;
  handleDestination: (toLabel: LabelData) => void;
  cancel: () => void;
}

let pendingTransport: PendingTransport | null = null;
let transportOriginMarker: L.Marker | null = null;

interface PopupStrings {
  vibeOptions: Record<string, string>;
  askAI: string;
  stillAccurate: string;
  tagThisArea: string;
  localCosts: string;
  estimateTravel: string;
  costLabels: Record<string, string>;
}

function buildPopupContent(
  label: LabelData,
  onVote: (labelId: string, voteType: "upvote" | "downvote" | "accurate") => void,
  apiBase: string,
  voterId: string,
  myVotes?: { labelId: string; voteType: string }[],
  strings?: PopupStrings,
): { el: HTMLElement; onOpen: () => void } {
  const wrapper = document.createElement("div");
  wrapper.style.fontFamily = "system-ui, sans-serif";
  wrapper.style.minWidth = "220px";
  wrapper.style.maxWidth = "300px";

  const score = getScore(label);
  const vibes = (label.vibe ?? [])
    .map((v) => {
      const label_text = strings?.vibeOptions[v] ?? v;
      return `<span style="display:inline-block;background:#f3f4f6;border-radius:4px;padding:2px 7px;font-size:11px;margin:0 3px 3px 0;color:#374151;">${escapeHtml(label_text)}</span>`;
    })
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
        <span style="font-size:13px;font-weight:600;color:#374151;">${escapeHtml(label.cost)}${strings?.costLabels?.[label.cost] && strings.costLabels[label.cost] !== label.cost ? ` · ${escapeHtml(strings.costLabels[label.cost])}` : ""}</span>
      </div>
      ${vibes ? `<div style="margin-top:4px;">${vibes}</div>` : ""}
      ${topTagsHtml ? `<div style="margin-top:6px;" data-top-tags>${topTagsHtml}</div>` : `<div style="margin-top:6px;" data-top-tags></div>`}
    </div>
    <div style="display:flex;align-items:center;gap:6px;border-top:1px solid #e5e7eb;padding-top:8px;flex-wrap:wrap;">
      <button data-vote="upvote" title="${voteTitle}" style="cursor:${voteCursor};${upvotedStyle};border-radius:8px;padding:4px 10px;font-size:12px;display:flex;align-items:center;gap:3px;">👍 <strong data-count="upvotes">${label.upvotes}</strong></button>
      <button data-vote="downvote" title="${voteTitle}" style="cursor:${voteCursor};${downvotedStyle};border-radius:8px;padding:4px 10px;font-size:12px;display:flex;align-items:center;gap:3px;">👎 <strong data-count="downvotes">${label.downvotes}</strong></button>
      <button data-vote="accurate" title="${voteTitle}" style="cursor:${voteCursor};${accurateStyle};border-radius:8px;padding:4px 10px;font-size:12px;display:flex;align-items:center;gap:3px;">🔁 ${escapeHtml(strings?.stillAccurate ?? "Still accurate")}</button>
      <span data-score-badge style="margin-left:auto;background:${scoreBadgeColor};color:${scoreBadgeText};border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;">${score > 0 ? '+' : ''}${score}</span>
    </div>
    <div style="margin-top:8px;display:flex;gap:8px;">
      <button data-action="ask-ai" style="cursor:pointer;flex:1;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;">✨ ${escapeHtml(strings?.askAI ?? "Ask AI about this area")}</button>
      <button data-action="share" title="Share vibe card" style="cursor:pointer;background:#f9fafb;border:1px solid #d1d5db;border-radius:8px;padding:7px 12px;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">📤</button>
    </div>
    <div style="margin-top:10px;border-top:1px solid #e5e7eb;padding-top:10px;">
      <p style="font-size:11px;font-weight:700;color:#374151;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(strings?.tagThisArea ?? "Tag this area")} <span style="font-weight:400;color:#9ca3af;">(pick up to 4)</span></p>
      <div data-tag-picker style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px;"></div>
      <p data-tag-msg style="font-size:11px;color:#6b7280;margin:4px 0 0;display:none;"></p>
    </div>
    <div data-cost-section style="margin-top:10px;border-top:1px solid #e5e7eb;padding-top:10px;">
      <p style="font-size:11px;font-weight:700;color:#374151;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(strings?.localCosts ?? "💰 Local Costs")}</p>
      <div data-cost-body>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
          ${[1,2,3,4,5].map(() => `<div class="animate-pulse" style="height:16px;background:#f3f4f6;border-radius:4px;"></div><div class="animate-pulse" style="height:16px;background:#f3f4f6;border-radius:4px;"></div>`).join("")}
        </div>
      </div>
    </div>
    <div style="margin-top:8px;">
      <button data-action="transport" style="cursor:pointer;width:100%;background:#f9fafb;border:1px solid #d1d5db;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:600;color:#374151;display:flex;align-items:center;justify-content:center;gap:6px;">🚌 ${escapeHtml(strings?.estimateTravel ?? "Estimate travel cost →")}</button>
    </div>
    <div data-transport-section style="display:none;margin-top:8px;padding:8px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
      <div data-transport-body></div>
    </div>
  `;

  const upBtn = wrapper.querySelector('button[data-vote="upvote"]') as HTMLButtonElement;
  const downBtn = wrapper.querySelector('button[data-vote="downvote"]') as HTMLButtonElement;
  const accurateBtn = wrapper.querySelector('button[data-vote="accurate"]') as HTMLButtonElement;
  const scoreBadge = wrapper.querySelector('[data-score-badge]') as HTMLElement;
  const tagPicker = wrapper.querySelector('[data-tag-picker]') as HTMLElement;
  const tagMsg = wrapper.querySelector('[data-tag-msg]') as HTMLElement;
  const topTagsEl = wrapper.querySelector('[data-top-tags]') as HTMLElement;
  const costBody = wrapper.querySelector('[data-cost-body]') as HTMLElement;
  const costSection = wrapper.querySelector('[data-cost-section]') as HTMLElement;
  const transportSection = wrapper.querySelector('[data-transport-section]') as HTMLElement;
  const transportBody = wrapper.querySelector('[data-transport-body]') as HTMLElement;
  const transportBtn = wrapper.querySelector('button[data-action="transport"]') as HTMLButtonElement;

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

  accurateBtn.addEventListener("click", () => {
    if (alreadyVoted) return;
    accurateBtn.style.background = "#e0f2fe";
    accurateBtn.style.borderColor = "#7dd3fc";
    lockVoteButtons();
    onVote(label.id, "accurate");
  });

  wrapper.querySelector('button[data-action="ask-ai"]')?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("hoodmap:askai", { detail: label }));
  });

  wrapper.querySelector('button[data-action="share"]')?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("hoodmap:share", { detail: label }));
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
            if (res.status === 201) {
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

  async function loadCostIntelligence() {
    try {
      const res = await fetch(`${apiBase}/labels/${label.id}/cost-intelligence`);
      if (!res.ok) {
        costSection.style.display = "none";
        return;
      }
      const data: {
        city: string;
        currency: string;
        costLevel: string;
        items: { label: string; emoji: string; range: string }[];
      } = await res.json();

      costBody.innerHTML = `
        <p style="font-size:11px;color:#6b7280;margin:0 0 6px;">${escapeHtml(data.city)} · ${escapeHtml(data.costLevel)} area</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;">
          ${data.items.map((item) => `
            <span style="font-size:11px;color:#6b7280;">${escapeHtml(item.emoji)} ${escapeHtml(item.label)}</span>
            <span style="font-size:11px;font-weight:600;color:#111827;text-align:right;">${escapeHtml(item.range)}</span>
          `).join("")}
        </div>
      `;
    } catch {
      costSection.style.display = "none";
    }
  }

  let transportCancelCleanup: (() => void) | null = null;

  function cancelTransportMode() {
    pendingTransport = null;
    transportCancelCleanup?.();
    transportCancelCleanup = null;
    transportBtn.textContent = "🚌 Estimate travel cost →";
    transportBtn.style.background = "#f9fafb";
    transportBtn.style.color = "#374151";
    window.dispatchEvent(new CustomEvent("hoodmap:transport-cancel"));
  }

  transportBtn.addEventListener("click", () => {
    if (pendingTransport?.fromLabel.id === label.id) {
      cancelTransportMode();
      return;
    }

    // Cancel any OTHER popup's pending transport mode first (cleans up its listeners)
    pendingTransport?.cancel();

    transportBtn.textContent = "✕ Cancel — click another label";
    transportBtn.style.background = "#fef3c7";
    transportBtn.style.color = "#92400e";

    transportSection.style.display = "block";
    transportBody.innerHTML = `<p style="font-size:12px;color:#0369a1;margin:0;">Click any other label on the map to estimate travel cost from here.</p>`;

    window.dispatchEvent(new CustomEvent("hoodmap:transport-start", {
      detail: { fromText: label.text },
    }));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelTransportMode();
    };

    const handleTransportCancel = () => {
      if (pendingTransport?.fromLabel.id !== label.id) {
        transportSection.style.display = "none";
        transportBody.innerHTML = "";
        transportBtn.textContent = "🚌 Estimate travel cost →";
        transportBtn.style.background = "#f9fafb";
        transportBtn.style.color = "#374151";
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("hoodmap:transport-cancel", handleTransportCancel);

    transportCancelCleanup = () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("hoodmap:transport-cancel", handleTransportCancel);
    };

    pendingTransport = {
      fromLabel: label,
      originMarker: transportOriginMarker, // captured NOW before destination click can overwrite it
      handleDestination: async (toLabel: LabelData) => {
        cancelTransportMode();

        transportBtn.textContent = "🚌 Estimate travel cost →";
        transportBtn.style.background = "#f9fafb";
        transportBtn.style.color = "#374151";

        transportSection.style.display = "block";
        transportBody.innerHTML = `<p style="font-size:12px;color:#6b7280;margin:0;">Calculating route…</p>`;

        try {
          const params = new URLSearchParams({
            from_lat: String(label.lat),
            from_lng: String(label.lng),
            to_lat: String(toLabel.lat),
            to_lng: String(toLabel.lng),
          });
          const res = await fetch(`${apiBase}/transport/estimate?${params}`);
          if (!res.ok) throw new Error("No data");

          const data: {
            distanceKm: number;
            fromCity: string;
            currency: string;
            modes: { mode: string; emoji: string; costRange: string; timeMin: number }[];
          } = await res.json();

          transportBody.innerHTML = `
            <p style="font-size:11px;font-weight:700;color:#0369a1;margin:0 0 5px;">
              To: ${escapeHtml(toLabel.text)} · ${data.distanceKm} km
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
              <thead>
                <tr>
                  <th style="text-align:left;color:#6b7280;font-weight:600;padding-bottom:3px;">Mode</th>
                  <th style="text-align:right;color:#6b7280;font-weight:600;padding-bottom:3px;">Cost</th>
                  <th style="text-align:right;color:#6b7280;font-weight:600;padding-bottom:3px;">~Time</th>
                </tr>
              </thead>
              <tbody>
                ${data.modes.map((m) => `
                  <tr>
                    <td style="color:#1e293b;padding:2px 0;">${escapeHtml(m.emoji)} ${escapeHtml(m.mode)}</td>
                    <td style="text-align:right;font-weight:600;color:#111827;">${escapeHtml(m.costRange)}</td>
                    <td style="text-align:right;color:#6b7280;">${m.timeMin} min</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `;
        } catch {
          transportBody.innerHTML = `<p style="font-size:12px;color:#ef4444;margin:0;">Could not estimate for this route.</p>`;
        }
      },
      cancel: cancelTransportMode,
    };
  });

  const onOpen = () => {
    loadAndRenderTagPicker();
    loadCostIntelligence();
  };
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

const POI_COLORS: Record<string, string> = {
  temple:     "#f97316",
  mosque:     "#10b981",
  church:     "#6366f1",
  hospital:   "#ef4444",
  school:     "#3b82f6",
  fuel:       "#f59e0b",
  ev_charger: "#22d3ee",
};

const POI_EMOJIS: Record<string, string> = {
  temple:     "🛕",
  mosque:     "🕌",
  church:     "⛪",
  hospital:   "🏥",
  school:     "🏫",
  fuel:       "⛽",
  ev_charger: "⚡",
};

function makePOIIcon(category: string) {
  const emoji = POI_EMOJIS[category] ?? "📍";
  const color = POI_COLORS[category] ?? "#888";
  return L.divIcon({
    html: `<div style="
      background:${color};
      color:#fff;
      border-radius:50%;
      width:28px;height:28px;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      border:2px solid rgba(255,255,255,0.9);
    ">${emoji}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function makeClusterIcon(category: string, count: number) {
  const emoji = POI_EMOJIS[category] ?? "📍";
  const color = POI_COLORS[category] ?? "#888";
  const size = count < 10 ? 34 : count < 50 ? 40 : 46;
  return L.divIcon({
    html: `<div style="
      background:${color};
      color:#fff;
      border-radius:50%;
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      flex-direction:column;
      font-size:11px;font-weight:700;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      border:2.5px solid rgba(255,255,255,0.95);
    ">
      <span style="font-size:14px;line-height:1">${emoji}</span>
      <span style="font-size:9px;line-height:1;margin-top:1px">${count}</span>
    </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
  onMapViewChange,
  layers,
  hereApiKey,
  onZoomChange,
}: MapViewProps) {
  const { t } = useLanguage();
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const zoneLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const transportBannerRef = useRef<HTMLDivElement | null>(null);
  // Layer refs
  const poiLayersRef = useRef<Map<string, L.MarkerClusterGroup>>(new Map());
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const buildings3dRef = useRef<unknown>(null);
  const poiFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transport mode: cursor + map-level instruction banner
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function showBanner(fromText: string) {
      if (!container) return;

      const existing = transportBannerRef.current;
      if (existing) existing.remove();

      const banner = document.createElement("div");
      banner.style.cssText = [
        "position:absolute",
        "top:12px",
        "left:50%",
        "transform:translateX(-50%)",
        "z-index:1000",
        "background:#1e40af",
        "color:#fff",
        "padding:8px 16px",
        "border-radius:24px",
        "font-size:13px",
        "font-weight:600",
        "font-family:system-ui,sans-serif",
        "box-shadow:0 4px 12px rgba(0,0,0,0.25)",
        "white-space:nowrap",
        "pointer-events:auto",
        "display:flex",
        "align-items:center",
        "gap:10px",
      ].join(";");

      const msg = document.createElement("span");
      msg.textContent = `🚌 Click a destination label to estimate travel from "${fromText}"`;
      banner.appendChild(msg);

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "✕";
      cancelBtn.style.cssText = "background:rgba(255,255,255,0.25);border:none;color:#fff;border-radius:12px;padding:1px 7px;font-size:12px;cursor:pointer;font-weight:700;";
      cancelBtn.addEventListener("click", () => {
        pendingTransport?.cancel();
      });
      banner.appendChild(cancelBtn);

      container.style.position = "relative";
      container.appendChild(banner);
      transportBannerRef.current = banner;

      const map = mapRef.current;
      if (map) map.getContainer().style.cursor = "crosshair";
    }

    function hideBanner() {
      if (transportBannerRef.current) {
        transportBannerRef.current.remove();
        transportBannerRef.current = null;
      }
      const map = mapRef.current;
      if (map) map.getContainer().style.cursor = "";
    }

    const onStart = (e: Event) => {
      const detail = (e as CustomEvent<{ fromText: string }>).detail;
      showBanner(detail.fromText);
    };

    const onCancel = () => hideBanner();

    window.addEventListener("hoodmap:transport-start", onStart);
    window.addEventListener("hoodmap:transport-cancel", onCancel);

    return () => {
      window.removeEventListener("hoodmap:transport-start", onStart);
      window.removeEventListener("hoodmap:transport-cancel", onCancel);
      hideBanner();
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
    });

    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    tileLayer.once("tileload", () => setMapReady(true));
    // Fallback: reveal map after 2 s even if tiles are blocked (e.g. in dev sandbox)
    const mapReadyTimer = setTimeout(() => setMapReady(true), 2000);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      clearTimeout(mapReadyTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Map view change — notify parent of center+zoom for city detection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onMapViewChange) return;

    const handler = () => {
      const c = map.getCenter();
      onMapViewChange(c.lat, c.lng, map.getZoom());
    };

    map.on("moveend", handler);
    map.on("zoomend", handler);

    return () => {
      map.off("moveend", handler);
      map.off("zoomend", handler);
    };
  }, [onMapViewChange]);

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
      const { el: popupEl, onOpen } = buildPopupContent(label, onVote, apiBase, voterId, myVotes, t);
      marker.bindPopup(popupEl, { maxWidth: 320, className: "hoodmap-popup" });
      marker.on("popupopen", () => {
        transportOriginMarker = marker;
        onOpen();
      });
      marker.on("click", () => {
        if (pendingTransport) {
          if (pendingTransport.fromLabel.id === label.id) {
            pendingTransport.cancel();
            return;
          }
          // Destination selected: prevent destination popup, keep origin popup visible
          // Capture originMarker from pendingTransport (set at transport-start time,
          // before Leaflet's popupopen on dest can overwrite transportOriginMarker)
          const originMarker = pendingTransport.originMarker;
          const pt = pendingTransport;
          const destLabel = label;
          setTimeout(() => {
            marker.closePopup();
            originMarker?.openPopup();
            pt.handleDestination(destLabel);
          }, 0);
          return;
        }
        onLabelClick?.(label);
      });
      marker.addTo(markerLayer);
    });
  }, [filteredLabels, showLabels, selectedCategories, onVote, onLabelClick, apiBase, voterId, myVotes, t]);

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
        const { el: popupEl, onOpen } = buildPopupContent(label, onVote, apiBase, voterId, myVotes, t);
        marker.bindPopup(popupEl, { maxWidth: 320, className: "hoodmap-popup" });
        marker.on("popupopen", () => {
          transportOriginMarker = marker;
          onOpen();
        });
        marker.on("click", () => {
          if (pendingTransport) {
            if (pendingTransport.fromLabel.id === label.id) {
              pendingTransport.cancel();
              return;
            }
            const originMarker = pendingTransport.originMarker;
            const pt = pendingTransport;
            const destLabel = label;
            setTimeout(() => {
              marker.closePopup();
              originMarker?.openPopup();
              pt.handleDestination(destLabel);
            }, 0);
            return;
          }
          onLabelClick?.(label);
        });
        marker.addTo(markerLayer);
      });
    };

    map.on("zoomend", onZoom);
    return () => { map.off("zoomend", onZoom); };
  }, [filteredLabels, showLabels, selectedCategories, onVote, onLabelClick, apiBase, voterId, myVotes, t]);

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

  // Emit zoom changes to parent
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onZoomChange) return;
    const handler = () => onZoomChange(map.getZoom());
    map.on("zoomend", handler);
    return () => { map.off("zoomend", handler); };
  }, [onZoomChange]);

  // ─── POI fetching helper ───────────────────────────────────────────────────
  const fetchPoi = useCallback(async (category: string) => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const url = `${apiBase}/poi?category=${category}&south=${b.getSouth().toFixed(4)}&west=${b.getWest().toFixed(4)}&north=${b.getNorth().toFixed(4)}&east=${b.getEast().toFixed(4)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const geojson = await res.json() as { features: { geometry: { coordinates: [number,number] }; properties: { name: string; category: string } }[] };

      let clusterGroup = poiLayersRef.current.get(category);
      if (!clusterGroup) {
        clusterGroup = L.markerClusterGroup({
          maxClusterRadius: 60,
          iconCreateFunction: (cluster) =>
            makeClusterIcon(category, cluster.getChildCount()),
        });
        poiLayersRef.current.set(category, clusterGroup);
      } else {
        clusterGroup.clearLayers();
      }

      const label = category.replace("_", " ");
      geojson.features.forEach((feat) => {
        const [lng, lat] = feat.geometry.coordinates;
        const marker = L.marker([lat, lng], { icon: makePOIIcon(category) });
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;min-width:120px">
            <b style="font-size:13px">${feat.properties.name}</b>
            <br/><span style="font-size:11px;color:#666;text-transform:capitalize">${label}</span>
          </div>`,
          { maxWidth: 200 }
        );
        clusterGroup!.addLayer(marker);
      });

      if (!map.hasLayer(clusterGroup)) {
        clusterGroup.addTo(map);
      }
    } catch {}
  }, [apiBase]);

  // ─── POI layers — toggle on/off, refetch on map move ──────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layers) return;

    const activePois = Object.entries(layers.poi)
      .filter(([, on]) => on)
      .map(([k]) => k);

    // Remove disabled layers
    poiLayersRef.current.forEach((group, cat) => {
      if (!layers.poi[cat as keyof typeof layers.poi]) {
        map.removeLayer(group);
        poiLayersRef.current.delete(cat);
      }
    });

    // Fetch enabled layers
    activePois.forEach((cat) => fetchPoi(cat));

    // Debounced refetch on move
    const onMove = () => {
      if (poiFetchTimeoutRef.current) clearTimeout(poiFetchTimeoutRef.current);
      poiFetchTimeoutRef.current = setTimeout(() => {
        activePois.forEach((cat) => fetchPoi(cat));
      }, 600);
    };

    if (activePois.length > 0) {
      map.on("moveend", onMove);
      map.on("zoomend", onMove);
    }

    return () => {
      if (poiFetchTimeoutRef.current) clearTimeout(poiFetchTimeoutRef.current);
      map.off("moveend", onMove);
      map.off("zoomend", onMove);
    };
  }, [layers?.poi, fetchPoi]);

  // ─── 3D Buildings ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layers) return;

    if (!layers.buildings3d) {
      if (buildings3dRef.current) {
        try {
          // @ts-expect-error osmbuildings
          buildings3dRef.current.remove?.();
        } catch {}
        buildings3dRef.current = null;
      }
      return;
    }

    // Load OSMBuildings dynamically from CDN
    if (!(window as unknown as Record<string, unknown>)["OSMBuildings"]) {
      const script = document.createElement("script");
      script.src = "https://cdn.osmbuildings.org/OSMBuildings-Leaflet.js";
      script.onload = () => {
        // @ts-expect-error osmbuildings
        const osmb = new OSMBuildings(map);
        osmb.date(new Date());
        osmb.load("https://data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.json");
        buildings3dRef.current = osmb;
      };
      document.head.appendChild(script);
    } else {
      // @ts-expect-error osmbuildings
      const osmb = new OSMBuildings(map);
      osmb.date(new Date());
      osmb.load("https://data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.json");
      buildings3dRef.current = osmb;
    }

    return () => {
      if (buildings3dRef.current) {
        try {
          // @ts-expect-error osmbuildings
          buildings3dRef.current.remove?.();
        } catch {}
        buildings3dRef.current = null;
      }
    };
  }, [layers?.buildings3d]);

  // ─── TomTom traffic layer ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layers || !hereApiKey) return;

    if (layers.traffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = L.tileLayer(
          `https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${hereApiKey}`,
          { subdomains: ["a", "b", "c", "d"], opacity: 0.7, attribution: "© TomTom Traffic" }
        );
      }
      if (!map.hasLayer(trafficLayerRef.current)) {
        trafficLayerRef.current.addTo(map);
      }
    } else {
      if (trafficLayerRef.current && map.hasLayer(trafficLayerRef.current)) {
        map.removeLayer(trafficLayerRef.current);
      }
    }
  }, [layers?.traffic, hereApiKey]);

  const posterSrc = `${import.meta.env.BASE_URL}map-poster.jpg`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {!mapReady && (
        <img
          src={posterSrc}
          alt="World neighborhood map"
          fetchPriority="high"
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
          }}
        />
      )}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: mapReady ? 1 : 0,
          transition: "opacity 0.3s ease",
          zIndex: 2,
        }}
        className="z-0"
      />
    </div>
  );
}
