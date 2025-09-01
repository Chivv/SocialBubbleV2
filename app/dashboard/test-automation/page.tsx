import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import TestAutomationClient from './test-automation-client';

export default async function TestAutomationPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  // Only allow bas@bubbleads.nl to access this page
  const email = user.emailAddresses?.[0]?.emailAddress;
  if (email !== 'bas@bubbleads.nl') {
    redirect('/dashboard');
  }
  
  return <TestAutomationClient />;
}