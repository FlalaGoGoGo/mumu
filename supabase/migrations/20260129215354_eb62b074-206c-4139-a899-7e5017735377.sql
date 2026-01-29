-- Create user_preferences table for storing personal preferences
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'English',
  knowledge_level TEXT NOT NULL DEFAULT 'Beginner',
  visit_style TEXT NOT NULL DEFAULT 'Efficient Highlights',
  pace_preference TEXT NOT NULL DEFAULT 'Normal',
  interests TEXT[] NOT NULL DEFAULT '{}',
  discounts TEXT[] NOT NULL DEFAULT '{}',
  show_eligible_discounts_only BOOLEAN NOT NULL DEFAULT true,
  remind_free_days BOOLEAN NOT NULL DEFAULT false,
  prefer_less_walking BOOLEAN NOT NULL DEFAULT false,
  prefer_elevator BOOLEAN NOT NULL DEFAULT false,
  kid_friendly_content BOOLEAN NOT NULL DEFAULT false,
  visit_reminders BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for session-based access
CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK ((session_id IS NOT NULL) AND (session_id <> ''::text));

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (session_id IS NOT NULL);

CREATE POLICY "Users can delete own preferences"
ON public.user_preferences
FOR DELETE
USING (session_id IS NOT NULL);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_preferences_updated_at();