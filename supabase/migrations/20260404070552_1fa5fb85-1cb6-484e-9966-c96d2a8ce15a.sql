
CREATE TABLE public.area_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  city text NOT NULL,
  title text NOT NULL,
  description text,
  alert_type text NOT NULL DEFAULT 'festival',
  severity text NOT NULL DEFAULT 'low',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

ALTER TABLE public.area_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read alerts" ON public.area_alerts FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert alerts" ON public.area_alerts FOR INSERT TO public WITH CHECK (true);
