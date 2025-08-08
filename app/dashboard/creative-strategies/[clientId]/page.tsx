import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import CreativeStrategyDetailClient from './creative-strategy-detail-client';
import { getCreativeStrategyByClient, getComments, createCreativeStrategyIfNotExists } from '@/app/actions/creative-strategies';
import { clerkClient } from '@clerk/nextjs/server';

interface PageProps {
  params: Promise<{
    clientId: string;
  }>;
}

export default async function CreativeStrategyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  let strategy = await getCreativeStrategyByClient(resolvedParams.clientId);

  // If no strategy exists, create one
  if (!strategy) {
    const result = await createCreativeStrategyIfNotExists(resolvedParams.clientId);
    if (result.success) {
      // Refresh to get the newly created strategy
      strategy = await getCreativeStrategyByClient(resolvedParams.clientId);
    } else {
      // If creation failed, redirect to strategies list
      redirect('/dashboard/creative-strategies');
    }
  }

  // Get comments for this strategy
  const strategyComments = strategy ? await getComments(strategy.id) : [];
  
  // Enhance comments with user info
  const enhancedComments = await Promise.all(
    strategyComments.map(async (comment) => {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(comment.user_id);
        return {
          ...comment,
          user: {
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                  user.username || 
                  user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                  'Unknown User',
            email: user.emailAddresses[0]?.emailAddress
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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreativeStrategyDetailClient 
        strategy={strategy!} 
        comments={enhancedComments}
      />
    </Suspense>
  );
}