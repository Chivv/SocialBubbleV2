'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { Casting, CastingStatus, CastingInvitation, CastingSelection, Creator } from '@/types';
import { 
  sendCastingInviteEmail,
  sendCastingApprovedWithBriefingEmail,
  sendCastingApprovedNoBriefingEmail,
  sendCastingNotSelectedEmail,
  sendCastingClosedNoResponseEmail,
  sendCastingReadyForReviewEmail
} from '@/lib/resend';
import { triggerAutomation } from '@/lib/automations/service';
import { queueEmails } from '@/lib/email-queue';
import { ensureRAWFolder, createCreatorFolder } from '@/lib/google-drive-oauth';

// Get all castings (for Social Bubble)
export async function getCastings() {
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

    const { data: castings, error } = await supabase
      .from('castings')
      .select(`
        *,
        client:clients(id, company_name),
        casting_invitations!left(
          id,
          status
        ),
        casting_selections!left(
          id,
          selected_by_role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching castings:', error);
      throw error;
    }

    // Process the data to add counts
    const processedCastings = castings?.map(casting => {
      const acceptedInvitations = casting.casting_invitations?.filter(
        (inv: any) => inv.status === 'accepted'
      ).length || 0;
      
      const allSelections = casting.casting_selections?.length || 0;
      
      return {
        ...casting,
        _count: {
          invitations: casting.casting_invitations?.length || 0,
          acceptedInvitations: acceptedInvitations,
          selections: allSelections
        }
      };
    }) || [];

    return processedCastings as Casting[];
  } catch (error) {
    console.error('Error in getCastings:', error);
    return [];
  }
}

// Get castings for client
export async function getClientCastings() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get client ID from user
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('clerk_user_id', user.id)
      .single();

    if (!clientUser) {
      throw new Error('Client user not found');
    }

    // Get castings for this client with appropriate status
    const { data: castings, error } = await supabase
      .from('castings')
      .select(`
        *,
        client:clients(id, company_name),
        casting_invitations!left(
          id
        ),
        casting_selections!left(
          id,
          selected_by_role
        )
      `)
      .eq('client_id', clientUser.client_id)
      .in('status', ['send_client_feedback', 'approved_by_client', 'shooting', 'done'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client castings:', error);
      throw error;
    }

    // Process the data to add counts
    const processedCastings = castings?.map(casting => {
      const socialBubbleSelections = casting.casting_selections?.filter(
        (sel: any) => sel.selected_by_role === 'social_bubble'
      ).length || 0;
      
      const clientSelections = casting.casting_selections?.filter(
        (sel: any) => sel.selected_by_role === 'client'
      ).length || 0;
      
      return {
        ...casting,
        _count: {
          invitations: casting.casting_invitations?.length || 0,
          selections: socialBubbleSelections, // For clients, show social bubble selections
          clientSelections: clientSelections
        }
      };
    }) || [];

    return processedCastings as Casting[];
  } catch (error) {
    console.error('Error in getClientCastings:', error);
    return [];
  }
}

// Get casting by ID
export async function getCastingById(id: string) {
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

    if (!roleData) {
      throw new Error('User role not found');
    }

    let query = supabase
      .from('castings')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .single();

    const { data: casting, error } = await query;

    if (error) {
      console.error('Error fetching casting:', error);
      throw error;
    }

    // Check permissions based on role
    if (roleData.role === 'client') {
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('clerk_user_id', user.id)
        .single();

      if (!clientUser || clientUser.client_id !== casting.client_id) {
        return null; // Client doesn't have access
      }

      // Check if status allows client access
      if (!['send_client_feedback', 'approved_by_client', 'shooting', 'done'].includes(casting.status)) {
        return null;
      }
    } else if (roleData.role === 'creator') {
      // For creators, check if they have an invitation
      const { data: invitation } = await supabase
        .from('casting_invitations')
        .select('id')
        .eq('casting_id', id)
        .eq('creator_id', user.id)
        .single();

      if (!invitation) {
        return null; // Creator doesn't have access
      }
    }

    return casting as Casting;
  } catch (error) {
    console.error('Error in getCastingById:', error);
    return null;
  }
}

// Create casting
export async function createCasting(data: {
  client_id: string;
  compensation: number;
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
      throw new Error('Unauthorized: Only Social Bubble team members can create castings');
    }

    // Create the casting (title and max_creators will be set by triggers)
    const { data: casting, error } = await supabase
      .from('castings')
      .insert({
        client_id: data.client_id,
        compensation: data.compensation,
        created_by: user.id,
        title: '', // Will be auto-generated by trigger
        max_creators: 0, // Will be set by trigger
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create casting: ${error.message}`);
    }

    revalidatePath('/dashboard/castings');
    return { success: true, casting };
  } catch (error) {
    console.error('Error creating casting:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create casting' 
    };
  }
}

// Update casting
export async function updateCasting(id: string, data: {
  compensation?: number;
  status?: CastingStatus;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get current casting data first (for status change tracking)
    const { data: existingCasting } = await supabase
      .from('castings')
      .select('status')
      .eq('id', id)
      .single();

    const previousStatus = existingCasting?.status;
    
    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (!roleData) {
      throw new Error('User role not found');
    }

    // Check permissions
    if (roleData.role === 'social_bubble') {
      // Social Bubble can update everything
    } else if (roleData.role === 'client') {
      // Clients can only update status from send_client_feedback to approved_by_client
      const { data: casting } = await supabase
        .from('castings')
        .select('status, client_id')
        .eq('id', id)
        .single();

      if (!casting) {
        throw new Error('Casting not found');
      }

      // Verify client owns this casting
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('clerk_user_id', user.id)
        .single();

      if (!clientUser || clientUser.client_id !== casting.client_id) {
        throw new Error('Unauthorized');
      }

      if (casting.status !== 'send_client_feedback' || data.status !== 'approved_by_client') {
        throw new Error('Invalid status transition');
      }

      // Remove compensation from update for clients
      delete data.compensation;
    } else {
      throw new Error('Unauthorized');
    }

    const { data: updatedCasting, error } = await supabase
      .from('castings')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        client:clients(company_name)
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update casting: ${error.message}`);
    }

    // If status changed to 'send_client_feedback', send email to client
    if (data.status === 'send_client_feedback' && updatedCasting) {
      // Get client users for this client with their emails
      const { data: clientUsers } = await supabase
        .from('client_users')
        .select('email')
        .eq('client_id', updatedCasting.client_id);

      if (clientUsers && clientUsers.length > 0) {
        // Get selections made by Social Bubble team
        const { data: selections } = await supabase
          .from('casting_selections')
          .select('id')
          .eq('casting_id', id)
          .eq('selected_by_role', 'social_bubble');

        const selectedCreatorsCount = selections?.length || 0;

        // Queue emails to client users in background
        const clientEmailTasks = clientUsers
          .filter(user => user.email)
          .map(user => ({
            recipient: user.email!,
            sendFn: () => sendCastingReadyForReviewEmail({
              to: user.email!,
              castingTitle: updatedCasting.title,
              selectedCreatorsCount,
            })
          }));

        queueEmails(clientEmailTasks);
        console.log(`Queued ${clientEmailTasks.length} review emails for client`);
      }
    }

    // Note: Email sending for shooting status is handled in selectFinalCreators
    // and in the new briefing approval/linking handlers to avoid duplicates

    // Trigger automation if status changed
    if (data.status && previousStatus !== data.status) {
      // Get additional data for the automation
      const { data: invitations } = await supabase
        .from('casting_invitations')
        .select('id, status')
        .eq('casting_id', id);

      const { data: selections } = await supabase
        .from('casting_selections')
        .select('id, selected_by_role')
        .eq('casting_id', id);

      const { data: linkedBriefings } = await supabase
        .from('casting_briefing_links')
        .select('briefing_id')
        .eq('casting_id', id);

      const totalInvited = invitations?.length || 0;
      const totalAccepted = invitations?.filter(inv => inv.status === 'accepted').length || 0;
      const chosenCreatorsCount = selections?.filter(sel => sel.selected_by_role === 'client').length || 0;
      const briefingCount = linkedBriefings?.length || 0;
      const briefingStatus = briefingCount > 0 ? 'ready' : 'not_ready';

      await triggerAutomation('casting_status_changed', {
        castingId: updatedCasting.id,
        castingTitle: updatedCasting.title,
        clientName: updatedCasting.client?.company_name || 'Unknown Client',
        previousStatus: previousStatus || 'unknown',
        newStatus: data.status,
        chosenCreatorsCount,
        totalInvited,
        totalAccepted,
        compensation: updatedCasting.compensation,
        briefingStatus,
        briefingCount,
        changedBy: user.emailAddresses?.[0]?.emailAddress || user.id,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl'
      }, {
        executedBy: user.emailAddresses?.[0]?.emailAddress
      }).catch(err => {
        console.error('Failed to trigger status change automation:', err);
      });
    }

    revalidatePath('/dashboard/castings');
    revalidatePath(`/dashboard/castings/${id}`);
    
    return { success: true, casting: updatedCasting };
  } catch (error) {
    console.error('Error updating casting:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update casting' 
    };
  }
}

// Get creators for filtering
export async function getCreatorsForCasting() {
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

    // Only Social Bubble users can see all creators
    // Clients will get an empty array since they can't invite creators
    if (!roleData || roleData.role !== 'social_bubble') {
      return [];
    }

    const { data: creators, error } = await supabase
      .from('creators')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching creators:', error);
      throw error;
    }

    return creators as Creator[];
  } catch (error) {
    console.error('Error in getCreatorsForCasting:', error);
    return [];
  }
}

// Send invitations to creators
export async function sendCastingInvitations(castingId: string, creatorIds: string[]) {
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

    // Get casting details with client info
    const { data: casting } = await supabase
      .from('castings')
      .select(`
        *,
        client:clients(company_name, drive_folder_id, drive_folder_url)
      `)
      .eq('id', castingId)
      .single();

    if (!casting) {
      throw new Error('Casting not found');
    }

    // Get creator details for the selected creators
    const { data: creators } = await supabase
      .from('creators')
      .select('id, email, first_name, last_name')
      .in('id', creatorIds);

    if (!creators || creators.length === 0) {
      throw new Error('No creators found');
    }

    // Update casting status to inviting
    await supabase
      .from('castings')
      .update({ status: 'inviting' })
      .eq('id', castingId)
      .eq('status', 'draft');

    // Create invitations
    const invitations = creatorIds.map(creatorId => ({
      casting_id: castingId,
      creator_id: creatorId,
    }));

    const { error } = await supabase
      .from('casting_invitations')
      .insert(invitations);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to send invitations: ${error.message}`);
    }

    // Queue email invitations to be sent in the background
    const emailTasks = creators.map(creator => ({
      recipient: creator.email,
      sendFn: () => sendCastingInviteEmail({
        to: creator.email,
        creatorName: creator.first_name,
        castingTitle: casting.title,
        clientName: casting.client?.company_name || 'Unknown Client',
        compensation: casting.compensation,
        responseDeadline: null, // You can add a deadline field to castings if needed
      })
    }));

    // Queue emails to be sent in background with rate limiting
    queueEmails(emailTasks);
    console.log(`Queued ${emailTasks.length} invitation emails for background sending`);

    revalidatePath(`/dashboard/castings/${castingId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending invitations:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send invitations' 
    };
  }
}

// Get invitations for a casting
export async function getCastingInvitations(castingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    const { data: invitations, error } = await supabase
      .from('casting_invitations')
      .select(`
        *,
        creator:creators(*)
      `)
      .eq('casting_id', castingId)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }

    return invitations as CastingInvitation[];
  } catch (error) {
    console.error('Error in getCastingInvitations:', error);
    return [];
  }
}

// Get selections for a casting
export async function getCastingSelections(castingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    const { data: selections, error } = await supabase
      .from('casting_selections')
      .select(`
        *,
        creator:creators(*)
      `)
      .eq('casting_id', castingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching selections:', error);
      throw error;
    }

    return selections as CastingSelection[];
  } catch (error) {
    console.error('Error in getCastingSelections:', error);
    return [];
  }
}

// Get opportunities for a creator
export async function getCreatorOpportunities() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get creator ID from user
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single();

    if (!creator) {
      throw new Error('Creator not found');
    }

    // Get all invitations for this creator
    const { data: invitations, error } = await supabase
      .from('casting_invitations')
      .select(`
        *,
        casting:castings(
          *,
          client:clients(id, company_name)
        )
      `)
      .eq('creator_id', creator.id)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }

    return invitations as CastingInvitation[];
  } catch (error) {
    console.error('Error in getCreatorOpportunities:', error);
    return [];
  }
}

// Respond to casting invitation (accept/reject)
export async function respondToInvitation(invitationId: string, accept: boolean, rejectionReason?: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Verify this invitation belongs to the current user and get full details
    const { data: invitation } = await supabase
      .from('casting_invitations')
      .select(`
        *,
        casting:castings(
          id,
          title,
          compensation,
          client:clients(company_name)
        ),
        creator:creators(
          id,
          first_name,
          last_name,
          email,
          clerk_user_id
        )
      `)
      .eq('id', invitationId)
      .single();

    if (!invitation || invitation.creator.clerk_user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    const updateData: any = {
      status: accept ? 'accepted' : 'rejected',
      responded_at: new Date().toISOString(),
    };

    if (!accept && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { data: updatedInvitation, error } = await supabase
      .from('casting_invitations')
      .update(updateData)
      .eq('id', invitationId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to respond to invitation: ${error.message}`);
    }

    // If accepted, trigger the automation
    if (accept && invitation.casting) {
      // Get total invited count
      const { data: allInvitations } = await supabase
        .from('casting_invitations')
        .select('id, status')
        .eq('casting_id', invitation.casting.id);

      const totalInvited = allInvitations?.length || 0;
      const totalAccepted = allInvitations?.filter(inv => inv.status === 'accepted').length || 0;

      // Get linked briefings to determine briefing status
      const { data: linkedBriefings } = await supabase
        .from('casting_briefing_links')
        .select('briefing_id')
        .eq('casting_id', invitation.casting.id);

      const briefingCount = linkedBriefings?.length || 0;
      const briefingStatus = briefingCount > 0 ? 'ready' : 'not_ready';

      // Trigger automation for invitation accepted
      await triggerAutomation('casting_invitation_accepted', {
        castingId: invitation.casting.id,
        castingTitle: invitation.casting.title,
        clientName: invitation.casting.client?.company_name || 'Unknown Client',
        creatorId: invitation.creator.id,
        creatorName: `${invitation.creator.first_name} ${invitation.creator.last_name || ''}`.trim(),
        creatorEmail: invitation.creator.email,
        totalInvited,
        totalAccepted,
        compensation: invitation.casting.compensation,
        briefingStatus,
        briefingCount,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://platform.bubbleads.nl'
      }, {
        executedBy: invitation.creator.email
      }).catch(err => {
        console.error('Failed to trigger automation:', err);
      });
    }

    revalidatePath('/dashboard/creator/opportunities');
    
    return { success: true, invitation: updatedInvitation };
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to respond to invitation' 
    };
  }
}

// Select creators for client review (Social Bubble)
export async function selectCreatorsForClient(castingId: string, creatorIds: string[]) {
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

    // Create selections
    const selections = creatorIds.map(creatorId => ({
      casting_id: castingId,
      creator_id: creatorId,
      selected_by: user.id,
      selected_by_role: 'social_bubble' as const,
    }));

    const { error } = await supabase
      .from('casting_selections')
      .insert(selections);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to select creators: ${error.message}`);
    }

    revalidatePath(`/dashboard/castings/${castingId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error selecting creators:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to select creators' 
    };
  }
}

// Client selects final creators
export async function selectFinalCreators(castingId: string, creatorIds: string[]) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get casting details with client info
    const { data: casting } = await supabase
      .from('castings')
      .select(`
        *,
        client:clients(company_name, drive_folder_id, drive_folder_url)
      `)
      .eq('id', castingId)
      .single();

    if (!casting) {
      throw new Error('Casting not found');
    }

    // Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (roleData && roleData.role === 'social_bubble') {
      // Social Bubble users can approve on behalf of clients
    } else {
      // Verify client owns this casting
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('clerk_user_id', user.id)
        .single();

      if (!clientUser || clientUser.client_id !== casting.client_id) {
        throw new Error('Unauthorized');
      }
    }

    if (casting.status !== 'send_client_feedback') {
      throw new Error('Invalid casting status');
    }

    if (creatorIds.length > casting.max_creators) {
      throw new Error(`Cannot select more than ${casting.max_creators} creators`);
    }

    // Create selections
    const selections = creatorIds.map(creatorId => ({
      casting_id: castingId,
      creator_id: creatorId,
      selected_by: user.id,
      selected_by_role: 'client' as const,
    }));

    const { error: selectionError } = await supabase
      .from('casting_selections')
      .insert(selections);

    if (selectionError) {
      console.error('Supabase error:', selectionError);
      throw new Error(`Failed to select creators: ${selectionError.message}`);
    }

    // Check if casting has APPROVED linked briefings
    const { data: linkedBriefings } = await supabase
      .from('casting_briefing_links')
      .select(`
        briefing_id,
        briefing:briefings!inner(status)
      `)
      .eq('casting_id', castingId);

    // Check if any linked briefing is approved
    const hasApprovedBriefing = linkedBriefings?.some(
      link => {
        const briefing = link.briefing as any;
        return briefing && !Array.isArray(briefing) && briefing.status === 'approved';
      }
    ) || false;
    
    const newStatus = hasApprovedBriefing ? 'shooting' : 'approved_by_client';

    // Update casting status
    const { error: statusError } = await supabase
      .from('castings')
      .update({ status: newStatus })
      .eq('id', castingId);

    if (statusError) {
      console.error('Error updating casting status:', statusError);
      throw new Error('Failed to update casting status');
    }

    // If status is changing to 'shooting', create Google Drive folders
    if (newStatus === 'shooting') {
      console.log('Status changing to shooting, checking Drive folder setup...');
      console.log('Client Drive folder ID:', casting.client?.drive_folder_id);
      console.log('Client Drive folder URL:', casting.client?.drive_folder_url);
      
      if (casting.client?.drive_folder_id) {
        try {
          // Ensure RAW folder exists
          const rawFolderId = await ensureRAWFolder(casting.client.drive_folder_id);
        
        // Create folders for each chosen creator
        for (const creatorId of creatorIds) {
          const { data: creator } = await supabase
            .from('creators')
            .select('first_name, last_name')
            .eq('id', creatorId)
            .single();
          
          if (creator) {
            const creatorFullName = `${creator.first_name} ${creator.last_name || ''}`.trim();
            
            try {
              const { folderId, folderUrl } = await createCreatorFolder(
                rawFolderId,
                creatorFullName,
                casting.title
              );
              
              // Update creator submission with Drive folder info
              await supabase
                .from('creator_submissions')
                .update({
                  drive_folder_id: folderId,
                  drive_folder_url: folderUrl,
                  drive_folder_created_at: new Date().toISOString()
                })
                .eq('casting_id', castingId)
                .eq('creator_id', creatorId);
                
              console.log(`Created Drive folder for ${creatorFullName}: ${folderUrl}`);
            } catch (folderError) {
              console.error(`Failed to create Drive folder for ${creatorFullName}:`, folderError);
              // Continue with other creators even if one fails
            }
          }
        }
      } catch (driveError) {
        console.error('Error creating Drive folders:', driveError);
        // Don't fail the entire operation if Drive folder creation fails
      }
    } else {
      console.log('Client does not have a Drive folder configured');
    }
  } else {
    console.log('Status is not changing to shooting, it is:', newStatus);
  }

    // Get all creator categories for notifications
    // 1. Chosen creators (just selected)
    const { data: chosenCreators } = await supabase
      .from('creators')
      .select('id, email, first_name')
      .in('id', creatorIds);

    // 2. Creators who accepted but weren't chosen
    // First get all accepted invitations, then filter in JavaScript
    const { data: acceptedInvitations } = await supabase
      .from('casting_invitations')
      .select('creator:creators(id, email, first_name), creator_id')
      .eq('casting_id', castingId)
      .eq('status', 'accepted');
    
    // Filter out the chosen creators
    const notChosenCreators = acceptedInvitations?.filter(
      inv => !creatorIds.includes(inv.creator_id)
    ) || [];

    // 3. Creators who never responded
    const { data: noResponseCreators } = await supabase
      .from('casting_invitations')
      .select('creator:creators(id, email, first_name)')
      .eq('casting_id', castingId)
      .eq('status', 'pending');

    // Collect all email tasks for background sending
    const emailTasks = [];

    // 1. Chosen creators
    if (chosenCreators && chosenCreators.length > 0) {
      for (const creator of chosenCreators) {
        const task = hasApprovedBriefing
          ? {
              recipient: creator.email,
              sendFn: () => sendCastingApprovedWithBriefingEmail({
                to: creator.email,
                creatorName: creator.first_name || 'Creator',
                castingTitle: casting.title,
                clientName: casting.client?.company_name || 'Client',
                compensation: casting.compensation,
              })
            }
          : {
              recipient: creator.email,
              sendFn: () => sendCastingApprovedNoBriefingEmail({
                to: creator.email,
                creatorName: creator.first_name || 'Creator',
                castingTitle: casting.title,
                clientName: casting.client?.company_name || 'Client',
                compensation: casting.compensation,
              })
            };
        emailTasks.push(task);
      }
    }

    // 2. Not chosen creators
    if (notChosenCreators && notChosenCreators.length > 0) {
      for (const invite of notChosenCreators) {
        const creator = invite.creator as any;
        if (creator && !Array.isArray(creator)) {
          emailTasks.push({
            recipient: creator.email,
            sendFn: () => sendCastingNotSelectedEmail({
              to: creator.email,
              creatorName: creator.first_name || 'Creator',
              castingTitle: casting.title,
              clientName: casting.client?.company_name || 'Client',
            })
          });
        }
      }
    }

    // 3. No response creators
    if (noResponseCreators && noResponseCreators.length > 0) {
      for (const invite of noResponseCreators) {
        const creator = invite.creator as any;
        if (creator && !Array.isArray(creator)) {
          emailTasks.push({
            recipient: creator.email,
            sendFn: () => sendCastingClosedNoResponseEmail({
              to: creator.email,
              creatorName: creator.first_name || 'Creator',
              castingTitle: casting.title,
              clientName: casting.client?.company_name || 'Client',
            })
          });
        }
      }
    }

    // Queue all emails for background sending
    queueEmails(emailTasks);
    console.log(`Queued ${emailTasks.length} notification emails for final selection`);

    // Briefing status based on whether approved briefing exists
    const briefingStatus = hasApprovedBriefing ? 'ready' : 'not_ready';

    // Trigger automation for casting approval
    await triggerAutomation('casting_approved', {
      castingId,
      castingTitle: casting.title,
      clientName: casting.client?.company_name || 'Unknown Client',
      chosenCreatorsCount: creatorIds.length,
      briefingStatus,
      briefingCount: linkedBriefings?.length || 0,
      approvedBy: user.emailAddresses?.[0]?.emailAddress || user.id,
    }, {
      executedBy: user.emailAddresses?.[0]?.emailAddress
    }).catch(err => {
      console.error('Failed to trigger automation:', err);
    });

    revalidatePath(`/dashboard/castings/${castingId}`);
    revalidatePath('/dashboard/client/castings'); // Refresh client dashboard
    
    return { success: true, newStatus };
  } catch (error) {
    console.error('Error selecting final creators:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to select creators' 
    };
  }
}