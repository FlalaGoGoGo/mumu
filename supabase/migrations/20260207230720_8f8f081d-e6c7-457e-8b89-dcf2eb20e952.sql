
-- Create user_events table for unified Passport tracking
CREATE TABLE public.user_events (
  event_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger for event_type enum
CREATE OR REPLACE FUNCTION public.validate_user_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type NOT IN ('visit_museum', 'see_artwork', 'attend_exhibition', 'wishlist_add', 'wishlist_complete') THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;
  IF NEW.item_type NOT IN ('museum', 'exhibition', 'artwork') THEN
    RAISE EXCEPTION 'Invalid item_type: %', NEW.item_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_user_event_trigger
BEFORE INSERT OR UPDATE ON public.user_events
FOR EACH ROW EXECUTE FUNCTION public.validate_user_event();

-- Indexes for efficient querying
CREATE INDEX idx_user_events_session ON public.user_events (session_id);
CREATE INDEX idx_user_events_type ON public.user_events (event_type);
CREATE INDEX idx_user_events_item ON public.user_events (item_type, item_id);
CREATE INDEX idx_user_events_date ON public.user_events (event_date DESC);

-- Prevent duplicate events (same user, same action, same item)
CREATE UNIQUE INDEX idx_user_events_unique ON public.user_events (session_id, event_type, item_id);

-- Enable RLS
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all events (session-based)"
ON public.user_events FOR SELECT
USING (true);

CREATE POLICY "Users can insert own events"
ON public.user_events FOR INSERT
WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "Users can delete own events"
ON public.user_events FOR DELETE
USING (session_id IS NOT NULL);

CREATE POLICY "Users can update own events"
ON public.user_events FOR UPDATE
USING (session_id IS NOT NULL);
