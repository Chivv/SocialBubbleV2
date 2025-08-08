'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { CastingStatus } from '@/types';
import { 
  createCasting, 
  sendCastingInvitations, 
  respondToInvitation,
  selectCreatorsForClient,
  selectFinalCreators 
} from './castings';
import { linkBriefingToCasting } from './casting-briefings';

export async function runWorkflowTest() {
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

      // Step 2: Create a new casting
      results.push('\n📝 Creating new casting...');
      const { data: casting, error: castingError } = await supabase
        .from('castings')
        .insert({
          client_id: client.id,
          compensation: 5000,
          created_by: user.id,
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
      results.push(`✅ Created casting: ${casting.title}`);

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

      // Step 4: Send invitations
      results.push('\n📧 Sending invitations...');
      const invitations = creators.map(creator => ({
        casting_id: castingId,
        creator_id: creator.id,
        status: 'pending' as const,
      }));
      
      await supabase.from('casting_invitations').insert(invitations);
      await supabase
        .from('castings')
        .update({ status: 'inviting' as CastingStatus })
        .eq('id', castingId);
      
      results.push(`✅ Sent invitations to ${creators.length} creators`);
      results.push('📬 Invitation emails would be sent in production');

      // Step 5: Simulate 2 creators accepting
      results.push('\n✋ Simulating creator responses...');
      const acceptingCreators = creators.slice(0, 2);
      
      for (const creator of acceptingCreators) {
        await supabase
          .from('casting_invitations')
          .update({
            status: 'accepted',
            responded_at: new Date().toISOString(),
          })
          .eq('casting_id', castingId)
          .eq('creator_id', creator.id);
        
        await supabase
          .from('creator_submissions')
          .insert({
            casting_id: castingId,
            creator_id: creator.id,
            submission_status: 'pending',
          });
        
        results.push(`✅ ${creator.first_name} ${creator.last_name} accepted`);
      }

      // Step 6: Social Bubble selects creators
      results.push('\n🎯 Social Bubble selecting creators...');
      const selections = acceptingCreators.map(creator => ({
        casting_id: castingId,
        creator_id: creator.id,
        selected_by: user.id,
        selected_by_role: 'social_bubble' as const,
      }));
      
      await supabase.from('casting_selections').insert(selections);
      await supabase
        .from('castings')
        .update({ status: 'send_client_feedback' as CastingStatus })
        .eq('id', castingId);
      
      results.push('✅ Selected 2 creators for client review');
      results.push('📬 Client notification email would be sent');

      // Step 6.5: Create and link an approved briefing
      results.push('\n📋 Creating approved briefing...');
      const { data: briefing, error: briefingError } = await supabase
        .from('briefings')
        .insert({
          client_id: client.id,
          title: `Test Briefing for ${casting.title}`,
          content: 'Test briefing content for workflow testing',
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          created_by: user.id,
        })
        .select()
        .single();
      
      if (!briefingError && briefing) {
        // Link briefing to casting
        await supabase
          .from('casting_briefing_links')
          .insert({
            casting_id: castingId,
            briefing_id: briefing.id,
            linked_by: user.id,
          });
        
        results.push(`✅ Created and linked approved briefing: ${briefing.title}`);
      } else {
        results.push('⚠️ Could not create briefing - folders will not be created automatically');
      }

      // Step 7: Client approves creators
      results.push('\n👍 Client approving creators...');
      const clientSelections = acceptingCreators.map(creator => ({
        casting_id: castingId,
        creator_id: creator.id,
        selected_by: user.id, // Simulating as client
        selected_by_role: 'client' as const,
      }));
      
      await supabase.from('casting_selections').insert(clientSelections);
      
      // Check for approved briefing
      const { data: briefingLinks } = await supabase
        .from('casting_briefing_links')
        .select('briefing:briefings!inner(status)')
        .eq('casting_id', castingId);
      
      const hasApprovedBriefing = briefingLinks?.some(
        link => {
          const briefing = link.briefing as any;
          return briefing && !Array.isArray(briefing) && briefing.status === 'approved';
        }
      ) || false;
      
      const newStatus = hasApprovedBriefing ? 'shooting' : 'approved_by_client';
      
      await supabase
        .from('castings')
        .update({ status: newStatus as CastingStatus })
        .eq('id', castingId);
      
      results.push(`✅ Client approved both creators`);
      results.push(`📊 Casting status: ${newStatus}`);
      results.push('📬 Creator notification emails would be sent');
      
      if (newStatus === 'shooting' && client.drive_folder_url) {
        results.push('📁 Google Drive folders will be created automatically');
        results.push('⏳ Waiting for folder creation...');
        
        // Wait a bit for the folders to be created
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Step 8: Check Drive folders
      results.push('\n📁 Checking Drive folders...');
      const { data: submissions } = await supabase
        .from('creator_submissions')
        .select('*, creator:creators(first_name, last_name)')
        .eq('casting_id', castingId);
      
      if (submissions) {
        for (const submission of submissions) {
          if (submission.drive_folder_url) {
            results.push(`✅ Drive folder for ${submission.creator.first_name}: ${submission.drive_folder_url}`);
          } else {
            results.push(`⏳ Drive folder for ${submission.creator.first_name} pending (requires client Drive setup)`);
          }
        }
      }

      // Step 9: Simulate creator submission
      results.push('\n📤 Simulating creator submission...');
      const submittingCreator = acceptingCreators[0];
      
      await supabase
        .from('creator_submissions')
        .update({
          content_upload_link: 'https://drive.google.com/test-submission',
          submission_status: 'pending_review',
          submitted_at: new Date().toISOString(),
        })
        .eq('casting_id', castingId)
        .eq('creator_id', submittingCreator.id);
      
      results.push(`✅ ${submittingCreator.first_name} submitted their work`);

      // Final summary
      results.push('\n📊 WORKFLOW TEST COMPLETED SUCCESSFULLY!');
      results.push('\n🔔 In production, the following would happen automatically:');
      results.push('   - Email notifications at each step');
      results.push('   - Slack notifications for key events');
      results.push('   - Google Drive folder creation (if configured)');
      results.push('   - Automation webhooks triggered');
      
      results.push(`\n🧹 Test casting ID: ${castingId}`);
      results.push('ℹ️ This test data will remain in the database for inspection');

      return {
        success: true,
        results,
        castingId,
      };

    } catch (error) {
      // Cleanup on error
      if (castingId) {
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
        if (briefingLinks && briefingLinks.length > 0) {
          const briefingIds = briefingLinks.map(link => link.briefing_id);
          await supabase
            .from('briefings')
            .delete()
            .in('id', briefingIds)
            .like('title', 'Test Briefing%');
        }
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

export async function cleanupTestCasting(castingId: string) {
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

    // Get linked briefings before deleting links
    const { data: briefingLinks } = await supabase
      .from('casting_briefing_links')
      .select('briefing_id')
      .eq('casting_id', castingId);
    
    // Cleanup in correct order
    await supabase.from('creator_submissions').delete().eq('casting_id', castingId);
    await supabase.from('casting_selections').delete().eq('casting_id', castingId);
    await supabase.from('casting_invitations').delete().eq('casting_id', castingId);
    await supabase.from('casting_briefing_links').delete().eq('casting_id', castingId);
    await supabase.from('castings').delete().eq('id', castingId);
    
    // Delete test briefings
    if (briefingLinks && briefingLinks.length > 0) {
      const briefingIds = briefingLinks.map(link => link.briefing_id);
      await supabase
        .from('briefings')
        .delete()
        .in('id', briefingIds)
        .like('title', 'Test Briefing%');
    }

    return { success: true, message: 'Test casting cleaned up successfully' };
  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cleanup',
    };
  }
}