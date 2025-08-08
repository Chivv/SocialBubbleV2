-- Storage Policies for Creator File Uploads
-- Run this in your Supabase SQL Editor

-- First, ensure the buckets exist and are public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('introduction-videos', 'introduction-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist (to start fresh)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- PROFILE PICTURES POLICIES

-- 1. Allow authenticated users to upload files to profile-pictures bucket
CREATE POLICY "Allow authenticated users to upload profile pictures" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = 'creators'
);

-- 2. Allow public to view all files in profile-pictures bucket
CREATE POLICY "Allow public to view profile pictures" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-pictures');

-- 3. Allow authenticated users to update their own files
CREATE POLICY "Allow users to update own profile pictures" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- 4. Allow authenticated users to delete their own files
CREATE POLICY "Allow users to delete own profile pictures" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- INTRODUCTION VIDEOS POLICIES

-- 1. Allow authenticated users to upload files to introduction-videos bucket
CREATE POLICY "Allow authenticated users to upload introduction videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'introduction-videos' AND
  (storage.foldername(name))[1] = 'creators'
);

-- 2. Allow public to view all files in introduction-videos bucket
CREATE POLICY "Allow public to view introduction videos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'introduction-videos');

-- 3. Allow authenticated users to update their own files
CREATE POLICY "Allow users to update own introduction videos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'introduction-videos' AND
  auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'introduction-videos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- 4. Allow authenticated users to delete their own files
CREATE POLICY "Allow users to delete own introduction videos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'introduction-videos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';