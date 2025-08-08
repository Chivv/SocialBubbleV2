'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { GlobalPlaceholder, BriefingTemplate } from '@/types';

// Global Placeholders Actions
export async function getGlobalPlaceholders(): Promise<GlobalPlaceholder[]> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('global_placeholders')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching global placeholders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getGlobalPlaceholders:', error);
    return [];
  }
}

// Get placeholders for creative agenda (includes globals and creative_agenda prefixed ones)
export async function getCreativeAgendaPlaceholders(): Promise<GlobalPlaceholder[]> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('global_placeholders')
      .select('*')
      .or('key.eq.creative_agenda_default_concept,key.like.briefing_%,key.like.creative_strategy_%')
      .order('name');

    if (error) {
      console.error('Error fetching creative agenda placeholders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCreativeAgendaPlaceholders:', error);
    return [];
  }
}

export async function updateGlobalPlaceholder(id: string, content: any | string) {
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
      throw new Error('Unauthorized: Only Social Bubble team members can edit placeholders');
    }

    // Ensure content is properly structured for JSONB
    const contentToSave = typeof content === 'string' 
      ? JSON.parse(content) 
      : content;

    const { error } = await supabase
      .from('global_placeholders')
      .update({ content: contentToSave })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update placeholder: ${error.message}`);
    }

    revalidatePath('/dashboard/settings/placeholders');
    return { success: true };
  } catch (error) {
    console.error('Error updating placeholder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update placeholder' 
    };
  }
}

// Briefing Templates Actions
export async function getBriefingTemplates(): Promise<BriefingTemplate[]> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('briefing_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching briefing templates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBriefingTemplates:', error);
    return [];
  }
}

export async function getDefaultBriefingTemplate(): Promise<BriefingTemplate | null> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('briefing_templates')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) {
      console.error('Error fetching default template:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getDefaultBriefingTemplate:', error);
    return null;
  }
}

export async function createBriefingTemplate(data: {
  name: string;
  content: any | string;
  is_default?: boolean;
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
      throw new Error('Unauthorized: Only Social Bubble team members can create templates');
    }

    // If setting as default, unset other defaults first
    if (data.is_default) {
      await supabase
        .from('briefing_templates')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    // Ensure content is properly structured for JSONB
    const contentToSave = typeof data.content === 'string' 
      ? JSON.parse(data.content) 
      : data.content;

    const { data: template, error } = await supabase
      .from('briefing_templates')
      .insert({
        ...data,
        content: contentToSave
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create template: ${error.message}`);
    }

    revalidatePath('/dashboard/settings/templates');
    return { success: true, template };
  } catch (error) {
    console.error('Error creating template:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create template' 
    };
  }
}

export async function updateBriefingTemplate(id: string, data: {
  name?: string;
  content?: any | string;
  is_default?: boolean;
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
      throw new Error('Unauthorized: Only Social Bubble team members can edit templates');
    }

    // If setting as default, unset other defaults first
    if (data.is_default) {
      await supabase
        .from('briefing_templates')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', id);
    }

    // Prepare update data with proper content handling
    const updateData: any = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.content !== undefined) {
      // Ensure content is properly structured for JSONB
      updateData.content = typeof data.content === 'string' 
        ? JSON.parse(data.content) 
        : data.content;
    }
    
    if (data.is_default !== undefined) {
      updateData.is_default = data.is_default;
    }

    const { error } = await supabase
      .from('briefing_templates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update template: ${error.message}`);
    }

    revalidatePath('/dashboard/settings/templates');
    return { success: true };
  } catch (error) {
    console.error('Error updating template:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update template' 
    };
  }
}

export async function deleteBriefingTemplate(id: string) {
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
      throw new Error('Unauthorized: Only Social Bubble team members can delete templates');
    }

    // Check if it's the default template
    const { data: template } = await supabase
      .from('briefing_templates')
      .select('is_default')
      .eq('id', id)
      .single();

    if (template?.is_default) {
      throw new Error('Cannot delete the default template');
    }

    const { error } = await supabase
      .from('briefing_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }

    revalidatePath('/dashboard/settings/templates');
    return { success: true };
  } catch (error) {
    console.error('Error deleting template:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete template' 
    };
  }
}