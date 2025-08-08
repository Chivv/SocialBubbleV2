-- Add Google Drive folder fields to clients table
ALTER TABLE clients 
ADD COLUMN drive_folder_id TEXT,
ADD COLUMN drive_folder_url TEXT;

-- Add Google Drive folder fields to creator_submissions table
ALTER TABLE creator_submissions
ADD COLUMN drive_folder_id TEXT,
ADD COLUMN drive_folder_url TEXT,
ADD COLUMN drive_folder_created_at TIMESTAMP WITH TIME ZONE;

-- Add index for drive folder lookups
CREATE INDEX idx_clients_drive_folder_id ON clients(drive_folder_id);
CREATE INDEX idx_creator_submissions_drive_folder_id ON creator_submissions(drive_folder_id);

-- Add comment for clarity
COMMENT ON COLUMN clients.drive_folder_id IS 'Google Drive folder ID for the client''s main content folder';
COMMENT ON COLUMN clients.drive_folder_url IS 'Full URL to the client''s Google Drive folder';
COMMENT ON COLUMN creator_submissions.drive_folder_id IS 'Google Drive folder ID for this creator''s submission folder';
COMMENT ON COLUMN creator_submissions.drive_folder_url IS 'Full URL to the creator''s submission folder';
COMMENT ON COLUMN creator_submissions.drive_folder_created_at IS 'Timestamp when the Drive folder was created';