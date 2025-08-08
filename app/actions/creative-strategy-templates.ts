'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { CreativeStrategyTemplate } from '@/types';

export async function getDefaultCreativeStrategyTemplate() {
  try {
    const supabase = createServiceClient();
    
    const { data: template, error } = await supabase
      .from('creative_strategy_templates')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching default template:', error);
      throw error;
    }

    return template as CreativeStrategyTemplate | null;
  } catch (error) {
    console.error('Error in getDefaultCreativeStrategyTemplate:', error);
    return null;
  }
}

export async function createCreativeStrategyTemplate(data: {
  name: string;
  content: any;
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
        .from('creative_strategy_templates')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const { data: template, error } = await supabase
      .from('creative_strategy_templates')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return { success: true, template };
  } catch (error) {
    console.error('Error in createCreativeStrategyTemplate:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create template' 
    };
  }
}

export async function updateCreativeStrategyTemplate(id: string, data: {
  name?: string;
  content?: any;
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
      throw new Error('Unauthorized: Only Social Bubble team members can update templates');
    }

    // If setting as default, unset other defaults first
    if (data.is_default) {
      await supabase
        .from('creative_strategy_templates')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', id);
    }

    const { data: template, error } = await supabase
      .from('creative_strategy_templates')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return { success: true, template };
  } catch (error) {
    console.error('Error in updateCreativeStrategyTemplate:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update template' 
    };
  }
}