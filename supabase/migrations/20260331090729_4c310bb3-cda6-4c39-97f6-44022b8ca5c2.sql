
CREATE TABLE public.chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  neighborhood_name text NOT NULL,
  question text NOT NULL,
  ai_response text NOT NULL,
  label_lat double precision,
  label_lng double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert chat logs"
ON public.chat_logs FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Anyone can read own chat logs"
ON public.chat_logs FOR SELECT TO public
USING (true);
