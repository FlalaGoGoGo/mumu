-- Drop existing overly broad policies
DROP POLICY IF EXISTS "Users can view own generations" ON public.style_lab_generations;
DROP POLICY IF EXISTS "Users can insert own generations" ON public.style_lab_generations;
DROP POLICY IF EXISTS "Users can update own generations" ON public.style_lab_generations;

-- Session-based read policy (matches other tables in this app)
CREATE POLICY "Users can view own generations"
ON public.style_lab_generations
FOR SELECT
TO public
USING (session_id = COALESCE((current_setting('request.headers'::text, true)::json ->> 'x-session-id'), ''));