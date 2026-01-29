-- Create museums table
CREATE TABLE public.museums (
  museum_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  address TEXT,
  website_url TEXT,
  opening_hours TEXT,
  has_full_content BOOLEAN DEFAULT FALSE,
  hero_image_url TEXT,
  tags TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AIC highlights table
CREATE TABLE public.aic_highlights (
  artic_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  year TEXT,
  image_url TEXT,
  route_1h_order INTEGER,
  route_full_group INTEGER,
  floor INTEGER,
  gallery INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_visits table for passport tracking
CREATE TABLE public.user_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id TEXT REFERENCES public.museums(museum_id) ON DELETE CASCADE,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  session_id TEXT NOT NULL
);

-- Create user_highlight_completions table
CREATE TABLE public.user_highlight_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artic_id TEXT REFERENCES public.aic_highlights(artic_id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.museums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aic_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_highlight_completions ENABLE ROW LEVEL SECURITY;

-- Museums and highlights are publicly readable
CREATE POLICY "Museums are publicly readable"
  ON public.museums FOR SELECT
  USING (true);

CREATE POLICY "AIC highlights are publicly readable"
  ON public.aic_highlights FOR SELECT
  USING (true);

-- User visits - public for demo (session-based)
CREATE POLICY "User visits are publicly readable"
  ON public.user_visits FOR SELECT
  USING (true);

CREATE POLICY "User visits can be inserted"
  ON public.user_visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "User visits can be deleted"
  ON public.user_visits FOR DELETE
  USING (true);

-- User highlight completions - public for demo (session-based)
CREATE POLICY "Highlight completions are publicly readable"
  ON public.user_highlight_completions FOR SELECT
  USING (true);

CREATE POLICY "Highlight completions can be inserted"
  ON public.user_highlight_completions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Highlight completions can be deleted"
  ON public.user_highlight_completions FOR DELETE
  USING (true);