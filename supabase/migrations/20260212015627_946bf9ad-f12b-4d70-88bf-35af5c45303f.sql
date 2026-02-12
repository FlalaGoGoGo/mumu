
-- Fix: Restrict user_preferences SELECT to session owner only
DROP POLICY "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (session_id = COALESCE(((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text), ''::text));

-- Also tighten UPDATE and DELETE to use session header validation
DROP POLICY "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (session_id = COALESCE(((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text), ''::text));

DROP POLICY "Users can delete own preferences" ON public.user_preferences;
CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences FOR DELETE
  USING (session_id = COALESCE(((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text), ''::text));
