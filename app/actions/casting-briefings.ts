'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { 
  CastingBriefingLink, 
  CreatorSubmission, 
  SubmissionStatus,
  Briefing,
  Casting 
} from '@/types';
import { sendBriefingNowReadyEmail } from '@/lib/resend';
import { queueEmails } from '@/lib/email-queue';
import { ensureRAWFolder, createCreatorFolder } from '@/lib/google-drive-oauth';

// Link a briefing to a casting
export async function linkBriefingToCasting(castingId: string, briefingId: string) {
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
      throw new Error('Unauthorized: Only Social Bubble team members can link briefings');
    }

    // Verify casting and briefing belong to the same client
    const { data: casting } = await supabase
      .from('castings')
      .select('client_id')
      .eq('id', castingId)
      .single();

    const { data: briefing } = await supabase
      .from('briefings')
      .select('client_id')
      .eq('id', briefingId)
      .single();

    if (!casting || !briefing) {
      throw new Error('Casting or briefing not found');
    }

    if (casting.client_id !== briefing.client_id) {
      throw new Error('Casting and briefing must belong to the same client');
    }

    // Create the link
    const { data: link, error } = await supabase
      .from('casting_briefing_links')
      .insert({
        casting_id: castingId,
        briefing_id: briefingId,
        linked_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to link briefing: ${error.message}`);
    }

    // Check if this should trigger notifications/status changes
    await handleBriefingLinked(castingId, briefingId, user.id);

    revalidatePath(`/dashboard/castings/${castingId}`);
    revalidatePath(`/dashboard/briefings/${briefingId}`);
    
    return { success: true, link };
  } catch (error) {
    console.error('Error linking briefing to casting:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to link briefing' 
    };
  }
}

// Unlink a briefing from a casting
export async function unlinkBriefingFromCasting(castingId: string, briefingId: string) {
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

    // Delete the link
    const { error } = await supabase
      .from('casting_briefing_links')
      .delete()
      .eq('casting_id', castingId)
      .eq('briefing_id', briefingId);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to unlink briefing: ${error.message}`);
    }

    revalidatePath(`/dashboard/castings/${castingId}`);
    revalidatePath(`/dashboard/briefings/${briefingId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error unlinking briefing from casting:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unlink briefing' 
    };
  }
}

// Get available briefings for a casting (same client, not linked to other castings)
export async function getAvailableBriefingsForCasting(castingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get casting details
    const { data: casting } = await supabase
      .from('castings')
      .select('client_id')
      .eq('id', castingId)
      .single();

    if (!casting) {
      throw new Error('Casting not found');
    }

    // Check if user is social_bubble
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    // For Social Bubble, get all briefings regardless of status
    // For others, only show approved briefings
    let briefingsQuery = supabase
      .from('briefings')
      .select(`
        *,
        client:clients(id, company_name)
      `)
      .eq('client_id', casting.client_id);

    if (!roleData || roleData.role !== 'social_bubble') {
      briefingsQuery = briefingsQuery.eq('status', 'approved');
    }

    const { data: briefings, error } = await briefingsQuery
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching briefings:', error);
      throw error;
    }

    // Get linked briefing IDs for this client's castings
    const { data: linkedBriefings } = await supabase
      .from('casting_briefing_links')
      .select('briefing_id')
      .in('casting_id', 
        await supabase
          .from('castings')
          .select('id')
          .eq('client_id', casting.client_id)
          .then(res => res.data?.map(c => c.id) || [])
      );

    const linkedBriefingIds = linkedBriefings?.map(lb => lb.briefing_id) || [];

    // Filter out already linked briefings
    const availableBriefings = briefings?.filter(
      briefing => !linkedBriefingIds.includes(briefing.id)
    ) || [];

    return availableBriefings as Briefing[];
  } catch (error) {
    console.error('Error in getAvailableBriefingsForCasting:', error);
    return [];
  }
}

// Get available castings for a briefing (same client, not done)
export async function getAvailableCastingsForBriefing(briefingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get briefing details
    const { data: briefing } = await supabase
      .from('briefings')
      .select('client_id')
      .eq('id', briefingId)
      .single();

    if (!briefing) {
      throw new Error('Briefing not found');
    }

    // Get all castings for the client that are not done
    const { data: castings, error } = await supabase
      .from('castings')
      .select(`
        *,
        client:clients(id, company_name)
      `)
      .eq('client_id', briefing.client_id)
      .neq('status', 'done')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching castings:', error);
      throw error;
    }

    return castings as Casting[];
  } catch (error) {
    console.error('Error in getAvailableCastingsForBriefing:', error);
    return [];
  }
}

// Get linked briefings for a casting
export async function getCastingBriefings(castingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    const { data: links, error } = await supabase
      .from('casting_briefing_links')
      .select(`
        *,
        briefing:briefings(*)
      `)
      .eq('casting_id', castingId)
      .order('linked_at', { ascending: false });

    if (error) {
      console.error('Error fetching casting briefings:', error);
      throw error;
    }

    return links as CastingBriefingLink[];
  } catch (error) {
    console.error('Error in getCastingBriefings:', error);
    return [];
  }
}

// Get linked castings for a briefing
export async function getBriefingCastings(briefingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    const { data: links, error } = await supabase
      .from('casting_briefing_links')
      .select(`
        *,
        casting:castings(*)
      `)
      .eq('briefing_id', briefingId)
      .order('linked_at', { ascending: false });

    if (error) {
      console.error('Error fetching briefing castings:', error);
      throw error;
    }

    return links as CastingBriefingLink[];
  } catch (error) {
    console.error('Error in getBriefingCastings:', error);
    return [];
  }
}

// Get briefings for a creator (from approved castings where they were selected)
export async function getCreatorBriefings() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Get creator ID
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single();

    if (!creator) {
      throw new Error('Creator not found');
    }

    // Get briefings from castings where creator was selected by client
    const { data: briefingLinks, error } = await supabase
      .from('casting_briefing_links')
      .select(`
        *,
        briefing:briefings(*),
        casting:castings(
          *,
          client:clients(id, company_name)
        )
      `)
      .in('casting_id', 
        await supabase
          .from('casting_selections')
          .select('casting_id')
          .eq('creator_id', creator.id)
          .eq('selected_by_role', 'client')
          .then(res => res.data?.map(s => s.casting_id) || [])
      );

    if (error) {
      console.error('Error fetching creator briefings:', error);
      throw error;
    }

    // Filter to only show briefings from approved castings
    const approvedBriefings = briefingLinks?.filter(
      link => link.casting && ['approved_by_client', 'shooting', 'done'].includes(link.casting.status)
    ) || [];

    // Get creator submissions for these castings
    const castingIds = approvedBriefings.map(b => b.casting_id);
    const { data: submissions } = await supabase
      .from('creator_submissions')
      .select('*')
      .eq('creator_id', creator.id)
      .in('casting_id', castingIds);

    // Combine briefings with submission data
    const briefingsWithSubmissions = approvedBriefings.map(link => ({
      ...link,
      submission: submissions?.find(s => s.casting_id === link.casting_id)
    }));

    return briefingsWithSubmissions;
  } catch (error) {
    console.error('Error in getCreatorBriefings:', error);
    return [];
  }
}

// Get all creator submissions for a casting
export async function getCreatorSubmissions(castingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    // Check permissions
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'social_bubble') {
      throw new Error('Unauthorized');
    }

    const { data: submissions, error } = await supabase
      .from('creator_submissions')
      .select(`
        *,
        creator:creators(*)
      `)
      .eq('casting_id', castingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }

    return submissions as CreatorSubmission[];
  } catch (error) {
    console.error('Error in getCreatorSubmissions:', error);
    return [];
  }
}

// Update creator content upload link
export async function updateCreatorContentLink(
  castingId: string, 
  creatorId: string, 
  contentUploadLink: string
) {
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

    const { data: submission, error } = await supabase
      .from('creator_submissions')
      .update({ content_upload_link: contentUploadLink })
      .eq('casting_id', castingId)
      .eq('creator_id', creatorId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update content link: ${error.message}`);
    }

    revalidatePath(`/dashboard/castings/${castingId}`);
    
    return { success: true, submission };
  } catch (error) {
    console.error('Error updating content link:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update content link' 
    };
  }
}

// Submit creator work
export async function submitCreatorWork(castingId: string, creatorIdOverride?: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();
    
    let creatorId: string;
    
    // Check if user is Social Bubble
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();
    
    if (roleData && roleData.role === 'social_bubble' && creatorIdOverride) {
      // Social Bubble can submit on behalf of creators
      creatorId = creatorIdOverride;
    } else {
      // Get creator ID for regular creators
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (!creator) {
        throw new Error('Creator not found');
      }
      
      creatorId = creator.id;
    }

    const { data: submission, error } = await supabase
      .from('creator_submissions')
      .update({ 
        submission_status: 'pending_review',
        submitted_at: new Date().toISOString()
      })
      .eq('casting_id', castingId)
      .eq('creator_id', creatorId)
      .in('submission_status', ['pending', 'revision_requested'])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to submit work: ${error.message}`);
    }

    revalidatePath('/dashboard/creator/briefings');
    revalidatePath(`/dashboard/castings/${castingId}`);
    
    return { success: true, submission };
  } catch (error) {
    console.error('Error submitting work:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit work' 
    };
  }
}

// Review creator submission
export async function reviewCreatorSubmission(
  castingId: string,
  creatorId: string,
  approved: boolean,
  feedback?: string
) {
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

    const updateData: any = {
      feedback,
      feedback_by: user.id,
      feedback_at: new Date().toISOString()
    };

    if (approved) {
      updateData.submission_status = 'approved';
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.submission_status = 'revision_requested';
    }

    const { data: submission, error } = await supabase
      .from('creator_submissions')
      .update(updateData)
      .eq('casting_id', castingId)
      .eq('creator_id', creatorId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to review submission: ${error.message}`);
    }

    // Update casting status to shooting if it's still approved_by_client
    if (approved) {
      await supabase
        .from('castings')
        .update({ status: 'shooting' })
        .eq('id', castingId)
        .eq('status', 'approved_by_client');
    }

    revalidatePath(`/dashboard/castings/${castingId}`);
    revalidatePath('/dashboard/creator/briefings');
    
    return { success: true, submission };
  } catch (error) {
    console.error('Error reviewing submission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to review submission' 
    };
  }
}

// Handle when a briefing is linked to a casting
async function handleBriefingLinked(castingId: string, briefingId: string, userId: string) {
  try {
    const supabase = createServiceClient();
    
    // Get briefing status
    const { data: briefing } = await supabase
      .from('briefings')
      .select('status')
      .eq('id', briefingId)
      .single();

    if (!briefing || briefing.status !== 'approved') {
      // Briefing not approved, no action needed
      return;
    }

    // Get casting details
    const { data: casting } = await supabase
      .from('castings')
      .select(`
        *,
        client:clients(company_name, drive_folder_id, drive_folder_url)
      `)
      .eq('id', castingId)
      .single();

    if (!casting) {
      console.error('Casting not found for briefing link handler');
      return;
    }

    // Check if casting is at approved_by_client status
    if (casting.status === 'approved_by_client') {
      // Update casting status to shooting since briefing is approved
      await supabase
        .from('castings')
        .update({ status: 'shooting' })
        .eq('id', castingId);

      // Get all chosen creators (selected by client)
      const { data: selections } = await supabase
        .from('casting_selections')
        .select(`
          creator:creators(id, email, first_name, last_name),
          creator_id
        `)
        .eq('casting_id', castingId)
        .eq('selected_by_role', 'client');

      // Create Google Drive folders if client has Drive folder configured
      if (casting.client?.drive_folder_id && selections && selections.length > 0) {
        try {
          const rawFolderId = await ensureRAWFolder(casting.client.drive_folder_id);
          
          for (const selection of selections) {
            if (selection.creator) {
              const creatorFullName = `${selection.creator.first_name} ${selection.creator.last_name || ''}`.trim();
              
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
                  .eq('creator_id', selection.creator_id);
                  
                console.log(`Created Drive folder for ${creatorFullName}: ${folderUrl}`);
              } catch (folderError) {
                console.error(`Failed to create Drive folder for ${creatorFullName}:`, folderError);
              }
            }
          }
        } catch (driveError) {
          console.error('Error creating Drive folders:', driveError);
          // Don't fail the operation if Drive folder creation fails
        }
      }

      // Queue "briefing now ready" emails for background sending
      const emailTasks = selections
        ?.filter(sel => sel.creator)
        .map(sel => ({
          recipient: sel.creator!.email,
          sendFn: () => sendBriefingNowReadyEmail({
            to: sel.creator!.email,
            creatorName: sel.creator!.first_name || 'Creator',
            castingTitle: casting.title,
            clientName: casting.client?.company_name || 'Client',
            compensation: casting.compensation,
          })
        })) || [];

      if (emailTasks.length > 0) {
        queueEmails(emailTasks);
        console.log(`Queued ${emailTasks.length} briefing ready emails for casting ${castingId}`);
      }
    }
  } catch (error) {
    console.error('Error in handleBriefingLinked:', error);
    // Don't throw - this is a background process
  }
}

// Handle when a briefing is approved
export async function handleBriefingApproved(briefingId: string) {
  try {
    const supabase = createServiceClient();
    
    // Get all castings linked to this briefing
    const { data: links } = await supabase
      .from('casting_briefing_links')
      .select(`
        casting_id,
        casting:castings(
          id,
          title,
          status,
          compensation,
          client:clients(company_name, drive_folder_id, drive_folder_url)
        )
      `)
      .eq('briefing_id', briefingId);

    if (!links || links.length === 0) {
      // No linked castings, nothing to do
      return;
    }

    // Process each linked casting
    for (const link of links) {
      if (!link.casting) continue;
      
      // Check if casting is at approved_by_client status
      if (link.casting.status === 'approved_by_client') {
        // Update casting status to shooting
        await supabase
          .from('castings')
          .update({ status: 'shooting' })
          .eq('id', link.casting.id);

        // Get all chosen creators (selected by client)
        const { data: selections } = await supabase
          .from('casting_selections')
          .select(`
            creator:creators(id, email, first_name, last_name),
            creator_id
          `)
          .eq('casting_id', link.casting.id)
          .eq('selected_by_role', 'client');

        // Create Google Drive folders if client has Drive folder configured
        if (link.casting.client?.drive_folder_id && selections && selections.length > 0) {
          try {
            const rawFolderId = await ensureRAWFolder(link.casting.client.drive_folder_id);
            
            for (const selection of selections) {
              if (selection.creator) {
                const creatorFullName = `${selection.creator.first_name} ${selection.creator.last_name || ''}`.trim();
                
                try {
                  const { folderId, folderUrl } = await createCreatorFolder(
                    rawFolderId,
                    creatorFullName,
                    link.casting.title
                  );
                  
                  // Update creator submission with Drive folder info
                  await supabase
                    .from('creator_submissions')
                    .update({
                      drive_folder_id: folderId,
                      drive_folder_url: folderUrl,
                      drive_folder_created_at: new Date().toISOString()
                    })
                    .eq('casting_id', link.casting.id)
                    .eq('creator_id', selection.creator_id);
                    
                  console.log(`Created Drive folder for ${creatorFullName}: ${folderUrl}`);
                } catch (folderError) {
                  console.error(`Failed to create Drive folder for ${creatorFullName}:`, folderError);
                }
              }
            }
          } catch (driveError) {
            console.error('Error creating Drive folders:', driveError);
            // Don't fail the operation if Drive folder creation fails
          }
        }

        // Queue "briefing now ready" emails for background sending
        const emailTasks = selections
          ?.filter(sel => sel.creator)
          .map(sel => ({
            recipient: sel.creator!.email,
            sendFn: () => sendBriefingNowReadyEmail({
              to: sel.creator!.email,
              creatorName: sel.creator!.first_name || 'Creator',
              castingTitle: link.casting!.title,
              clientName: link.casting!.client?.company_name || 'Client',
              compensation: link.casting!.compensation,
            })
          })) || [];

        if (emailTasks.length > 0) {
          queueEmails(emailTasks);
          console.log(`Queued ${emailTasks.length} briefing ready emails for casting ${link.casting.id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in handleBriefingApproved:', error);
    // Don't throw - this is a background process
  }
}