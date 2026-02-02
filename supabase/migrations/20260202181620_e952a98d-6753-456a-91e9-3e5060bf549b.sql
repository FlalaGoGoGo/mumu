-- Add highlight column for Must-Visit museums
ALTER TABLE public.museums 
ADD COLUMN IF NOT EXISTS highlight boolean DEFAULT FALSE;