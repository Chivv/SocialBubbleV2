import { Suspense } from 'react';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import CreativeStrategyClientView from './creative-strategy-client-view';

export default async function ClientCreativeStrategyPage() {
  const user = await currentUser();
  if (!user) {
    return <div>Not authenticated</div>;
  }

  const supabase = createServiceClient();
  
  // Get the client ID for this user
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('clerk_user_id', user.id)
    .single();

  if (!clientUser) {
    return <div>Client not found</div>;
  }

  // Get the creative strategy for this client
  const { data: strategy } = await supabase
    .from('creative_strategies')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('client_id', clientUser.client_id)
    .single();

  // Get comments if strategy exists and is visible
  let comments = [];
  if (strategy && ['sent_client_feedback', 'client_feedback_given', 'approved'].includes(strategy.status)) {
    const { data: strategyComments } = await supabase
      .from('creative_strategy_comments')
      .select('*')
      .eq('creative_strategy_id', strategy.id)
      .order('created_at', { ascending: true });

    // Enhance comments with user info
    if (strategyComments) {
      const clerk = await clerkClient();
      comments = await Promise.all(
        strategyComments.map(async (comment) => {
          try {
            const clerkUser = await clerk.users.getUser(comment.user_id);
            return {
              ...comment,
              user: {
                name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 
                      clerkUser.username || 
                      clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                      'Unknown User',
                email: clerkUser.emailAddresses[0]?.emailAddress
              }
            };
          } catch (error) {
            console.error(`Failed to fetch user ${comment.user_id}:`, error);
            return {
              ...comment,
              user: { name: 'Unknown User' }
            };
          }
        })
      );
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreativeStrategyClientView 
        strategy={strategy}
        comments={comments}
        currentUserId={user.id}
      />
    </Suspense>
  );
}