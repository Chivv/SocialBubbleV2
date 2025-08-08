import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { TriggerDetailClient } from './trigger-detail-client';
import { getTriggerDefinition } from '@/lib/automations/triggers';

interface PageProps {
  params: {
    trigger: string;
  };
}

export default async function TriggerDetailPage({ params }: PageProps) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  const email = user.emailAddresses?.[0]?.emailAddress;
  const isAuthorized = email === 'bas@bubbleads.nl' || email === 'kaylie@bubbleads.nl';
  
  if (!isAuthorized) {
    redirect('/dashboard');
  }

  const trigger = getTriggerDefinition(params.trigger);
  
  if (!trigger) {
    redirect('/dashboard/settings/automations');
  }

  return <TriggerDetailClient triggerName={params.trigger} />;
}