import { getImportedCreators } from '@/app/actions/creator-imports';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CreatorImportsClient from './creator-imports-client';

export default async function CreatorImportsPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  const email = user.emailAddresses?.[0]?.emailAddress;
  if (email !== 'bas@bubbleads.nl') {
    redirect('/dashboard');
  }
  
  const creators = await getImportedCreators();
  
  return <CreatorImportsClient initialCreators={creators} />;
}