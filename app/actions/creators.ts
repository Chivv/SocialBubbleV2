'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Creator } from '@/types';
import { triggerAutomation } from '@/lib/automations/service';
import { revalidatePath } from 'next/cache';

// Get all creators (for Social Bubble)
export async function getCreators() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Check user role - only social_bubble can view all creators
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'social_bubble') {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching creators:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCreators:', error);
    return [];
  }
}

// Get creator by ID (for viewing profiles)
export async function getCreatorById(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Check user role - only social_bubble and client users can view creator profiles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (!roleData || !['social_bubble', 'client'].includes(roleData.role)) {
      throw new Error('Unauthorized');
    }

    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching creator:', error);
      throw error;
    }

    return creator as Creator;
  } catch (error) {
    console.error('Error in getCreatorById:', error);
    return null;
  }
}

// Trigger automation when creator signs up
export async function triggerCreatorSignupAutomation(creatorData: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  primary_language: string;
  profile_picture_url: string | null;
  introduction_video_url: string | null;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check if this creator was imported
    const supabase = createServiceClient();
    const { data: importedCreator } = await supabase
      .from('creator_import_list')
      .select('id')
      .eq('email', creatorData.email)
      .single();

    const signupSource = importedCreator ? 'import_invitation' : 'organic';

    // Trigger the automation
    await triggerAutomation('creator_signed_up', {
      creatorId: creatorData.id,
      creatorName: `${creatorData.first_name} ${creatorData.last_name}`.trim(),
      creatorEmail: creatorData.email,
      creatorPhone: creatorData.phone,
      primaryLanguage: creatorData.primary_language,
      hasProfilePicture: !!creatorData.profile_picture_url,
      hasIntroductionVideo: !!creatorData.introduction_video_url,
      signupSource: signupSource,
      signupDate: new Date().toISOString()
    }, {
      executedBy: user.emailAddresses?.[0]?.emailAddress
    });

    // Also update the import list if this was an imported creator
    if (importedCreator) {
      await supabase
        .from('creator_import_list')
        .update({ signed_up_at: new Date().toISOString() })
        .eq('email', creatorData.email);
    }

    return { success: true };
  } catch (error) {
    console.error('Error triggering creator signup automation:', error);
    // Don't throw - we don't want to block the signup flow
    return { success: false, error: error instanceof Error ? error.message : 'Failed to trigger automation' };
  }
}