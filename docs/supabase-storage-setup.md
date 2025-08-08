# Supabase Storage Setup for Creator Files

To enable file uploads for creator profiles, you need to create two storage buckets in Supabase:

## Required Storage Buckets

1. **profile-pictures**
   - For storing creator profile pictures
   - Accepted formats: JPG, PNG, GIF, WebP
   - Max file size: 5MB

2. **introduction-videos**
   - For storing creator introduction videos
   - Accepted formats: MP4, MOV, AVI
   - Max file size: 50MB

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to Storage in the sidebar
3. Click "New bucket" and create the following buckets:

### Profile Pictures Bucket
- Name: `profile-pictures`
- Public bucket: Yes (enable this)
- File size limit: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

### Introduction Videos Bucket
- Name: `introduction-videos`
- Public bucket: Yes (enable this)
- File size limit: 50MB
- Allowed MIME types: `video/*`

## Storage Policies

For both buckets, add the following RLS policies:

### Upload Policy
```sql
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = 'creators'
);
```

### View Policy
```sql
-- Allow anyone to view files
CREATE POLICY "Anyone can view files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-pictures');
```

### Delete Policy
```sql
-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = 'creators'
);
```

Apply the same policies to the `introduction-videos` bucket, just change the bucket_id.

## File Structure

Files are stored with the following structure:
- `creators/{userId}-{timestamp}.{extension}`

This ensures unique file names and easy organization by creator.