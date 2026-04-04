import { useEffect, useState } from "react";

interface Festival {
  name: string;
  emoji: string;
  daysUntil: number;
  isToday: boolean;
  isActive: boolean;
}

interface FestivalBannerProps {
  apiBase: string;
  enabled: boolean;
}

function festivalLabel(f: Festival): string {
  if (f.isActive && f.isToday) return `${f.emoji} ${f.name} — Today! 🎉`;
  if (f.isActive) return `${f.emoji} ${f.name} — Ongoing`;
  if (f.daysUntil === 1) return `${f.emoji} ${f.name} — Tomorrow`;
  if (f.daysUntil <= 7) return `${f.emoji} ${f.name} in ${f.daysUntil} days`;
  return `${f.emoji} ${f.name} in ${f.daysUntil} days`;
}

export function FestivalBanner({ apiBase, enabled }: FestivalBannerProps) {
  const [festivals, setFestivals] = useState<Festival[]>([]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${apiBase}/festivals`);
        if (!res.ok) return;
        const data = (await res.json()) as { festivals: Festival[] };
        if (!cancelled) setFestivals(data.festivals.slice(0, 3));
      } catch {}
    }

    load();
    const id = setInterval(load, 24 * 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled, apiBase]);

  if (!enabled || festivals.length === 0) return null;

  return (
    <div
      className="absolute left-1/2 z-[1200] flex items-center gap-2 pointer-events-none"
      style={{
        top: 60,
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
      }}
    >
      {festivals.map((f, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 bg-amber-50/95 backdrop-blur-sm border border-amber-200 rounded-full px-3 py-1 shadow-sm"
        >
          <span className="text-sm">{f.emoji}</span>
          <span className="text-xs font-medium text-amber-900">{festivalLabel(f)}</span>
        </div>
      ))}
    </div>
  );
}
