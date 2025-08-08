import { getCreatorInvoices } from '@/app/actions/creator-invoices';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CreatorInvoicesClient from './creator-invoices-client';

export default async function CreatorInvoicesPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const invoices = await getCreatorInvoices();

  return <CreatorInvoicesClient invoices={invoices} />;
}