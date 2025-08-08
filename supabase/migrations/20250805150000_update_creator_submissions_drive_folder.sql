-- Update existing creator submissions to use drive_folder_url instead of content_upload_link
UPDATE creator_submissions
SET content_upload_link = drive_folder_url
WHERE drive_folder_url IS NOT NULL AND content_upload_link = 'https://drive.google.com/test-submission';

-- Remove any test submission URLs
UPDATE creator_submissions
SET content_upload_link = NULL
WHERE content_upload_link = 'https://drive.google.com/test-submission';

-- Add a comment to indicate content_upload_link is deprecated
COMMENT ON COLUMN creator_submissions.content_upload_link IS 'DEPRECATED: Use drive_folder_url instead. This field is kept for backwards compatibility.';