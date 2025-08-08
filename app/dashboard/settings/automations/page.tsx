import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AutomationsOverview } from './automations-overview';

export default async function AutomationsPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  const email = user.emailAddresses?.[0]?.emailAddress;
  const isAuthorized = email === 'bas@bubbleads.nl' || email === 'kaylie@bubbleads.nl';
  
  if (!isAuthorized) {
    redirect('/dashboard');
  }

  return <AutomationsOverview />;
}