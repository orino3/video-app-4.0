-- Add soft delete functionality to teams
-- This allows teams to be recoverable for 30 days

-- Add deleted_at column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add owner_id column to track who created the team (first coach)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- Update existing teams to set owner_id to the first coach
UPDATE teams t
SET owner_id = (
  SELECT tm.user_id 
  FROM team_members tm 
  WHERE tm.team_id = t.id 
  AND tm.role = 'coach' 
  ORDER BY tm.created_at ASC 
  LIMIT 1
)
WHERE t.owner_id IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_teams_deleted_at ON teams(deleted_at);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);

-- Update RLS policies to filter out soft-deleted teams by default

-- Drop existing select policy
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;

-- Create new select policy that excludes soft-deleted teams
CREATE POLICY "Team members can view non-deleted teams" ON teams
FOR SELECT USING (
  deleted_at IS NULL 
  AND id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);

-- Create policy for viewing soft-deleted teams (team owner only)
CREATE POLICY "Team owners can view deleted teams" ON teams
FOR SELECT USING (
  deleted_at IS NOT NULL 
  AND owner_id = auth.uid()
);

-- Update delete policy to only allow team owner to delete
DROP POLICY IF EXISTS "Team members can delete teams" ON teams;

CREATE POLICY "Only team owner can delete team" ON teams
FOR DELETE USING (
  owner_id = auth.uid()
);

-- Create function to check team content before deletion
CREATE OR REPLACE FUNCTION get_team_content_summary(team_id_param UUID)
RETURNS JSON AS $$
DECLARE
  content_summary JSON;
BEGIN
  SELECT json_build_object(
    'video_count', (SELECT COUNT(*) FROM videos WHERE team_id = team_id_param),
    'member_count', (SELECT COUNT(*) FROM team_members WHERE team_id = team_id_param),
    'total_annotations', (
      SELECT COUNT(*) 
      FROM annotations a
      JOIN videos v ON a.video_id = v.id
      WHERE v.team_id = team_id_param
    ),
    'total_video_size_mb', (
      SELECT COALESCE(SUM(v.file_size) / 1048576, 0)
      FROM videos v
      WHERE v.team_id = team_id_param
    )
  ) INTO content_summary;
  
  RETURN content_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to soft delete team
CREATE OR REPLACE FUNCTION soft_delete_team(team_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user is the team owner
  IF NOT EXISTS (
    SELECT 1 FROM teams 
    WHERE id = team_id_param 
    AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the team owner can delete the team';
  END IF;
  
  -- Soft delete the team
  UPDATE teams 
  SET deleted_at = NOW()
  WHERE id = team_id_param;
  
  -- Remove all team members (they lose access immediately)
  DELETE FROM team_members WHERE team_id = team_id_param;
  
  -- Note: Videos and annotations are kept but become inaccessible
  -- until team is restored or permanently deleted
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to restore soft-deleted team
CREATE OR REPLACE FUNCTION restore_team(team_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user is the team owner
  IF NOT EXISTS (
    SELECT 1 FROM teams 
    WHERE id = team_id_param 
    AND owner_id = auth.uid()
    AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Only the team owner can restore the team';
  END IF;
  
  -- Restore the team
  UPDATE teams 
  SET deleted_at = NULL
  WHERE id = team_id_param;
  
  -- Re-add the owner as a coach
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (team_id_param, auth.uid(), 'coach')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to permanently delete old soft-deleted teams
CREATE OR REPLACE FUNCTION cleanup_deleted_teams()
RETURNS void AS $$
BEGIN
  -- Delete videos associated with teams deleted more than 30 days ago
  DELETE FROM videos 
  WHERE team_id IN (
    SELECT id FROM teams 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days'
  );
  
  -- Permanently delete teams soft-deleted more than 30 days ago
  DELETE FROM teams 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to document the soft delete behavior
COMMENT ON COLUMN teams.deleted_at IS 'Timestamp when team was soft-deleted. NULL means active. Teams are permanently deleted after 30 days along with all associated content.';
COMMENT ON COLUMN teams.owner_id IS 'User ID of the team owner (creator). Only the owner can delete or restore the team.';