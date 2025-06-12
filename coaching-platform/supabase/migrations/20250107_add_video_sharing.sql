-- Add video sharing functionality
-- This allows coaches to share videos across their teams

-- Create a table to track video shares
CREATE TABLE IF NOT EXISTS video_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    shared_to_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(video_id, shared_to_team_id)
);

-- Add indexes for performance
CREATE INDEX idx_video_shares_video_id ON video_shares(video_id);
CREATE INDEX idx_video_shares_team_id ON video_shares(shared_to_team_id);

-- Add RLS policies
ALTER TABLE video_shares ENABLE ROW LEVEL SECURITY;

-- Coaches can share videos from teams they manage
CREATE POLICY "Coaches can share videos from their teams" ON video_shares
    FOR INSERT
    WITH CHECK (
        EXISTS (
            -- User must be a coach of the team that owns the video
            SELECT 1 FROM team_members tm
            JOIN videos v ON v.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
            AND tm.role = 'coach'
            AND v.id = video_id
        )
        AND 
        EXISTS (
            -- User must be a coach of the team they're sharing to
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = shared_to_team_id
            AND tm.user_id = auth.uid()
            AND tm.role = 'coach'
        )
    );

-- Anyone in a team can view shares to that team
CREATE POLICY "Team members can view shares to their team" ON video_shares
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = shared_to_team_id
            AND tm.user_id = auth.uid()
        )
    );

-- Coaches can remove shares they created
CREATE POLICY "Coaches can remove their shares" ON video_shares
    FOR DELETE
    USING (shared_by = auth.uid());

-- Create a view to make it easier to fetch videos including shared ones
CREATE OR REPLACE VIEW team_videos AS
SELECT 
    v.*,
    CASE 
        WHEN v.team_id = tm.team_id THEN 'owned'
        ELSE 'shared'
    END as access_type,
    vs.shared_by,
    vs.shared_at,
    t_owner.name as owner_team_name
FROM videos v
LEFT JOIN teams t_owner ON v.team_id = t_owner.id
LEFT JOIN video_shares vs ON v.id = vs.video_id
JOIN team_members tm ON (
    tm.team_id = v.team_id 
    OR tm.team_id = vs.shared_to_team_id
)
WHERE tm.user_id = auth.uid();

-- Grant permissions on the view
GRANT SELECT ON team_videos TO authenticated;