-- Storage bucket for style lab images
INSERT INTO storage.buckets (id, name, public)
VALUES ('style-lab', 'style-lab', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Style lab images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'style-lab');

-- Allow anyone to upload style lab images
CREATE POLICY "Anyone can upload style lab images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'style-lab');

-- Generation history table
CREATE TABLE public.style_lab_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  preset_key text NOT NULL,
  source_image_url text NOT NULL,
  output_image_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.style_lab_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
ON public.style_lab_generations FOR SELECT
TO public
USING (session_id = COALESCE((current_setting('request.headers'::text, true)::json ->> 'x-session-id'), ''));

CREATE POLICY "Users can insert own generations"
ON public.style_lab_generations FOR INSERT
TO public
WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "Users can update own generations"
ON public.style_lab_generations FOR UPDATE
TO public
USING (session_id = COALESCE((current_setting('request.headers'::text, true)::json ->> 'x-session-id'), ''));