-- Make organization_id optional for teams to support independent teams
ALTER TABLE teams 
ALTER COLUMN organization_id DROP NOT NULL;

-- Update the teams table comment
COMMENT ON COLUMN teams.organization_id IS 'Optional organization/club ID. Teams can exist independently without an organization.';