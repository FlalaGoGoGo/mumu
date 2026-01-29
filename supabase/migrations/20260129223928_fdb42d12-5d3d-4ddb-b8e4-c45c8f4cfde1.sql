-- Add state column to museums table
ALTER TABLE public.museums ADD COLUMN IF NOT EXISTS state text;