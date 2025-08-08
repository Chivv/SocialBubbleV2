#!/usr/bin/env tsx

/**
 * Test script for the complete casting workflow
 * This script simulates the entire process from casting creation to submission
 * 
 * Usage: npm run test:workflow
 */

import { createServiceClient } from '../lib/supabase/service';
import { CastingStatus } from '../types';

const supabase = createServiceClient();

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const color = {
    info: colors.blue,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
  }[type];
  
  console.log(`${color}${colors.bright}[${new Date().toISOString()}] ${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log(`\n${colors.cyan}${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}${title}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}${'='.repeat(60)}${colors.reset}\n`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanup(castingId?: string) {
  logSection('CLEANUP');
  
  if (castingId) {
    log('Cleaning up test casting...', 'warning');
    
    // Delete creator submissions
    await supabase
      .from('creator_submissions')
      .delete()
      .eq('casting_id', castingId);
    
    // Delete casting selections
    await supabase
      .from('casting_selections')
      .delete()
      .eq('casting_id', castingId);
    
    // Delete casting invitations
    await supabase
      .from('casting_invitations')
      .delete()
      .eq('casting_id', castingId);
    
    // Delete casting briefing links
    await supabase
      .from('casting_briefing_links')
      .delete()
      .eq('casting_id', castingId);
    
    // Delete the casting
    await supabase
      .from('castings')
      .delete()
      .eq('id', castingId);
    
    log('Cleanup completed', 'success');
  }
}

async function runTest() {
  let castingId: string | undefined;
  
  try {
    logSection('CASTING WORKFLOW TEST');
    log('Starting comprehensive casting workflow test...', 'info');
    
    // Step 1: Find Hikaya client
    logSection('STEP 1: Find Client');
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_name', 'Hikaya')
      .single();
    
    if (clientError || !client) {
      throw new Error('Hikaya client not found. Please ensure a client named "Hikaya" exists.');
    }
    
    log(`Found client: ${client.company_name} (ID: ${client.id})`, 'success');
    if (client.drive_folder_url) {
      log(`Client has Drive folder: ${client.drive_folder_url}`, 'info');
    } else {
      log('Client does not have a Drive folder configured', 'warning');
    }
    
    // Step 2: Create a new casting
    logSection('STEP 2: Create Casting');
    const { data: casting, error: castingError } = await supabase
      .from('castings')
      .insert({
        client_id: client.id,
        compensation: 5000,
        created_by: 'test-script',
        title: `Test Casting ${new Date().toISOString()}`,
        max_creators: 3,
        status: 'draft' as CastingStatus,
      })
      .select()
      .single();
    
    if (castingError || !casting) {
      throw new Error(`Failed to create casting: ${castingError?.message}`);
    }
    
    castingId = casting.id;
    log(`Created casting: ${casting.title} (ID: ${casting.id})`, 'success');
    
    // Step 3: Get 3 most recent creators
    logSection('STEP 3: Get Recent Creators');
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (creatorsError || !creators || creators.length < 3) {
      throw new Error('Not enough creators found. Need at least 3 creators in the system.');
    }
    
    log(`Found ${creators.length} recent creators:`, 'success');
    creators.forEach(creator => {
      log(`  - ${creator.first_name} ${creator.last_name} (${creator.email})`, 'info');
    });
    
    // Step 4: Send invitations
    logSection('STEP 4: Send Invitations');
    const invitations = creators.map(creator => ({
      casting_id: castingId,
      creator_id: creator.id,
      status: 'pending' as const,
    }));
    
    const { error: inviteError } = await supabase
      .from('casting_invitations')
      .insert(invitations);
    
    if (inviteError) {
      throw new Error(`Failed to send invitations: ${inviteError.message}`);
    }
    
    // Update casting status to 'inviting'
    await supabase
      .from('castings')
      .update({ status: 'inviting' as CastingStatus })
      .eq('id', castingId);
    
    log(`Sent invitations to ${creators.length} creators`, 'success');
    log('Note: Invitation emails would be queued in production', 'info');
    
    // Step 5: Simulate 2 creators accepting
    logSection('STEP 5: Simulate Creator Responses');
    const acceptingCreators = creators.slice(0, 2);
    const rejectingCreator = creators[2];
    
    for (const creator of acceptingCreators) {
      const { error } = await supabase
        .from('casting_invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('casting_id', castingId)
        .eq('creator_id', creator.id);
      
      if (!error) {
        log(`${creator.first_name} ${creator.last_name} accepted the invitation`, 'success');
      }
    }
    
    // Create creator submissions for accepted invitations
    for (const creator of acceptingCreators) {
      await supabase
        .from('creator_submissions')
        .insert({
          casting_id: castingId,
          creator_id: creator.id,
          submission_status: 'pending',
        });
    }
    
    log(`${rejectingCreator.first_name} ${rejectingCreator.last_name} did not respond`, 'info');
    
    await sleep(1000); // Give automations time to process
    
    // Step 6: Social Bubble selects the 2 accepting creators
    logSection('STEP 6: Social Bubble Selection');
    const selections = acceptingCreators.map(creator => ({
      casting_id: castingId,
      creator_id: creator.id,
      selected_by: 'test-script',
      selected_by_role: 'social_bubble' as const,
    }));
    
    const { error: selectError } = await supabase
      .from('casting_selections')
      .insert(selections);
    
    if (selectError) {
      throw new Error(`Failed to select creators: ${selectError.message}`);
    }
    
    // Update casting status to 'send_client_feedback'
    await supabase
      .from('castings')
      .update({ status: 'send_client_feedback' as CastingStatus })
      .eq('id', castingId);
    
    log('Social Bubble selected 2 creators for client review', 'success');
    log('Note: Client notification email would be sent in production', 'info');
    
    await sleep(1000);
    
    // Step 7: Client approves both creators
    logSection('STEP 7: Client Approval');
    const clientSelections = acceptingCreators.map(creator => ({
      casting_id: castingId,
      creator_id: creator.id,
      selected_by: 'test-script-client',
      selected_by_role: 'client' as const,
    }));
    
    const { error: clientSelectError } = await supabase
      .from('casting_selections')
      .insert(clientSelections);
    
    if (clientSelectError) {
      throw new Error(`Failed to approve creators: ${clientSelectError.message}`);
    }
    
    // Check if there's an approved briefing (this affects status)
    const { data: briefingLinks } = await supabase
      .from('casting_briefing_links')
      .select('briefing:briefings!inner(status)')
      .eq('casting_id', castingId);
    
    const hasApprovedBriefing = briefingLinks?.some(
      link => link.briefing?.status === 'approved'
    ) || false;
    
    const newStatus = hasApprovedBriefing ? 'shooting' : 'approved_by_client';
    
    // Update casting status
    await supabase
      .from('castings')
      .update({ status: newStatus as CastingStatus })
      .eq('id', castingId);
    
    log(`Client approved both creators. Casting status: ${newStatus}`, 'success');
    log('Note: Creator notification emails would be sent in production', 'info');
    
    if (newStatus === 'shooting' && client.drive_folder_url) {
      log('Note: Google Drive folders would be created automatically in production', 'info');
    }
    
    await sleep(2000); // Give time for any background processes
    
    // Step 8: Check Drive folders
    logSection('STEP 8: Check Drive Folders');
    const { data: submissions } = await supabase
      .from('creator_submissions')
      .select('*, creator:creators(first_name, last_name)')
      .eq('casting_id', castingId);
    
    if (submissions) {
      for (const submission of submissions) {
        if (submission.drive_folder_url) {
          log(`Drive folder created for ${submission.creator.first_name}: ${submission.drive_folder_url}`, 'success');
        } else {
          log(`No Drive folder for ${submission.creator.first_name} (would be created if client has Drive configured)`, 'warning');
        }
      }
    }
    
    // Step 9: Simulate creator submission
    logSection('STEP 9: Creator Submission');
    const submittingCreator = acceptingCreators[0];
    
    // Update submission with content link
    await supabase
      .from('creator_submissions')
      .update({
        content_upload_link: 'https://drive.google.com/test-submission',
        submission_status: 'pending_review',
        submitted_at: new Date().toISOString(),
      })
      .eq('casting_id', castingId)
      .eq('creator_id', submittingCreator.id);
    
    log(`${submittingCreator.first_name} submitted their work`, 'success');
    
    // Final status check
    logSection('FINAL STATUS');
    const { data: finalCasting } = await supabase
      .from('castings')
      .select(`
        *,
        client:clients(company_name),
        casting_invitations!left(id, status),
        casting_selections!left(id, selected_by_role),
        creator_submissions!left(id, submission_status)
      `)
      .eq('id', castingId)
      .single();
    
    if (finalCasting) {
      log(`Casting: ${finalCasting.title}`, 'info');
      log(`Status: ${finalCasting.status}`, 'info');
      log(`Invitations sent: ${finalCasting.casting_invitations?.length || 0}`, 'info');
      log(`Creators selected: ${finalCasting.casting_selections?.filter(s => s.selected_by_role === 'client').length || 0}`, 'info');
      log(`Submissions: ${finalCasting.creator_submissions?.filter(s => s.submission_status === 'pending_review').length || 0} pending review`, 'info');
    }
    
    logSection('TEST COMPLETED SUCCESSFULLY');
    log('All workflow steps executed successfully!', 'success');
    log('\nNote: In production, the following would happen automatically:', 'info');
    log('  - Email notifications at each step', 'info');
    log('  - Slack notifications for key events', 'info');
    log('  - Google Drive folder creation (if client has Drive configured)', 'info');
    log('  - Automation webhooks triggered', 'info');
    
    // Ask if user wants to keep the test data
    console.log(`\n${colors.yellow}Do you want to keep this test casting for manual inspection? (y/N)${colors.reset}`);
    
    // In a real interactive script, you'd wait for user input here
    // For now, we'll clean up automatically after a delay
    log('\nCleaning up in 10 seconds... (Ctrl+C to keep the data)', 'warning');
    await sleep(10000);
    
    await cleanup(castingId);
    
  } catch (error) {
    log(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    console.error(error);
    
    if (castingId) {
      await cleanup(castingId);
    }
    
    process.exit(1);
  }
}

// Run the test
runTest().catch(console.error);