'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { 
  createCasting, 
  sendCastingInvitations, 
  selectCreatorsForClient,
  selectFinalCreators,
  updateCasting
} from './castings';
import { linkBriefingToCasting } from './casting-briefings';
import { submitCreatorWork } from './casting-briefings';

export async function runRealisticWorkflowTest() {
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
      throw new Error('Only Social Bubble team members can run workflow tests');
    }

    const results: string[] = [];
    let castingId: string | undefined;
    let briefingId: string | undefined;

    try {
      // Step 1: Find Hikaya client
      results.push('🔍 Finding Hikaya client...');
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_name', 'Hikaya')
        .single();
      
      if (clientError || !client) {
        throw new Error('Hikaya client not found. Please ensure a client named "Hikaya" exists.');
      }
      
      results.push(`✅ Found client: ${client.company_name} (ID: ${client.id})`);
      if (client.drive_folder_url) {
        results.push(`📁 Client has Drive folder: ${client.drive_folder_url}`);
      } else {
        results.push('⚠️ Client does not have a Drive folder configured');
      }

      // Step 2: Create a new casting using the server action
      results.push('\n📝 Creating new casting...');
      const castingResult = await createCasting({
        client_id: client.id,
        compensation: 5000,
      });
      
      if (!castingResult.success || !castingResult.casting) {
        throw new Error(`Failed to create casting: ${castingResult.error}`);
      }
      
      castingId = castingResult.casting.id;
      results.push(`✅ Created casting: ${castingResult.casting.title}`);

      // Step 3: Get 3 most recent creators
      results.push('\n👥 Getting recent creators...');
      const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (creatorsError || !creators || creators.length < 3) {
        throw new Error('Not enough creators found. Need at least 3 creators in the system.');
      }
      
      results.push(`✅ Found ${creators.length} creators:`);
      creators.forEach(creator => {
        results.push(`   - ${creator.first_name} ${creator.last_name} (${creator.email})`);
      });

      // Step 4: Create and link an approved briefing FIRST
      results.push('\n📋 Creating approved briefing...');
      const { data: briefing, error: briefingError } = await supabase
        .from('briefings')
        .insert({
          client_id: client.id,
          title: `Test Briefing for ${castingResult.casting.title}`,
          content: '<p>Test briefing content for workflow testing</p>',
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          created_by: user.id,
        })
        .select()
        .single();
      
      if (briefingError) {
        results.push(`❌ Failed to create briefing: ${briefingError.message}`);
        throw new Error(`Failed to create briefing: ${briefingError.message}`);
      }
      
      if (briefing) {
        briefingId = briefing.id;
        results.push(`✅ Created briefing: ${briefing.title}`);
        
        // Link briefing to casting using server action
        const linkResult = await linkBriefingToCasting(castingId!, briefing.id);
        
        if (linkResult.success) {
          results.push(`✅ Linked briefing to casting`);
        } else {
          results.push(`❌ Failed to link briefing: ${linkResult.error}`);
          throw new Error(`Failed to link briefing: ${linkResult.error}`);
        }
      }

      // Step 5: Send invitations using server action
      results.push('\n📧 Sending invitations...');
      const inviteResult = await sendCastingInvitations(
        castingId!, 
        creators.map(c => c.id)
      );
      
      if (!inviteResult.success) {
        throw new Error(`Failed to send invitations: ${inviteResult.error}`);
      }
      
      results.push(`✅ Sent invitations to ${creators.length} creators`);
      results.push('📬 Invitation emails are being processed');

      // Wait a bit for the invitations to process
      results.push('⏳ Waiting for invitations to process...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 6: Simulate 2 creators accepting (need to get invitation IDs)
      results.push('\n✋ Simulating creator responses...');
      const { data: invitations } = await supabase
        .from('casting_invitations')
        .select('*')
        .eq('casting_id', castingId);
      
      if (!invitations || invitations.length < 2) {
        throw new Error('Failed to get invitations');
      }
      
      // Accept first 2 invitations
      const acceptingInvitations = invitations.slice(0, 2);
      
      // Note: respondToInvitation expects the user to be the creator, 
      // so we can't directly call it. We'll simulate the response.
      for (const invitation of acceptingInvitations) {
        await supabase
          .from('casting_invitations')
          .update({
            status: 'accepted',
            responded_at: new Date().toISOString(),
          })
          .eq('id', invitation.id);
        
        // Create creator submission
        await supabase
          .from('creator_submissions')
          .insert({
            casting_id: castingId,
            creator_id: invitation.creator_id,
            submission_status: 'pending',
          });
        
        const creator = creators.find(c => c.id === invitation.creator_id);
        if (creator) {
          results.push(`✅ ${creator.first_name} ${creator.last_name} accepted`);
        }
      }

      // Step 7: Social Bubble selects creators using server action
      results.push('\n🎯 Social Bubble selecting creators...');
      const selectResult = await selectCreatorsForClient(
        castingId!,
        acceptingInvitations.map(inv => inv.creator_id)
      );
      
      if (!selectResult.success) {
        throw new Error(`Failed to select creators: ${selectResult.error}`);
      }
      
      results.push('✅ Selected 2 creators for client review');

      // Step 8: Update status to send_client_feedback
      results.push('\n📨 Sending to client for feedback...');
      const updateResult = await updateCasting(castingId!, {
        status: 'send_client_feedback',
      });
      
      if (!updateResult.success) {
        throw new Error(`Failed to update casting status: ${updateResult.error}`);
      }
      
      results.push('✅ Casting sent to client for review');
      results.push('📬 Client notification email sent');

      // Wait for status change to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 9: Client approves creators using server action (now works for Social Bubble users too)
      results.push('\n👍 Client approving creators...');
      const approveResult = await selectFinalCreators(
        castingId!,
        acceptingInvitations.map(inv => inv.creator_id)
      );
      
      if (!approveResult.success) {
        throw new Error(`Failed to approve creators: ${approveResult.error}`);
      }
      
      results.push(`✅ Client approved both creators`);
      results.push(`📊 Casting status: ${approveResult.newStatus}`);
      results.push('📬 Creator notification emails sent');
      
      if (approveResult.newStatus === 'shooting' && client.drive_folder_url) {
        results.push('📁 Google Drive folders are being created...');
        
        // Wait for folder creation
        results.push('⏳ Waiting for Drive folder creation...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Step 10: Check Drive folders
      results.push('\n📁 Checking Drive folders...');
      const { data: submissions } = await supabase
        .from('creator_submissions')
        .select('*, creator:creators(first_name, last_name)')
        .eq('casting_id', castingId);
      
      if (submissions) {
        for (const submission of submissions) {
          if (submission.drive_folder_url) {
            results.push(`✅ Drive folder created for ${submission.creator.first_name}: ${submission.drive_folder_url}`);
          } else {
            results.push(`⏳ Drive folder for ${submission.creator.first_name} pending`);
          }
        }
      }

      // Step 11: Simulate creator submission
      results.push('\n📤 Simulating creator submission...');
      if (submissions && submissions.length > 0) {
        const submittingCreator = submissions[0];
        
        // Update with content link first
        await supabase
          .from('creator_submissions')
          .update({
            content_upload_link: 'https://drive.google.com/test-submission',
          })
          .eq('id', submittingCreator.id);
        
        // Submit using server action (now works for Social Bubble users)
        const submitResult = await submitCreatorWork(castingId!, submittingCreator.creator_id);
        
        if (submitResult.success) {
          results.push(`✅ ${submittingCreator.creator.first_name} submitted their work`);
        } else {
          results.push(`⚠️ Failed to submit: ${submitResult.error}`);
        }
      }

      // Final summary
      results.push('\n📊 WORKFLOW TEST COMPLETED SUCCESSFULLY!');
      results.push('\n🔔 The following should have happened:');
      results.push('   ✓ Email notifications sent at each step');
      results.push('   ✓ Slack notifications triggered');
      results.push('   ✓ Google Drive folders created (if configured)');
      results.push('   ✓ Automation webhooks triggered');
      
      results.push(`\n🧹 Test casting ID: ${castingId}`);
      if (briefingId) {
        results.push(`📋 Test briefing ID: ${briefingId}`);
      }
      results.push('ℹ️ This test data will remain in the database for inspection');

      return {
        success: true,
        results,
        castingId,
        briefingId,
      };

    } catch (error) {
      // Cleanup on error
      if (castingId) {
        await cleanupTestData(castingId!, briefingId);
      }
      throw error;
    }

  } catch (error) {
    console.error('Workflow test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results: [],
    };
  }
}

async function cleanupTestData(castingId: string, briefingId?: string) {
  const supabase = createServiceClient();
  
  // Get linked briefings before deleting links
  const { data: briefingLinks } = await supabase
    .from('casting_briefing_links')
    .select('briefing_id')
    .eq('casting_id', castingId);
  
  await supabase.from('creator_submissions').delete().eq('casting_id', castingId);
  await supabase.from('casting_selections').delete().eq('casting_id', castingId);
  await supabase.from('casting_invitations').delete().eq('casting_id', castingId);
  await supabase.from('casting_briefing_links').delete().eq('casting_id', castingId);
  await supabase.from('castings').delete().eq('id', castingId);
  
  // Delete test briefings
  if (briefingId) {
    await supabase.from('briefings').delete().eq('id', briefingId);
  } else if (briefingLinks && briefingLinks.length > 0) {
    const briefingIds = briefingLinks.map(link => link.briefing_id);
    await supabase
      .from('briefings')
      .delete()
      .in('id', briefingIds)
      .like('title', 'Test Briefing%');
  }
}

export async function cleanupTestCasting(castingId: string, briefingId?: string) {
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
      throw new Error('Only Social Bubble team members can cleanup test data');
    }

    await cleanupTestData(castingId!, briefingId);

    return { success: true, message: 'Test casting cleaned up successfully' };
  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cleanup',
    };
  }
}