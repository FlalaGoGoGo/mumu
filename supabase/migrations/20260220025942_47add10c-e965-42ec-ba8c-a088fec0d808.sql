
-- Fix user_visits SELECT policy
DROP POLICY "Users can view own visits" ON public.user_visits;
CREATE POLICY "Users can view own visits"
  ON public.user_visits FOR SELECT
  USING (
    session_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-session-id',
      ''
    )
  );

-- Fix user_highlight_completions SELECT policy
DROP POLICY "Users can view own completions" ON public.user_highlight_completions;
CREATE POLICY "Users can view own completions"
  ON public.user_highlight_completions FOR SELECT
  USING (
    session_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-session-id',
      ''
    )
  );
