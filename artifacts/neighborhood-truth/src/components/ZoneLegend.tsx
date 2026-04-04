import { useState } from "react";
import { ZONE_CATEGORIES } from "./ZoneOverlay";
import { Info } from "lucide-react";

export function ZoneLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[999]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)' }}
    >
      <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-lg border px-3 py-2 flex flex-col items-center gap-1.5">
        {/* Zone category chips */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          {Object.entries(ZONE_CATEGORIES).map(([key, zone]) => (
            <div key={key} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: zone.color, opacity: 0.85 }}
              />
              <span className="text-[11px] font-semibold text-foreground/80 whitespace-nowrap">
                {zone.emoji} {zone.name}
              </span>
            </div>
          ))}
          <button
            onClick={() => setExpanded(p => !p)}
            className="text-muted-foreground hover:text-foreground transition-colors ml-1 pointer-events-auto"
            title="What do the icons mean?"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable hint panel */}
        {expanded && (
          <div className="border-t pt-1.5 w-full space-y-1 pointer-events-auto">
            <p className="text-[10px] text-muted-foreground text-center font-medium">How to read the map</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <div className="text-[10px] text-muted-foreground">🏷️ Label = neighborhood insight</div>
              <div className="text-[10px] text-muted-foreground">⭐ Stars = safety rating 1–5</div>
              <div className="text-[10px] text-muted-foreground">🛕 Emoji bubble = place type</div>
              <div className="text-[10px] text-muted-foreground">🔢 Number = tap to zoom in</div>
              <div className="text-[10px] text-muted-foreground">🚦 Colour roads = live traffic</div>
              <div className="text-[10px] text-muted-foreground">🏢 Layers icon = toggle extras</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
