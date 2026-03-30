import { useEffect, useRef } from "react";
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

const markerIcon = L.icon({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

function buildPopupContent(label: Label, onVote: MapViewProps["onVote"]) {
  const wrapper = document.createElement("div");
  wrapper.className = "min-w-[220px] p-1";

  const vibes = (label.vibe ?? [])
    .map((v) => `<span class=\"inline-block rounded border px-1.5 py-0.5 text-[10px] mr-1 mb-1\">${escapeHtml(v)}</span>`)
    .join("");

  wrapper.innerHTML = `
    <div class=\"space-y-2\">
      <p class=\"text-sm font-medium\">${escapeHtml(label.text)}</p>
      <div class=\"text-xs text-muted-foreground\">Safety: ${label.safety}/5 • Cost: ${escapeHtml(label.cost)}</div>
      ${vibes ? `<div>${vibes}</div>` : ""}
      <div class=\"flex items-center gap-2 border-t pt-2\">
        <button data-vote=\"upvote\" class=\"rounded border px-2 py-1 text-xs\">👍 ${label.upvotes}</button>
        <button data-vote=\"downvote\" class=\"rounded border px-2 py-1 text-xs\">👎 ${label.downvotes}</button>
      </div>
    </div>
  `;

  const upvoteButton = wrapper.querySelector('button[data-vote="upvote"]');
  const downvoteButton = wrapper.querySelector('button[data-vote="downvote"]');

  upvoteButton?.addEventListener("click", () => onVote(label.id, "upvote"));
  downvoteButton?.addEventListener("click", () => onVote(label.id, "downvote"));

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
    return () => {
      map.off("click", handleClick);
    };
  }, [isPlacingPin, onMapClick]);

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;
    mapContainer.style.cursor = isPlacingPin ? "crosshair" : "grab";
  }, [isPlacingPin]);

  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    labels.forEach((label) => {
      const marker = L.marker([label.lat, label.lng], { icon: markerIcon }).addTo(layer);
      marker.bindPopup(buildPopupContent(label, onVote));
    });
  }, [labels, onVote]);

  return <div ref={mapContainerRef} className="h-full w-full z-0" />;
}
