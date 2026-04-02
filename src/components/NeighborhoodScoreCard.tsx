import { useMemo } from "react";
import { Shield, DollarSign, TrendingUp } from "lucide-react";
import type { LabelData } from "./MapView";

interface NeighborhoodScoreCardProps {
  labels: LabelData[];
  mapCenter: { lat: number; lng: number };
  zoom: number;
}

function getScore(l: LabelData) {
  return l.upvotes - l.downvotes;
}

function getNearby(labels: LabelData[], lat: number, lng: number, radius: number) {
  return labels.filter((l) => Math.sqrt((l.lat - lat) ** 2 + (l.lng - lng) ** 2) <= radius);
}

export function NeighborhoodScoreCard({ labels, mapCenter, zoom }: NeighborhoodScoreCardProps) {
  const stats = useMemo(() => {
    if (zoom < 13) return null;

    const radius = zoom >= 16 ? 0.005 : zoom >= 14 ? 0.01 : 0.02;
    const nearby = getNearby(labels, mapCenter.lat, mapCenter.lng, radius);
    if (nearby.length < 3) return null;

    const avgSafety = nearby.reduce((s, l) => s + l.safety, 0) / nearby.length;

    const costMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
    const costLabels = ["$", "$$", "$$$", "$$$$"];
    const avgCostNum = nearby.reduce((s, l) => s + (costMap[l.cost] || 2), 0) / nearby.length;
    const avgCost = costLabels[Math.round(avgCostNum) - 1] || "$$";

    const vibeCounts: Record<string, number> = {};
    nearby.forEach((l) => (l.vibe ?? []).forEach((v) => { vibeCounts[v] = (vibeCounts[v] || 0) + 1; }));
    const topVibes = Object.entries(vibeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([v]) => v);

    const positiveCount = nearby.filter((l) => getScore(l) > 0).length;
    const sentiment = Math.round((positiveCount / nearby.length) * 100);

    return { avgSafety: Math.round(avgSafety * 10) / 10, avgCost, topVibes, sentiment, count: nearby.length };
  }, [labels, mapCenter, zoom]);

  if (!stats) return null;

  const sentimentColor = stats.sentiment >= 70
    ? "text-green-600"
    : stats.sentiment >= 40
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <div className="bg-card/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border pointer-events-auto flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">{stats.avgSafety}</span>
          <span className="text-muted-foreground text-xs">/5</span>
        </div>

        <div className="w-px h-5 bg-border" />

        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">{stats.avgCost}</span>
        </div>

        <div className="w-px h-5 bg-border" />

        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className={`font-semibold ${sentimentColor}`}>{stats.sentiment}%</span>
        </div>

        {stats.topVibes.length > 0 && (
          <>
            <div className="w-px h-5 bg-border" />
            <div className="flex gap-1">
              {stats.topVibes.map((v) => (
                <span key={v} className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-xs">
                  {v}
                </span>
              ))}
            </div>
          </>
        )}

        <span className="text-xs text-muted-foreground ml-1">{stats.count} labels</span>
      </div>
    </div>
  );
}
