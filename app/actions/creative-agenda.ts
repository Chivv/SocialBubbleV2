'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { 
  CreativeAgendaCard, 
  CreativeAgendaComment,
  Department,
  ConceptingStatus,
  EditingStatus,
  PublicationStatus,
  CardType,
  VideoType,
  FormatType
} from '@/types';
import { clerkClient } from '@clerk/nextjs/server';

// Helper function to check if user has social_bubble role
async function checkSocialBubbleRole(userId: string) {
  const supabase = createServiceClient();
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single();
  
  return roleData?.role === 'social_bubble';
}

// Get cards by department
export async function getCardsByDepartment(department: Department): Promise<CreativeAgendaCard[]> {
  try {
    const user = await currentUser();
    if (!user || !(await checkSocialBubbleRole(user.id))) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: cards, error } = await supabase
      .from('creative_agenda_cards')
      .select(`
        *,
        client:clients(*),
        briefing:briefings(*),
        casting:castings(*),
        creator:creators(*),
        properties:creative_agenda_card_properties(*)
      `)
      .eq('department', department)
      .order('deadline', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching cards:', error);
      throw error;
    }

    return cards as CreativeAgendaCard[];
  } catch (error) {
    console.error('Error in getCardsByDepartment:', error);
    return [];
  }
}

// Create concept card
export async function createConceptCard(data: {
  client_id: string;
  title: string;
  content?: any | string;
  deadline?: string;
  properties?: {
    frame_link?: string;
    example_video_url?: string;
    video_type?: VideoType;
    format?: FormatType;
  };
}) {
  try {
    const user = await currentUser();
    if (!user || !(await checkSocialBubbleRole(user.id))) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    // Ensure content is properly structured for JSONB
    const contentToSave = data.content 
      ? (typeof data.content === 'string' ? JSON.parse(data.content) : data.content)
      : { type: 'doc', content: [{ type: 'paragraph' }] };

    // Create the card
    const { data: card, error: cardError } = await supabase
      .from('creative_agenda_cards')
      .insert({
        card_type: 'concept' as CardType,
        client_id: data.client_id,
        department: 'concepting' as Department,
        status: 'to_do',
        title: data.title,
        content: contentToSave,
        deadline: data.deadline,
        created_by: user.id
      })
      .select()
      .single();

    if (cardError) throw cardError;

    // Create properties if provided
    if (data.properties && card) {
      const { error: propsError } = await supabase
        .from('creative_agenda_card_properties')
        .insert({
          card_id: card.id,
          ...data.properties
        });

      if (propsError) throw propsError;
    }

    // Record in history
    await supabase
      .from('creative_agenda_status_history')
      .insert({
        card_id: card.id,
        to_department: 'concepting',
        to_status: 'to_do',
        changed_by: user.id,
        reason: 'Card created'
      });

    revalidatePath('/dashboard/creative-agenda');
    return { success: true, card };
  } catch (error) {
    console.error('Error creating concept card:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create card' 
    };
  }
}

// Update card status
export async function updateCardStatus(
  cardId: string, 
  newStatus: string,
  newDepartment?: Department
) {
  try {
    const user = await currentUser();
    if (!user || !(await checkSocialBubbleRole(user.id))) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    // Get current card state
    const { data: currentCard } = await supabase
      .from('creative_agenda_cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (!currentCard) throw new Error('Card not found');

    // Validate status transition
    const isValidTransition = validateStatusTransition(
      currentCard.department as Department,
      currentCard.status,
      newStatus,
      newDepartment
    );

    if (!isValidTransition) {
      throw new Error('Invalid status transition');
    }

    // Determine if we need to move departments
    const targetDepartment = newDepartment || currentCard.department;
    const shouldTransition = shouldAutoTransition(targetDepartment as Department, newStatus);

    // Update the card
    const updateData: any = {
      status: newStatus,
      department: targetDepartment
    };

    // Handle auto-transitions
    if (shouldTransition) {
      const nextDept = getNextDepartment(targetDepartment as Department);
      if (nextDept) {
        updateData.department = nextDept;
        updateData.status = 'to_do';
      }
    }

    const { error: updateError } = await supabase
      .from('creative_agenda_cards')
      .update(updateData)
      .eq('id', cardId);

    if (updateError) throw updateError;

    // Record in history
    await supabase
      .from('creative_agenda_status_history')
      .insert({
        card_id: cardId,
        from_department: currentCard.department,
        to_department: updateData.department,
        from_status: currentCard.status,
        to_status: updateData.status,
        changed_by: user.id,
        reason: shouldTransition ? 'Auto-transition after approval' : 'Manual status update'
      });

    revalidatePath('/dashboard/creative-agenda');
    return { success: true };
  } catch (error) {
    console.error('Error updating card status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update status' 
    };
  }
}

// Update card content
export async function updateCardContent(
  cardId: string,
  content: any | string,
  title?: string,
  deadline?: string
) {
  try {
    const user = await currentUser();
    if (!user || !(await checkSocialBubbleRole(user.id))) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    // Ensure content is properly structured for JSONB (same as briefings/creative strategies)
    const contentToSave = typeof content === 'string' 
      ? JSON.parse(content) 
      : content;
    
    const updateData: any = {
      content: contentToSave,
      last_edited_by: user.id,
      last_edited_at: new Date().toISOString()
    };

    if (title !== undefined) {
      updateData.title = title;
    }

    if (deadline !== undefined) {
      updateData.deadline = deadline;
    }

    const { error } = await supabase
      .from('creative_agenda_cards')
      .update(updateData)
      .eq('id', cardId);

    if (error) throw error;

    revalidatePath('/dashboard/creative-agenda');
    revalidatePath(`/dashboard/creative-agenda/card/${cardId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating card content:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update content' 
    };
  }
}

// Update concept card properties
export async function updateConceptCardProperties(
  cardId: string,
  properties: {
    frame_link?: string;
    example_video_url?: string;
    video_type?: VideoType;
    format?: FormatType;
  }
) {
  try {
    const user = await currentUser();
    if (!user || !(await checkSocialBubbleRole(user.id))) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    // Check if properties exist
    const { data: existing } = await supabase
      .from('creative_agenda_card_properties')
      .select('id')
      .eq('card_id', cardId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('creative_agenda_card_properties')
        .update(properties)
        .eq('card_id', cardId);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('creative_agenda_card_properties')
        .insert({
          card_id: cardId,
          ...properties
        });

      if (error) throw error;
    }

    revalidatePath('/dashboard/creative-agenda');
    revalidatePath(`/dashboard/creative-agenda/card/${cardId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating card properties:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update properties' 
    };
  }
}

// Get card details
export async function getCardDetails(cardId: string): Promise<CreativeAgendaCard | null> {
  try {
    const user = await currentUser();
    if (!user || !(await checkSocialBubbleRole(user.id))) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: card, error } = await supabase
      .from('creative_agenda_cards')
      .select(`
        *,
        client:clients(*),
        briefing:briefings(*),
        casting:castings(*),
        creator:creators(*),
        properties:creative_agenda_card_properties(*)
      `)
      .eq('id', cardId)
      .single();

    if (error) {
      console.error('Error fetching card details:', error);
      return null;
    }

    return card as CreativeAgendaCard;
  } catch (error) {
    console.error('Error in getCardDetails:', error);
    return null;
  }
}

// Get card comments
export async function getCardComments(cardId: string): Promise<CreativeAgendaComment[]> {
  try {
    const user = await currentUser();
    if (!user || !(await checkSocialBubbleRole(user.id))) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: comments, error } = await supabase
      .from('creative_agenda_comments')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    // Fetch user details from Clerk
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
    console.error('Error in getCardComments:', error);
    return [];
  }
}

// Add comment to card
export async function addCardComment(cardId: string, content: string) {
  try {
    const user = await currentUser();
    if (!user || !(await checkSocialBubbleRole(user.id))) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();
    
    const { data: comment, error } = await supabase
      .from('creative_agenda_comments')
      .insert({
        card_id: cardId,
        user_id: user.id,
        user_role: 'social_bubble',
        content
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/creative-agenda');
    return { success: true, comment };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add comment' 
    };
  }
}

// Helper functions
function validateStatusTransition(
  currentDept: Department,
  currentStatus: string,
  newStatus: string,
  newDepartment?: Department
): boolean {
  // If changing departments, validate that it's allowed
  if (newDepartment && newDepartment !== currentDept) {
    // Only allow moving to next department if current status is approved
    return currentStatus === 'approved' && isValidNextDepartment(currentDept, newDepartment);
  }

  // Otherwise validate status within department
  return isValidStatusForDepartment(currentDept, newStatus);
}

function isValidNextDepartment(current: Department, next: Department): boolean {
  const transitions: Record<Department, Department | null> = {
    'concepting': 'editing',
    'editing': 'publication',
    'publication': null
  };
  
  return transitions[current] === next;
}

function isValidStatusForDepartment(dept: Department, status: string): boolean {
  const validStatuses: Record<Department, string[]> = {
    'concepting': ['to_do', 'in_progress', 'waiting_internal_feedback', 'internal_feedback_given', 'sent_client_feedback', 'approved'],
    'editing': ['to_do', 'in_progress', 'waiting_internal_feedback', 'internal_feedback_given', 'approved'],
    'publication': ['waiting_client_feedback', 'client_feedback_given', 'client_feedback_processed', 'media_buying', 'done']
  };
  
  return validStatuses[dept]?.includes(status) || false;
}

function shouldAutoTransition(dept: Department, status: string): boolean {
  return status === 'approved' && dept !== 'publication';
}

function getNextDepartment(current: Department): Department | null {
  const transitions: Record<Department, Department | null> = {
    'concepting': 'editing',
    'editing': 'publication',
    'publication': null
  };
  
  return transitions[current];
}

