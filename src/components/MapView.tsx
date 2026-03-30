import { useEffect, useRef, useCallback } from "react";
import L, { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

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
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function getSentiment(upvotes: number, downvotes: number) {
  const net = upvotes - downvotes;
  if (net >= 3) return "positive";
  if (net <= -3) return "negative";
  return "neutral";
}

function getBubbleColor(sentiment: string) {
  switch (sentiment) {
    case "positive": return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
    case "negative": return { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" };
    default: return { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" };
  }
}

function createBubbleIcon(label: Label) {
  const sentiment = getSentiment(label.upvotes, label.downvotes);
  const colors = getBubbleColor(sentiment);
  const shortText = label.text.length > 30 ? label.text.slice(0, 28) + "…" : label.text;

  const html = `
    <div style="
      background: ${colors.bg};
      border: 2px solid ${colors.border};
      color: ${colors.text};
      border-radius: 12px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 500;
      font-family: system-ui, sans-serif;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      position: relative;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
    ">${escapeHtml(shortText)}
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
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
  wrapper.className = "min-w-[220px] p-1";

  const sentiment = getSentiment(label.upvotes, label.downvotes);
  const vibes = (label.vibe ?? [])
    .map((v) => `<span style="display:inline-block;border:1px solid #d1d5db;border-radius:4px;padding:1px 6px;font-size:10px;margin:0 2px 2px 0;">${escapeHtml(v)}</span>`)
    .join("");

  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < label.safety ? '#facc15' : '#d1d5db'};">★</span>`
  ).join("");

  const upBtnColor = sentiment === "positive" ? "background:#dcfce7;border-color:#86efac;" : "";
  const downBtnColor = sentiment === "negative" ? "background:#fee2e2;border-color:#fca5a5;" : "";

  wrapper.innerHTML = `
    <div style="font-family:system-ui,sans-serif;">
      <p style="font-size:14px;font-weight:600;margin:0 0 6px 0;">${escapeHtml(label.text)}</p>
      <div style="font-size:12px;margin-bottom:4px;">Safety: ${stars} · ${escapeHtml(label.cost)}</div>
      ${vibes ? `<div style="margin-bottom:6px;">${vibes}</div>` : ""}
      <div style="display:flex;gap:8px;border-top:1px solid #e5e7eb;padding-top:6px;">
        <button data-vote="upvote" style="cursor:pointer;border:1px solid #d1d5db;border-radius:6px;padding:4px 10px;font-size:12px;${upBtnColor}">👍 ${label.upvotes}</button>
        <button data-vote="downvote" style="cursor:pointer;border:1px solid #d1d5db;border-radius:6px;padding:4px 10px;font-size:12px;${downBtnColor}">👎 ${label.downvotes}</button>
      </div>
    </div>
  `;

  wrapper.querySelector('button[data-vote="upvote"]')?.addEventListener("click", () => onVote(label.id, "upvote"));
  wrapper.querySelector('button[data-vote="downvote"]')?.addEventListener("click", () => onVote(label.id, "downvote"));

  return wrapper;
}

export function MapView({ labels, isPlacingPin, onMapClick, onVote }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([40.7128, -74.006], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (event: L.LeafletMouseEvent) => {
      if (!isPlacingPin) return;
      onMapClick(event.latlng.lat, event.latlng.lng);
    };

    map.on("click", handleClick);
    return () => { map.off("click", handleClick); };
  }, [isPlacingPin, onMapClick]);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (el) el.style.cursor = isPlacingPin ? "crosshair" : "grab";
  }, [isPlacingPin]);

  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    labels.forEach((label) => {
      const marker = L.marker([label.lat, label.lng], {
        icon: createBubbleIcon(label),
      }).addTo(layer);
      marker.bindPopup(buildPopupContent(label, onVote));
    });
  }, [labels, onVote]);

  return (
    <>
      <style>{`
        .label-bubble-icon { background: none !important; border: none !important; }
      `}</style>
      <div ref={mapContainerRef} className="h-full w-full z-0" />
    </>
  );
}
