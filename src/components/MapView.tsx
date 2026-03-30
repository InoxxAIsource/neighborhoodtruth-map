import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LabelPopup } from "./LabelPopup";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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

function MapClickHandler({ isPlacingPin, onMapClick }: { isPlacingPin: boolean; onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (isPlacingPin) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export function MapView({ labels, isPlacingPin, onMapClick, onVote }: MapViewProps) {
  return (
    <MapContainer
      center={[40.7128, -74.006]}
      zoom={12}
      className="h-full w-full z-0"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler isPlacingPin={isPlacingPin} onMapClick={onMapClick} />
      {labels.map((label) => (
        <Marker key={label.id} position={[label.lat, label.lng]}>
          <Popup>
            <LabelPopup label={label} onVote={onVote} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
