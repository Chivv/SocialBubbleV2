UPDATE storage.buckets 
SET file_size_limit = 524288000,
    allowed_mime_types = ARRAY['video/*'] -- NULL allows all file types
WHERE id = 'introduction-videos';