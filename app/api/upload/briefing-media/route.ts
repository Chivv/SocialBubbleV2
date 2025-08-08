import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const BRIEFING_MEDIA_BUCKET = 'briefing-media';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (images and videos)
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const validTypes = [...validImageTypes, ...validVideoTypes];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (20MB for images, 100MB for videos)
    const isVideo = validVideoTypes.includes(file.type);
    const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${isVideo ? '100MB' : '20MB'}` 
      }, { status: 400 });
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `media/${fileName}`;

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if bucket exists, create if it doesn't
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BRIEFING_MEDIA_BUCKET);

    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(BRIEFING_MEDIA_BUCKET, {
        public: true,
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return NextResponse.json({ error: 'Storage setup failed' }, { status: 500 });
      }
    }

    // Upload to Supabase using admin client
    const { data, error } = await supabaseAdmin.storage
      .from(BRIEFING_MEDIA_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Storage error:', error);
      return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BRIEFING_MEDIA_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}