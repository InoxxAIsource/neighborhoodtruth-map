import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PartyPopper, CloudRain, Megaphone, Car, Plus } from "lucide-react";

export interface AreaAlert {
  id: string;
  lat: number;
  lng: number;
  city: string;
  title: string;
  description: string | null;
  alert_type: string;
  severity: string;
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

const ALERT_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; bg: string; label: string }> = {
  crime: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", label: "Crime" },
  festival: { icon: PartyPopper, color: "text-amber-600", bg: "bg-amber-50", label: "Festival" },
  weather: { icon: CloudRain, color: "text-blue-600", bg: "bg-blue-50", label: "Weather" },
  protest: { icon: Megaphone, color: "text-purple-600", bg: "bg-purple-50", label: "Protest" },
  accident: { icon: Car, color: "text-orange-600", bg: "bg-orange-50", label: "Traffic" },
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

interface AlertPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: AreaAlert[];
  onSubmitAlert: () => void;
}

export function AlertPanel({ open, onOpenChange, alerts, onSubmitAlert }: AlertPanelProps) {
  const activeAlerts = alerts.filter((a) => a.active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 sm:w-96 overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Live Alerts ({activeAlerts.length})
          </SheetTitle>
        </SheetHeader>

        <Button size="sm" className="w-full mb-4 gap-2" onClick={onSubmitAlert}>
          <Plus className="h-4 w-4" />
          Report an Event
        </Button>

        {activeAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No active alerts in this area</p>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const config = ALERT_CONFIG[alert.alert_type] || ALERT_CONFIG.crime;
              const Icon = config.icon;
              return (
                <div key={alert.id} className={`${config.bg} rounded-lg p-3 border`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant={SEVERITY_COLORS[alert.severity] as any} className="text-[10px] px-1.5 py-0">
                          {alert.severity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{config.label}</span>
                        <span className="text-[10px] text-muted-foreground">· {alert.city}</span>
                      </div>
                      {alert.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                      )}
                      {alert.expires_at && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Expires: {new Date(alert.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
