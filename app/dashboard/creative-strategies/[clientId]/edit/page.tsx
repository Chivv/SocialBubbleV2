import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import EditCreativeStrategyClient from './edit-creative-strategy-client';
import { getCreativeStrategyByClient, getClients, createCreativeStrategyIfNotExists } from '@/app/actions/creative-strategies';
import { getGlobalPlaceholders } from '@/app/actions/placeholders';

interface PageProps {
  params: Promise<{
    clientId: string;
  }>;
}

export default async function EditCreativeStrategyPage({ params }: PageProps) {
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

  const [clients, globalPlaceholders] = await Promise.all([
    getClients(),
    getGlobalPlaceholders()
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditCreativeStrategyClient 
        strategy={strategy!} 
        clients={clients}
        globalPlaceholders={globalPlaceholders}
      />
    </Suspense>
  );
}