-- Add soft delete functionality to annotations
-- This allows annotations to be recoverable for 30 days

-- Add deleted_at column to annotations table
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on non-deleted annotations
CREATE INDEX IF NOT EXISTS idx_annotations_deleted_at ON annotations(deleted_at);

-- Update RLS policies to filter out soft-deleted annotations by default

-- Drop existing select policy
DROP POLICY IF EXISTS "Team members can view annotations" ON annotations;

-- Create new select policy that excludes soft-deleted annotations
CREATE POLICY "Team members can view non-deleted annotations" ON annotations
FOR SELECT USING (
  deleted_at IS NULL 
  AND EXISTS (
    SELECT 1 FROM team_videos_access
    WHERE team_videos_access.video_id = annotations.video_id
    AND team_videos_access.user_id = auth.uid()
  )
);

-- Create policy for viewing soft-deleted annotations (coaches only)
CREATE POLICY "Coaches can view deleted annotations" ON annotations
FOR SELECT USING (
  deleted_at IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM team_videos_access
    WHERE team_videos_access.video_id = annotations.video_id
    AND team_videos_access.user_id = auth.uid()
    AND team_videos_access.role = 'coach'
  )
);

-- Update delete policy to check permissions
DROP POLICY IF EXISTS "Team members can delete annotations" ON annotations;

-- Only coaches and annotation creators can delete
CREATE POLICY "Coaches and creators can delete annotations" ON annotations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM team_videos_access
    WHERE team_videos_access.video_id = annotations.video_id
    AND team_videos_access.user_id = auth.uid()
    AND (team_videos_access.role = 'coach' OR annotations.created_by = auth.uid())
  )
);

-- Create function to permanently delete old soft-deleted annotations
CREATE OR REPLACE FUNCTION cleanup_deleted_annotations()
RETURNS void AS $$
BEGIN
  -- Permanently delete annotations soft-deleted more than 30 days ago
  DELETE FROM annotations 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup daily (requires pg_cron extension)
-- Note: This would need to be set up separately in Supabase dashboard
-- SELECT cron.schedule('cleanup-deleted-annotations', '0 2 * * *', 'SELECT cleanup_deleted_annotations();');

-- Add comment to document the soft delete behavior
COMMENT ON COLUMN annotations.deleted_at IS 'Timestamp when annotation was soft-deleted. NULL means active. Annotations are permanently deleted after 30 days.';