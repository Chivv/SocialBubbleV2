'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { sendCreatorInvitationEmail } from '@/lib/resend';
import { queueEmails } from '@/lib/email-queue';

// Check if user is authorized (bas@bubbleads.nl)
async function checkAuthorization() {
  const user = await currentUser();
  if (!user) throw new Error('Not authenticated');
  
  const email = user.emailAddresses?.[0]?.emailAddress;
  if (email !== 'bas@bubbleads.nl') {
    throw new Error('Unauthorized');
  }
  
  return user;
}

// Get all imported creators
export async function getImportedCreators() {
  try {
    await checkAuthorization();
    
    const supabase = createServiceClient();
    
    // First get all imported creators
    const { data: importedCreators, error } = await supabase
      .from('creator_import_list')
      .select('*')
      .order('imported_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching imported creators:', error);
      throw error;
    }
    
    if (!importedCreators || importedCreators.length === 0) {
      return [];
    }
    
    // Get all emails from imported creators
    const emails = importedCreators.map(c => c.email);
    
    // Check which emails exist in the creators table
    const { data: signedUpCreators, error: creatorsError } = await supabase
      .from('creators')
      .select('email')
      .in('email', emails);
    
    if (creatorsError) {
      console.error('Error checking creator signups:', creatorsError);
      // Continue without signup data if there's an error
    }
    
    // Create a set of signed up emails for fast lookup
    const signedUpEmails = new Set(signedUpCreators?.map(c => c.email) || []);
    
    // Update the imported creators with actual signup status
    const creatorsWithSignupStatus = importedCreators.map(creator => ({
      ...creator,
      signed_up_at: signedUpEmails.has(creator.email) ? creator.signed_up_at || new Date().toISOString() : null
    }));
    
    return creatorsWithSignupStatus;
  } catch (error) {
    console.error('Error in getImportedCreators:', error);
    return [];
  }
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to normalize email
function normalizeEmail(email: string): string | null {
  let normalized = email.toLowerCase().trim();
  
  // Remove mailto: prefix
  if (normalized.startsWith('mailto:')) {
    normalized = normalized.substring(7);
  }
  
  // Remove any URL prefixes (http://, https://, www.)
  normalized = normalized.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // Extract email from common patterns like "notion.solc.harthoorn@outlook.com"
  // This looks like it might have been a copy-paste error
  const emailMatch = normalized.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
  if (emailMatch) {
    normalized = emailMatch[1];
  }
  
  // Validate the final result
  if (!isValidEmail(normalized)) {
    return null;
  }
  
  return normalized;
}

// Import creators from CSV data
export async function importCreatorsFromCSV(creators: { email: string; full_name: string }[]) {
  try {
    await checkAuthorization();
    
    const supabase = createServiceClient();
    
    // Normalize and validate emails, filter out duplicates
    const processedCreators: any[] = [];
    const invalidEmails: any[] = [];
    
    for (const creator of creators) {
      if (!creator.full_name || !creator.full_name.trim()) {
        continue; // Skip if no name
      }
      
      const normalizedEmail = normalizeEmail(creator.email);
      
      if (!normalizedEmail) {
        invalidEmails.push(creator.email);
        continue; // Skip invalid emails
      }
      
      // Check if already in our processed list
      const exists = processedCreators.some(c => c.email === normalizedEmail);
      if (!exists) {
        processedCreators.push({
          email: normalizedEmail,
          full_name: creator.full_name.trim()
        });
      }
    }
    
    if (processedCreators.length === 0) {
      const errorMsg = invalidEmails.length > 0 
        ? `No valid creators to import. ${invalidEmails.length} invalid emails found.`
        : 'No valid creators to import';
      return { success: false, error: errorMsg };
    }
    
    // Insert creators one by one, skipping duplicates
    const results = [];
    const errors = [];
    
    for (const creator of processedCreators) {
      const { data, error } = await supabase
        .from('creator_import_list')
        .insert(creator)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505' || error.message.includes('duplicate')) {
          // Duplicate email, skip it
          continue;
        } else {
          errors.push({ email: creator.email, error: error.message });
        }
      } else if (data) {
        results.push(data);
      }
    }
    
    if (errors.length > 0 && results.length === 0) {
      console.error('Import errors:', errors);
      throw new Error('Failed to import any creators');
    }
    
    revalidatePath('/dashboard/creator-imports');
    
    return { 
      success: true, 
      imported: results.length,
      total: processedCreators.length,
      skipped: processedCreators.length - results.length,
      invalidEmails: invalidEmails.length 
    };
  } catch (error) {
    console.error('Error importing creators:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to import creators' 
    };
  }
}

// Send invitation to a single creator
export async function sendCreatorInvitation(creatorId: string) {
  try {
    await checkAuthorization();
    
    const supabase = createServiceClient();
    
    // Get creator details
    const { data: creator, error: fetchError } = await supabase
      .from('creator_import_list')
      .select('*')
      .eq('id', creatorId)
      .single();
    
    if (fetchError || !creator) {
      throw new Error('Creator not found');
    }
    
    // Send email
    await sendCreatorInvitationEmail({
      to: creator.email,
      fullName: creator.full_name
    });
    
    // Update invitation sent timestamp
    const { error: updateError } = await supabase
      .from('creator_import_list')
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq('id', creatorId);
    
    if (updateError) {
      console.error('Update error:', updateError);
    }
    
    revalidatePath('/dashboard/creator-imports');
    
    return { success: true };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send invitation' 
    };
  }
}

// Send invitations to multiple creators
export async function sendBulkInvitations(creatorIds: string[]) {
  try {
    await checkAuthorization();
    
    const supabase = createServiceClient();
    
    // Get creators details
    const { data: creators, error: fetchError } = await supabase
      .from('creator_import_list')
      .select('*')
      .in('id', creatorIds);
    
    if (fetchError || !creators || creators.length === 0) {
      throw new Error('No creators found');
    }
    
    // Queue emails for background sending
    const emailTasks = creators.map(creator => ({
      recipient: creator.email,
      sendFn: () => sendCreatorInvitationEmail({
        to: creator.email,
        fullName: creator.full_name
      })
    }));
    
    queueEmails(emailTasks);
    console.log(`Queued ${emailTasks.length} invitation emails`);
    
    // Update invitation sent timestamps
    const { error: updateError } = await supabase
      .from('creator_import_list')
      .update({ invitation_sent_at: new Date().toISOString() })
      .in('id', creatorIds);
    
    if (updateError) {
      console.error('Update error:', updateError);
    }
    
    revalidatePath('/dashboard/creator-imports');
    
    return { success: true, sent: creators.length };
  } catch (error) {
    console.error('Error sending bulk invitations:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send invitations' 
    };
  }
}

// Send follow-up email to a creator
export async function sendFollowUpEmail(creatorId: string) {
  try {
    await checkAuthorization();
    
    const supabase = createServiceClient();
    
    // Get creator details
    const { data: creator, error: fetchError } = await supabase
      .from('creator_import_list')
      .select('*')
      .eq('id', creatorId)
      .single();
    
    if (fetchError || !creator) {
      throw new Error('Creator not found');
    }
    
    // Send follow-up email (using same template for now)
    await sendCreatorInvitationEmail({
      to: creator.email,
      fullName: creator.full_name
    });
    
    // Update follow-up sent timestamp
    const { error: updateError } = await supabase
      .from('creator_import_list')
      .update({ follow_up_sent_at: new Date().toISOString() })
      .eq('id', creatorId);
    
    if (updateError) {
      console.error('Update error:', updateError);
    }
    
    revalidatePath('/dashboard/creator-imports');
    
    return { success: true };
  } catch (error) {
    console.error('Error sending follow-up:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send follow-up' 
    };
  }
}

// Delete imported creator
export async function deleteImportedCreator(creatorId: string) {
  try {
    await checkAuthorization();
    
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('creator_import_list')
      .delete()
      .eq('id', creatorId);
    
    if (error) {
      throw error;
    }
    
    revalidatePath('/dashboard/creator-imports');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting creator:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete creator' 
    };
  }
}

// Export creators as CSV
export async function exportCreatorsCSV(filter?: 'all' | 'signed_up' | 'not_signed_up') {
  try {
    await checkAuthorization();
    
    const supabase = createServiceClient();
    
    // Get all imported creators
    const { data: importedCreators, error } = await supabase
      .from('creator_import_list')
      .select('*')
      .order('imported_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!importedCreators || importedCreators.length === 0) {
      return { success: true, data: [] };
    }
    
    // Get all emails from imported creators
    const emails = importedCreators.map(c => c.email);
    
    // Check which emails exist in the creators table
    const { data: signedUpCreators, error: creatorsError } = await supabase
      .from('creators')
      .select('email')
      .in('email', emails);
    
    if (creatorsError) {
      console.error('Error checking creator signups:', creatorsError);
    }
    
    // Create a set of signed up emails for fast lookup
    const signedUpEmails = new Set(signedUpCreators?.map(c => c.email) || []);
    
    // Update the imported creators with actual signup status
    let creatorsWithSignupStatus = importedCreators.map(creator => ({
      ...creator,
      signed_up_at: signedUpEmails.has(creator.email) ? creator.signed_up_at || new Date().toISOString() : null
    }));
    
    // Apply filter
    if (filter === 'signed_up') {
      creatorsWithSignupStatus = creatorsWithSignupStatus.filter(c => c.signed_up_at !== null);
    } else if (filter === 'not_signed_up') {
      creatorsWithSignupStatus = creatorsWithSignupStatus.filter(c => c.signed_up_at === null);
    }
    
    return { success: true, data: creatorsWithSignupStatus };
  } catch (error) {
    console.error('Error exporting creators:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to export creators' 
    };
  }
}