-- Create analytics_events table for custom monitoring
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event VARCHAR(255) NOT NULL,
  properties JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for common queries
CREATE INDEX idx_analytics_events_event ON public.analytics_events(event);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_team_id ON public.analytics_events(team_id);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only authenticated users can insert their own events
CREATE POLICY "Users can insert their own events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only admins/coaches can read analytics (or users can read their own)
CREATE POLICY "Users can read their own events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = analytics_events.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('coach', 'admin')
    )
  );

-- Add comment
COMMENT ON TABLE public.analytics_events IS 'Custom analytics events for monitoring user actions';