import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const INTRODUCTION_VIDEOS_BUCKET = 'introduction-videos';

export const maxDuration = 60; // Maximum function duration in seconds
export const dynamic = 'force-dynamic';

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

    // Validate file size (500MB)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 500MB' }, { status: 400 });
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `creators/${fileName}`;

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase using admin client
    const { data, error } = await supabaseAdmin.storage
      .from(INTRODUCTION_VIDEOS_BUCKET)
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
      .from(INTRODUCTION_VIDEOS_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}