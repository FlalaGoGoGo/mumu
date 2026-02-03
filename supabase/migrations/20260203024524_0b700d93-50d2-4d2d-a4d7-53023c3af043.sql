-- Create storage bucket for cached artwork images
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork-images', 'artwork-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to artwork images
CREATE POLICY "Artwork images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'artwork-images');

-- Allow service role to upload images (edge function uses service role)
CREATE POLICY "Service role can upload artwork images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'artwork-images');

-- Allow service role to update artwork images
CREATE POLICY "Service role can update artwork images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'artwork-images');

-- Allow service role to delete artwork images
CREATE POLICY "Service role can delete artwork images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'artwork-images');