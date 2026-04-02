CREATE TABLE public.label_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id uuid NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  voter_id text NOT NULL,
  is_accurate boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(label_id, voter_id)
);

ALTER TABLE public.label_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback" ON public.label_feedback FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read feedback" ON public.label_feedback FOR SELECT TO public USING (true);