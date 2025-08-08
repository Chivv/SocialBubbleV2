'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { CreativeStrategyStatus, CreativeStrategy, CreativeStrategyComment } from '@/types';

export async function getCreativeStrategyByClient(clientId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();
    
    // Check if user is client for this specific client
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('clerk_user_id', user.id)
      .eq('client_id', clientId)
      .single();
    
    const isSocialBubble = roleData?.role === 'social_bubble';
    const isClientUser = !!clientUser;
    
    if (!isSocialBubble && !isClientUser) {
      throw new Error('Unauthorized');
    }
    
    // Get creative strategy
    const { data: strategy, error } = await supabase
      .from('creative_strategies')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('client_id', clientId)
      .single();
    
    if (error) {
      console.error('Error fetching creative strategy:', error);
      return null;
    }
    
    // If client user, check if they can view it
    if (!isSocialBubble && strategy && 
        !['sent_client_feedback', 'client_feedback_given', 'approved'].includes(strategy.status)) {
      return null; // Client can't view this status
    }
    
    return strategy as CreativeStrategy;
  } catch (error) {
    console.error('Error in getCreativeStrategyByClient:', error);
    return null;
  }
}

export async function updateCreativeStrategy(id: string, data: {
  content?: any | string;
  status?: CreativeStrategyStatus;
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
      throw new Error('Unauthorized: Only Social Bubble team members can edit creative strategies');
    }

    // Prepare update data with proper content handling
    const updateData: any = {};
    
    if (data.content !== undefined) {
      // Ensure content is properly structured for JSONB
      updateData.content = typeof data.content === 'string' 
        ? JSON.parse(data.content) 
        : data.content;
    }
    
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    // Update the creative strategy
    const { data: strategy, error } = await supabase
      .from('creative_strategies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update creative strategy: ${error.message}`);
    }

    revalidatePath('/dashboard/creative-strategies');
    revalidatePath(`/dashboard/creative-strategies/${strategy.client_id}`);
    
    return { success: true, strategy };
  } catch (error) {
    console.error('Error updating creative strategy:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update creative strategy' 
    };
  }
}

export async function getCreativeStrategies() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Check if user has social_bubble role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'social_bubble') {
      throw new Error('Unauthorized');
    }

    const { data: strategies, error } = await supabase
      .from('creative_strategies')
      .select(`
        *,
        client:clients(id, company_name)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching creative strategies:', error);
      throw error;
    }

    return strategies as CreativeStrategy[];
  } catch (error) {
    console.error('Error in getCreativeStrategies:', error);
    return [];
  }
}

export async function addComment(strategyId: string, content: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Determine user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();
    
    const userRole = roleData?.role === 'social_bubble' ? 'social_bubble' : 'client';
    
    // Create comment
    const { data: comment, error } = await supabase
      .from('creative_strategy_comments')
      .insert({
        creative_strategy_id: strategyId,
        user_id: user.id,
        user_role: userRole,
        content
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw new Error(`Failed to add comment: ${error.message}`);
    }

    revalidatePath(`/dashboard/creative-strategies`);
    revalidatePath(`/dashboard/creative-strategy`);
    
    return { success: true, comment };
  } catch (error) {
    console.error('Error in addComment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add comment' 
    };
  }
}

export async function getComments(strategyId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    const { data: comments, error } = await supabase
      .from('creative_strategy_comments')
      .select('*')
      .eq('creative_strategy_id', strategyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    // Return comments without user enhancement for now
    // User info will be fetched on the client side or in the page component
    const enhancedComments = comments;

    return enhancedComments as CreativeStrategyComment[];
  } catch (error) {
    console.error('Error in getComments:', error);
    return [];
  }
}

export async function updateCreativeStrategyStatus(id: string, status: CreativeStrategyStatus) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();
    
    const isSocialBubble = roleData?.role === 'social_bubble';
    
    // Get current strategy to check permissions
    const { data: currentStrategy } = await supabase
      .from('creative_strategies')
      .select('status, client_id')
      .eq('id', id)
      .single();
    
    if (!currentStrategy) {
      throw new Error('Creative strategy not found');
    }
    
    // Client users can only change status from sent_client_feedback to client_feedback_given or approved
    if (!isSocialBubble) {
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('clerk_user_id', user.id)
        .eq('client_id', currentStrategy.client_id)
        .single();
      
      if (!clientUser) {
        throw new Error('Unauthorized');
      }
      
      if (currentStrategy.status !== 'sent_client_feedback' || 
          (status !== 'client_feedback_given' && status !== 'approved')) {
        throw new Error('Invalid status transition for client user');
      }
    }
    
    // Update status
    const { error } = await supabase
      .from('creative_strategies')
      .update({ status })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }

    revalidatePath('/dashboard/creative-strategies');
    revalidatePath('/dashboard/creative-strategy');
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateCreativeStrategyStatus:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update status' 
    };
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

export async function createCreativeStrategyIfNotExists(clientId: string) {
  try {
    const user = await currentUser();
    if (!user) throw new Error('Not authenticated');

    const supabase = createServiceClient();
    
    // Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();
    
    if (!roleData || roleData.role !== 'social_bubble') {
      throw new Error('Unauthorized: Only Social Bubble team members can create creative strategies');
    }

    // Check if strategy already exists
    const { data: existingStrategy } = await supabase
      .from('creative_strategies')
      .select('id')
      .eq('client_id', clientId)
      .single();

    if (existingStrategy) {
      return { success: true, created: false };
    }

    // Get creative strategy template from global placeholders
    const { data: templatePlaceholder } = await supabase
      .from('global_placeholders')
      .select('content')
      .eq('key', 'creative_strategy_template')
      .single();

    const content = templatePlaceholder?.content || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }]
    };

    // Create new strategy
    const { data: newStrategy, error } = await supabase
      .from('creative_strategies')
      .insert({
        client_id: clientId,
        content: content, // Content is already an object from the template
        status: 'draft',
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/creative-strategies');
    revalidatePath(`/dashboard/creative-strategies/${clientId}`);
    
    return { success: true, created: true, strategy: newStrategy };
  } catch (error) {
    console.error('Error creating creative strategy:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create creative strategy' 
    };
  }
}