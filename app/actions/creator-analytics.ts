'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function getCreatorEarnings() {
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
      return null;
    }

    // Get all invoices for this creator
    const { data: invoices } = await supabase
      .from('creator_invoices')
      .select(`
        id,
        deal_amount,
        status,
        submitted_at,
        paid_at,
        casting:castings(title)
      `)
      .eq('creator_id', creator.id)
      .order('submitted_at', { ascending: false });

    // Calculate totals
    const totalEarnings = invoices?.reduce((sum, inv) => sum + Number(inv.deal_amount), 0) || 0;
    const pendingPayments = invoices?.filter(inv => inv.status === 'pending_payment')
      .reduce((sum, inv) => sum + Number(inv.deal_amount), 0) || 0;
    const paidAmount = invoices?.filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.deal_amount), 0) || 0;
    
    // Calculate monthly earnings for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyEarnings = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthInvoices = invoices?.filter(inv => {
        const invDate = new Date(inv.submitted_at);
        return invDate >= monthStart && invDate <= monthEnd;
      }) || [];
      
      const monthTotal = monthInvoices.reduce((sum, inv) => sum + Number(inv.deal_amount), 0);
      
      monthlyEarnings.unshift({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: monthTotal
      });
    }

    return {
      totalEarnings,
      pendingPayments,
      paidAmount,
      invoiceCount: invoices?.length || 0,
      averagePerCampaign: invoices?.length ? totalEarnings / invoices.length : 0,
      monthlyEarnings,
      recentInvoices: invoices?.slice(0, 5) || []
    };
  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    return null;
  }
}

export async function getCreatorOpportunityStats() {
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
      return null;
    }

    // Get all invitations
    const { data: invitations } = await supabase
      .from('casting_invitations')
      .select(`
        id,
        status,
        invited_at,
        responded_at,
        casting:castings(
          id,
          title,
          status,
          compensation
        )
      `)
      .eq('creator_id', creator.id)
      .order('invited_at', { ascending: false });

    // Get selections
    const { data: selections } = await supabase
      .from('casting_selections')
      .select(`
        id,
        selected_by_role,
        casting:castings(
          id,
          title,
          compensation
        )
      `)
      .eq('creator_id', creator.id);

    // Calculate stats
    const totalInvitations = invitations?.length || 0;
    const pendingInvitations = invitations?.filter(inv => inv.status === 'pending').length || 0;
    const acceptedInvitations = invitations?.filter(inv => inv.status === 'accepted').length || 0;
    const rejectedInvitations = invitations?.filter(inv => inv.status === 'rejected').length || 0;
    const clientSelections = selections?.filter(sel => sel.selected_by_role === 'client').length || 0;

    // Calculate rates
    const responseRate = totalInvitations > 0 
      ? ((acceptedInvitations + rejectedInvitations) / totalInvitations) * 100 
      : 0;
    const acceptanceRate = totalInvitations > 0 
      ? (acceptedInvitations / totalInvitations) * 100 
      : 0;
    const selectionRate = acceptedInvitations > 0 
      ? (clientSelections / acceptedInvitations) * 100 
      : 0;

    // Get active opportunities (pending invitations with active castings)
    const activeOpportunities = invitations?.filter(inv => 
      inv.status === 'pending' && 
      inv.casting?.status && 
      ['inviting', 'check_intern'].includes(inv.casting.status)
    ) || [];

    return {
      totalInvitations,
      pendingInvitations,
      acceptedInvitations,
      rejectedInvitations,
      clientSelections,
      responseRate,
      acceptanceRate,
      selectionRate,
      activeOpportunities: activeOpportunities.map(opp => ({
        id: opp.id,
        title: opp.casting?.title || 'Unknown',
        compensation: opp.casting?.compensation || 0,
        invitedAt: opp.invited_at
      })),
      missedOpportunities: rejectedInvitations
    };
  } catch (error) {
    console.error('Error fetching opportunity stats:', error);
    return null;
  }
}

export async function getActiveSubmissions() {
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
      return null;
    }

    // Get active submissions
    const { data: submissions } = await supabase
      .from('creator_submissions')
      .select(`
        id,
        submission_status,
        content_upload_link,
        submitted_at,
        feedback,
        feedback_at,
        casting:castings(
          id,
          title,
          status,
          compensation
        ),
        briefing_links:casting_briefing_links!casting_id(
          briefing:briefings(
            id,
            title,
            content
          )
        )
      `)
      .eq('creator_id', creator.id)
      .in('submission_status', ['pending', 'submitted', 'pending_review', 'revision_requested'])
      .order('created_at', { ascending: false });

    // Categorize submissions
    const pendingSubmission = submissions?.filter(s => s.submission_status === 'pending') || [];
    const inReview = submissions?.filter(s => 
      ['submitted', 'pending_review'].includes(s.submission_status)
    ) || [];
    const needsRevision = submissions?.filter(s => s.submission_status === 'revision_requested') || [];

    // Get completed submissions for stats
    const { data: completedSubmissions } = await supabase
      .from('creator_submissions')
      .select('id, submission_status, submitted_at, approved_at')
      .eq('creator_id', creator.id)
      .eq('submission_status', 'approved');

    const totalCompleted = completedSubmissions?.length || 0;

    // Calculate average turnaround time
    let avgTurnaround = 0;
    if (completedSubmissions && completedSubmissions.length > 0) {
      const turnarounds = completedSubmissions
        .filter(s => s.submitted_at && s.approved_at)
        .map(s => {
          const submitted = new Date(s.submitted_at!);
          const approved = new Date(s.approved_at!);
          return (approved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24); // Days
        });
      
      if (turnarounds.length > 0) {
        avgTurnaround = turnarounds.reduce((sum, t) => sum + t, 0) / turnarounds.length;
      }
    }

    return {
      pendingSubmission: pendingSubmission.map(s => ({
        id: s.id,
        castingTitle: s.casting?.title || 'Unknown',
        briefingTitle: s.briefing_links?.[0]?.briefing?.title || 'No briefing linked',
        status: s.submission_status,
        compensation: s.casting?.compensation || 0
      })),
      inReview: inReview.map(s => ({
        id: s.id,
        castingTitle: s.casting?.title || 'Unknown',
        status: s.submission_status,
        submittedAt: s.submitted_at
      })),
      needsRevision: needsRevision.map(s => ({
        id: s.id,
        castingTitle: s.casting?.title || 'Unknown',
        feedback: s.feedback,
        feedbackAt: s.feedback_at
      })),
      totalActive: submissions?.length || 0,
      totalCompleted,
      avgTurnaroundDays: avgTurnaround
    };
  } catch (error) {
    console.error('Error fetching active submissions:', error);
    return null;
  }
}

export async function getCreatorPerformanceMetrics() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();

    // Get creator data
    const { data: creator } = await supabase
      .from('creators')
      .select('id, created_at')
      .eq('clerk_user_id', user.id)
      .single();

    if (!creator) {
      return null;
    }

    // Get all completed campaigns
    const { data: completedCampaigns } = await supabase
      .from('creator_submissions')
      .select(`
        id,
        approved_at,
        casting:castings(
          id,
          title,
          status
        )
      `)
      .eq('creator_id', creator.id)
      .eq('submission_status', 'approved');

    // Calculate member duration
    const memberSince = new Date(creator.created_at);
    const now = new Date();
    const monthsSinceMember = (now.getFullYear() - memberSince.getFullYear()) * 12 + 
                              (now.getMonth() - memberSince.getMonth());

    return {
      totalCampaignsCompleted: completedCampaigns?.length || 0,
      memberSince: creator.created_at,
      monthsActive: monthsSinceMember,
      recentCompletions: completedCampaigns?.slice(0, 3).map(c => ({
        id: c.id,
        title: c.casting?.title || 'Unknown',
        completedAt: c.approved_at
      })) || []
    };
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return null;
  }
}