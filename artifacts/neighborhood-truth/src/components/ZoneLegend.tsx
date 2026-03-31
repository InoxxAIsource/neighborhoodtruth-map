import { ZONE_CATEGORIES } from "./ZoneOverlay";

export function ZoneLegend() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-[1000] pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 128px)' }}>
      <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg border px-3 py-2 flex items-center gap-3 flex-wrap justify-center">
        {Object.entries(ZONE_CATEGORIES).map(([key, zone]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: zone.color, opacity: 0.85 }}
            />
            <span className="text-[11px] font-semibold text-foreground/80 whitespace-nowrap">
              {zone.emoji} {zone.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
