
-- Fix: Restrict user_events SELECT to only the requesting session's data
DROP POLICY "Users can view all events (session-based)" ON public.user_events;

CREATE POLICY "Users can view own events"
  ON public.user_events FOR SELECT
  USING (
    session_id = coalesce(
      current_setting('request.headers', true)::json->>'x-session-id',
      ''
    )
  );
