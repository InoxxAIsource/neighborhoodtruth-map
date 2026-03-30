import { useEffect, useRef, useMemo } from "react";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

interface Label {
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

interface MapViewProps {
  labels: Label[];
  isPlacingPin: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onVote: (labelId: string, voteType: "upvote" | "downvote") => void;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

function getScore(label: Label) {
  return label.upvotes - label.downvotes;
}

function getSentiment(score: number) {
  if (score >= 3) return "positive";
  if (score <= -3) return "negative";
  return "neutral";
}

function getBubbleStyle(sentiment: string) {
  switch (sentiment) {
    case "positive": return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
    case "negative": return { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" };
    default: return { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" };
  }
}

function getScaleFromScore(score: number) {
  // Clamp score -20 to +30, map to 0.7–1.4 scale
  const clamped = Math.max(-20, Math.min(30, score));
  const t = (clamped + 20) / 50; // 0..1
  return 0.7 + t * 0.7;
}

function getOpacityFromScore(score: number) {
  if (score <= -5) return 0.5;
  if (score <= 0) return 0.7;
  return 1;
}

function createBubbleIcon(label: Label) {
  const score = getScore(label);
  const sentiment = getSentiment(score);
  const colors = getBubbleStyle(sentiment);
  const scale = getScaleFromScore(score);
  const opacity = getOpacityFromScore(score);
  const shortText = label.text.length > 30 ? label.text.slice(0, 28) + "…" : label.text;

  const html = `
    <div style="
      background: ${colors.bg};
      border: 2px solid ${colors.border};
      color: ${colors.text};
      border-radius: 12px;
      padding: 5px 9px;
      font-size: ${Math.round(11 * scale)}px;
      font-weight: ${score > 5 ? 700 : 500};
      font-family: system-ui, sans-serif;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      position: relative;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: ${opacity};
      transform: scale(${scale});
      transform-origin: bottom center;
      transition: transform 0.2s, opacity 0.2s;
    ">${escapeHtml(shortText)}
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid ${colors.border};
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "label-bubble-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 30],
    popupAnchor: [0, -35],
  });
}

function buildPopupContent(label: Label, onVote: MapViewProps["onVote"]) {
  const wrapper = document.createElement("div");
  wrapper.style.fontFamily = "system-ui, sans-serif";
  wrapper.style.minWidth = "220px";

  const score = getScore(label);
  const sentiment = getSentiment(score);
  const vibes = (label.vibe ?? [])
    .map((v) => `<span style="display:inline-block;border:1px solid #d1d5db;border-radius:4px;padding:1px 6px;font-size:10px;margin:0 2px 2px 0;">${escapeHtml(v)}</span>`)
    .join("");

  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < label.safety ? '#facc15' : '#d1d5db'};">★</span>`
  ).join("");

  const upBg = sentiment === "positive" ? "background:#dcfce7;border-color:#86efac;" : "";
  const downBg = sentiment === "negative" ? "background:#fee2e2;border-color:#fca5a5;" : "";

  wrapper.innerHTML = `
    <p style="font-size:14px;font-weight:600;margin:0 0 6px;">${escapeHtml(label.text)}</p>
    <div style="font-size:12px;margin-bottom:4px;">Safety: ${stars} · ${escapeHtml(label.cost)}</div>
    ${vibes ? `<div style="margin-bottom:6px;">${vibes}</div>` : ""}
    <div style="display:flex;gap:8px;border-top:1px solid #e5e7eb;padding-top:6px;">
      <button data-vote="upvote" style="cursor:pointer;border:1px solid #d1d5db;border-radius:6px;padding:4px 10px;font-size:12px;${upBg}">👍 ${label.upvotes}</button>
      <button data-vote="downvote" style="cursor:pointer;border:1px solid #d1d5db;border-radius:6px;padding:4px 10px;font-size:12px;${downBg}">👎 ${label.downvotes}</button>
    </div>
  `;

  wrapper.querySelector('button[data-vote="upvote"]')?.addEventListener("click", () => onVote(label.id, "upvote"));
  wrapper.querySelector('button[data-vote="downvote"]')?.addEventListener("click", () => onVote(label.id, "downvote"));

  return wrapper;
}

export function MapView({ labels, isPlacingPin, onMapClick, onVote }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  // Sort by score, take top 100
  const visibleLabels = useMemo(() => {
    return [...labels]
      .sort((a, b) => getScore(b) - getScore(a))
      .slice(0, 100);
  }, [labels]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomAnimation: true,
      markerZoomAnimation: true,
    }).setView([40.7128, -74.006], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate: true,
      animateAddingMarkers: true,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        let size = "small";
        if (count > 20) size = "large";
        else if (count > 10) size = "medium";
        return L.divIcon({
          html: `<div style="
            background: hsl(174 62% 47%);
            color: white;
            border-radius: 50%;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 13px;
            font-family: system-ui, sans-serif;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          ">${count}</div>`,
          className: "marker-cluster-custom",
          iconSize: L.point(size === "large" ? 48 : size === "medium" ? 40 : 34, size === "large" ? 48 : size === "medium" ? 40 : 34),
        });
      },
    });

    cluster.addTo(map);
    clusterRef.current = cluster;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

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

  useEffect(() => {
    const el = mapContainerRef.current;
    if (el) el.style.cursor = isPlacingPin ? "crosshair" : "grab";
  }, [isPlacingPin]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    cluster.clearLayers();

    visibleLabels.forEach((label) => {
      const marker = L.marker([label.lat, label.lng], {
        icon: createBubbleIcon(label),
      });
      marker.bindPopup(buildPopupContent(label, onVote));
      cluster.addLayer(marker);
    });
  }, [visibleLabels, onVote]);

  return (
    <>
      <style>{`
        .label-bubble-icon { background: none !important; border: none !important; }
        .marker-cluster-custom { background: none !important; border: none !important; }
      `}</style>
      <div ref={mapContainerRef} className="h-full w-full z-0" />
    </>
  );
}
