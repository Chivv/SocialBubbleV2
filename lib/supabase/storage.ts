import { createClient } from '@/lib/supabase/client';

const PROFILE_PICTURES_BUCKET = 'profile-pictures';
const INTRODUCTION_VIDEOS_BUCKET = 'introduction-videos';

export async function uploadProfilePicture(file: File, userId: string): Promise<string | null> {
  try {
    console.log('Uploading profile picture via API:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/profile-picture', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Upload API error:', error);
      return null;
    }

    const data = await response.json();
    console.log('Upload successful:', data.url);
    return data.url;
  } catch (err) {
    console.error('Unexpected error in uploadProfilePicture:', err);
    return null;
  }
}

export async function uploadIntroductionVideo(file: File, userId: string): Promise<string | null> {
  try {
    console.log('Uploading introduction video via API:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/introduction-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Upload API error:', error);
      return null;
    }

    const data = await response.json();
    console.log('Upload successful:', data.url);
    return data.url;
  } catch (err) {
    console.error('Unexpected error in uploadIntroductionVideo:', err);
    return null;
  }
}

export async function deleteProfilePicture(url: string): Promise<boolean> {
  if (!url) return true;
  
  try {
    const supabase = createClient();
    
    // Extract file path from URL
    const urlParts = url.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Gets 'creators/filename'
    
    console.log('Deleting profile picture:', { url, filePath });
    
    // For now, we'll skip deletion since it requires admin access
    // In production, you'd want to create an API route for deletion too
    console.log('Note: File deletion requires admin access. Implement /api/upload/delete route.');
    
    return true;
  } catch (err) {
    console.error('Unexpected error in deleteProfilePicture:', err);
    return false;
  }
}

export async function deleteIntroductionVideo(url: string): Promise<boolean> {
  if (!url) return true;
  
  try {
    const supabase = createClient();
    
    // Extract file path from URL
    const urlParts = url.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Gets 'creators/filename'
    
    console.log('Deleting introduction video:', { url, filePath });
    
    // For now, we'll skip deletion since it requires admin access
    // In production, you'd want to create an API route for deletion too
    console.log('Note: File deletion requires admin access. Implement /api/upload/delete route.');
    
    return true;
  } catch (err) {
    console.error('Unexpected error in deleteIntroductionVideo:', err);
    return false;
  }
}