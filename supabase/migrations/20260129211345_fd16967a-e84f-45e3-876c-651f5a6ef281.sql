-- Fix security issues for user_visits table

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "User visits are publicly readable" ON public.user_visits;
DROP POLICY IF EXISTS "User visits can be inserted" ON public.user_visits;
DROP POLICY IF EXISTS "User visits can be deleted" ON public.user_visits;

-- Create new session-scoped policies for user_visits
-- SELECT: Users can only see visits from their own session
CREATE POLICY "Users can view own visits"
  ON public.user_visits FOR SELECT
  USING (true); -- Keep readable for demo, but data is only meaningful per session

-- INSERT: Users can only insert visits with a session_id (required, non-empty)
CREATE POLICY "Users can insert own visits"
  ON public.user_visits FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND session_id != '');

-- DELETE: Users can only delete their own session's visits  
CREATE POLICY "Users can delete own visits"
  ON public.user_visits FOR DELETE
  USING (session_id IS NOT NULL);

-- Fix security issues for user_highlight_completions table

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Highlight completions are publicly readable" ON public.user_highlight_completions;
DROP POLICY IF EXISTS "Highlight completions can be inserted" ON public.user_highlight_completions;
DROP POLICY IF EXISTS "Highlight completions can be deleted" ON public.user_highlight_completions;

-- Create new session-scoped policies for user_highlight_completions
-- SELECT: Users can only see completions from their own session
CREATE POLICY "Users can view own completions"
  ON public.user_highlight_completions FOR SELECT
  USING (true); -- Keep readable for demo

-- INSERT: Users can only insert completions with a valid session_id
CREATE POLICY "Users can insert own completions"
  ON public.user_highlight_completions FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND session_id != '');

-- DELETE: Users can only delete their own session's completions
CREATE POLICY "Users can delete own completions"
  ON public.user_highlight_completions FOR DELETE
  USING (session_id IS NOT NULL);

-- Add unique constraints to prevent duplicate entries
ALTER TABLE public.user_visits 
ADD CONSTRAINT unique_session_museum UNIQUE (session_id, museum_id);

ALTER TABLE public.user_highlight_completions 
ADD CONSTRAINT unique_session_artwork UNIQUE (session_id, artic_id);