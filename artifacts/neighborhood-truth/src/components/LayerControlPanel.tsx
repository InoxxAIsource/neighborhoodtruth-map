import { useState } from "react";
import { Layers, X, ChevronDown, ChevronRight } from "lucide-react";
import type { LayerState } from "@/hooks/useLayerState";

interface LayerControlPanelProps {
  layers: LayerState;
  mapZoom: number;
  hasTrafficKey: boolean;
  onToggleLayer: (key: keyof Omit<LayerState, "poi">) => void;
  onTogglePoi: (key: keyof LayerState["poi"]) => void;
}

interface ToggleSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

function ToggleSwitch({ checked, disabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={[
        "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
        checked ? "bg-teal-500" : "bg-gray-300",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

const POI_ENTRIES: { key: keyof LayerState["poi"]; emoji: string; label: string }[] = [
  { key: "temple",     emoji: "🛕", label: "Temples" },
  { key: "mosque",     emoji: "🕌", label: "Mosques" },
  { key: "church",     emoji: "⛪", label: "Churches" },
  { key: "hospital",   emoji: "🏥", label: "Hospitals" },
  { key: "school",     emoji: "🏫", label: "Schools" },
  { key: "fuel",       emoji: "⛽", label: "Petrol Stations" },
  { key: "ev_charger", emoji: "⚡", label: "EV Chargers" },
];

export function LayerControlPanel({
  layers,
  mapZoom,
  hasTrafficKey,
  onToggleLayer,
  onTogglePoi,
}: LayerControlPanelProps) {
  const [open, setOpen] = useState(false);
  const [poiExpanded, setPoiExpanded] = useState(false);

  const buildings3dDisabled = mapZoom < 14;
  const anyPoiActive = Object.values(layers.poi).some(Boolean);

  return (
    <div
      className="absolute z-[1100]"
      style={{ bottom: 80, right: 12 }}
    >
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        title="Layer controls"
        className={[
          "flex items-center justify-center w-10 h-10 rounded-xl shadow-lg border transition-all",
          open
            ? "bg-teal-600 text-white border-teal-700"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
        ].join(" ")}
      >
        <Layers className="w-5 h-5" />
      </button>

      {/* Slide-out panel */}
      {open && (
        <div
          className="absolute bottom-12 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 w-64 overflow-hidden"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-semibold text-gray-800">Map Layers</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-1">
            {/* 3D Buildings */}
            <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">🏢</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-tight">3D Buildings</p>
                  {buildings3dDisabled && (
                    <p className="text-[10px] text-amber-500 leading-tight">Zoom in to zoom 14+</p>
                  )}
                </div>
              </div>
              <ToggleSwitch
                checked={layers.buildings3d}
                disabled={buildings3dDisabled}
                onChange={() => !buildings3dDisabled && onToggleLayer("buildings3d")}
              />
            </div>

            {/* Traffic */}
            <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">🚦</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-tight">Live Traffic</p>
                  {!hasTrafficKey && (
                    <p className="text-[10px] text-gray-400 leading-tight">TomTom API key required</p>
                  )}
                </div>
              </div>
              <ToggleSwitch
                checked={layers.traffic}
                disabled={!hasTrafficKey}
                onChange={() => hasTrafficKey && onToggleLayer("traffic")}
              />
            </div>

            {/* Festivals */}
            <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">🎉</span>
                <p className="text-sm font-medium text-gray-800 leading-tight">Indian Festivals</p>
              </div>
              <ToggleSwitch
                checked={layers.festivals}
                onChange={() => onToggleLayer("festivals")}
              />
            </div>

            {/* POI section */}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <button
                onClick={() => setPoiExpanded((p) => !p)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <p className="text-sm font-medium text-gray-800">Points of Interest</p>
                  {anyPoiActive && (
                    <span className="text-[10px] bg-teal-100 text-teal-700 rounded-full px-1.5 py-0.5 font-semibold">ON</span>
                  )}
                </div>
                {poiExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>

              {poiExpanded && (
                <div className="ml-2 space-y-0.5 mt-1">
                  {POI_ENTRIES.map(({ key, emoji, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{emoji}</span>
                        <p className="text-xs text-gray-700">{label}</p>
                      </div>
                      <ToggleSwitch
                        checked={layers.poi[key]}
                        onChange={() => onTogglePoi(key)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
