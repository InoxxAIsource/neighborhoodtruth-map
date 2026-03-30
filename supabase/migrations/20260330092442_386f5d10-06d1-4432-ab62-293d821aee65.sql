-- Create labels table
CREATE TABLE public.labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lat FLOAT8 NOT NULL,
  lng FLOAT8 NOT NULL,
  text VARCHAR(80) NOT NULL,
  safety INT2 NOT NULL CHECK (safety >= 1 AND safety <= 5),
  vibe TEXT[] DEFAULT '{}',
  cost TEXT NOT NULL CHECK (cost IN ('$', '$$', '$$$', '$$$$')),
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (label_id, voter_id)
);

-- Enable RLS
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Labels: anyone can read, anyone can insert (anonymous app)
CREATE POLICY "Anyone can read labels" ON public.labels FOR SELECT USING (true);
CREATE POLICY "Anyone can insert labels" ON public.labels FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update labels" ON public.labels FOR UPDATE USING (true);

-- Votes: anyone can read, anyone can insert
CREATE POLICY "Anyone can read votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.votes FOR INSERT WITH CHECK (true);