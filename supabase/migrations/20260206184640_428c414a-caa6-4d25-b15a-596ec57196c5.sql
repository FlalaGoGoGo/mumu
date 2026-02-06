
-- Add profile fields to user_preferences table
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS nickname text DEFAULT '',
  ADD COLUMN IF NOT EXISTS gender text DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS location_country text DEFAULT '',
  ADD COLUMN IF NOT EXISTS location_region text DEFAULT '',
  ADD COLUMN IF NOT EXISTS location_city text DEFAULT '';

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for user avatars
CREATE POLICY "User avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

-- Allow users to upload avatars (keyed by session_id folder)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'user-avatars');

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'user-avatars');
