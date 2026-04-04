import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubmitAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapCenter: { lat: number; lng: number };
  onSuccess: () => void;
}

export function SubmitAlertDialog({ open, onOpenChange, mapCenter, onSuccess }: SubmitAlertDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [alertType, setAlertType] = useState("festival");
  const [severity, setSeverity] = useState("medium");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !city.trim()) {
      toast.error("Title and city are required");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase.from("area_alerts" as any) as any).insert({
      lat: mapCenter.lat,
      lng: mapCenter.lng,
      city: city.trim(),
      title: title.trim(),
      description: description.trim() || null,
      alert_type: alertType,
      severity,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit alert");
    } else {
      toast.success("Alert submitted! 🚨");
      setTitle("");
      setDescription("");
      setCity("");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report an Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title (e.g. Road blocked)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          <div className="flex gap-2">
            <Select value={alertType} onValueChange={setAlertType}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="festival">🎉 Festival</SelectItem>
                <SelectItem value="crime">🚨 Crime</SelectItem>
                <SelectItem value="weather">🌧️ Weather</SelectItem>
                <SelectItem value="protest">📢 Protest</SelectItem>
                <SelectItem value="accident">🚗 Traffic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">📍 Alert will be placed at your current map center</p>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit Alert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
