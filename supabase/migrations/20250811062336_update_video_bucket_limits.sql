-- Update introduction-videos bucket configuration for 500MB limit
-- Run this in your Supabase SQL Editor

-- Update the bucket configuration to allow 500MB files
-- Note: The file_size_limit is in bytes (500MB = 524288000 bytes)
UPDATE storage.buckets 
SET file_size_limit = 524288000,
    allowed_mime_types = NULL -- NULL allows all file types
WHERE id = 'introduction-videos';

-- Verify the update
SELECT id, name, file_size_limit, allowed_mime_types, public
FROM storage.buckets 
WHERE id = 'introduction-videos';

-- Note: If you want to restrict to video files only, use this instead:
-- UPDATE storage.buckets 
-- SET file_size_limit = 524288000,
--     allowed_mime_types = ARRAY['video/*']
-- WHERE id = 'introduction-videos';