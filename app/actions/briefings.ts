'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { BriefingStatus, BriefingComment } from '@/types';
import { clerkClient } from '@clerk/nextjs/server';
import { handleBriefingApproved } from './casting-briefings';

export async function createBriefing(data: {
  title: string;
  client_id: string;
  content: any | string;
  status?: BriefingStatus;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Create Supabase client with service role to bypass RLS
    const supabase = createServiceClient();
    
    // First check if user has social_bubble role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'social_bubble') {
      throw new Error('Unauthorized: Only Social Bubble team members can create briefings');
    }

    // Ensure content is properly structured for JSONB
    const contentToSave = typeof data.content === 'string' 
      ? JSON.parse(data.content) 
      : data.content;

    // Create the briefing
    const { data: briefing, error } = await supabase
      .from('briefings')
      .insert({
        title: data.title,
        client_id: data.client_id,
        content: contentToSave,
        created_by: user.id,
        status: data.status || 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create briefing: ${error.message}`);
    }

    revalidatePath('/dashboard/briefings');
    return { success: true, briefing };
  } catch (error) {
    console.error('Error creating briefing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create briefing' 
    };
  }
}

export async function getBriefings() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get user's role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (roleError || !roleData) {
      throw new Error('User role not found');
    }

    let query = supabase
      .from('briefings')
      .select(`
        *,
        client:clients(company_name)
      `)
      .order('created_at', { ascending: false });

    // If client user, filter by their client_id
    if (roleData.role === 'client') {
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('clerk_user_id', user.id)
        .single();

      if (clientUser) {
        query = query.eq('client_id', clientUser.client_id);
      }
    }

    const { data: briefings, error } = await query;

    if (error) {
      console.error('Error fetching briefings:', error);
      throw error;
    }

    return briefings || [];
  } catch (error) {
    console.error('Error in getBriefings:', error);
    return [];
  }
}

export async function getBriefingById(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get user's role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (roleError || !roleData) {
      throw new Error('User role not found');
    }

    const { data: briefing, error } = await supabase
      .from('briefings')
      .select(`
        *,
        client:clients(company_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching briefing:', error);
      throw error;
    }

    // Check if client user has access to this briefing
    if (roleData.role === 'client') {
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('clerk_user_id', user.id)
        .single();

      if (!clientUser || clientUser.client_id !== briefing.client_id) {
        return null; // Client doesn't have access to this briefing
      }
    }

    return briefing;
  } catch (error) {
    console.error('Error in getBriefingById:', error);
    return null;
  }
}

export async function getClients() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('company_name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return clients || [];
  } catch (error) {
    console.error('Error in getClients:', error);
    return [];
  }
}

export async function updateBriefing(id: string, data: {
  title: string;
  client_id: string;
  content: any | string;
  status?: BriefingStatus;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Check if user has social_bubble role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'social_bubble') {
      throw new Error('Unauthorized: Only Social Bubble team members can edit briefings');
    }

    // Get current briefing status before update
    const { data: currentBriefing } = await supabase
      .from('briefings')
      .select('status')
      .eq('id', id)
      .single();
    
    const previousStatus = currentBriefing?.status;

    // Ensure content is properly structured for JSONB
    const contentToSave = typeof data.content === 'string' 
      ? JSON.parse(data.content) 
      : data.content;
    
    const updateData: any = {
      title: data.title,
      client_id: data.client_id,
      content: contentToSave,
    };
    
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const { data: briefing, error } = await supabase
      .from('briefings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update briefing: ${error.message}`);
    }

    // If status changed to approved, handle the approval logic
    if (data.status === 'approved' && previousStatus !== 'approved') {
      await handleBriefingApproved(id);
    }

    revalidatePath('/dashboard/briefings');
    revalidatePath(`/dashboard/briefings/${id}`);
    return { success: true, briefing };
  } catch (error) {
    console.error('Error updating briefing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update briefing' 
    };
  }
}

export async function getBriefingComments(briefingId: string): Promise<BriefingComment[]> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    const { data: comments, error } = await supabase
      .from('briefing_comments')
      .select('*')
      .eq('briefing_id', briefingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    // Fetch user details from Clerk for each comment
    const commentsWithUsers = await Promise.all(
      (comments || []).map(async (comment) => {
        try {
          const clerk = await clerkClient();
          const clerkUser = await clerk.users.getUser(comment.user_id);
          return {
            ...comment,
            user: {
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Unknown',
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
            },
          };
        } catch (error) {
          console.error('Error fetching user:', error);
          return {
            ...comment,
            user: {
              name: 'Unknown User',
              email: '',
            },
          };
        }
      })
    );

    return commentsWithUsers;
  } catch (error) {
    console.error('Error in getBriefingComments:', error);
    return [];
  }
}

export async function addBriefingComment(briefingId: string, content: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get user's role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (roleError || !roleData) {
      throw new Error('User role not found');
    }

    const { data: comment, error } = await supabase
      .from('briefing_comments')
      .insert({
        briefing_id: briefingId,
        user_id: user.id,
        user_role: roleData.role,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      throw error;
    }

    revalidatePath(`/dashboard/briefings/${briefingId}`);
    return { success: true, comment };
  } catch (error) {
    console.error('Error in addBriefingComment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add comment' 
    };
  }
}