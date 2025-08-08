import { getApprovedSubmissionsWithoutInvoice } from '@/app/actions/creator-invoices';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import NewInvoiceClient from './new-invoice-client';

export default async function NewInvoicePage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const supabase = createServiceClient();
  
  // Get creator details
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('clerk_user_id', user.id)
    .single();

  if (!creator) {
    redirect('/dashboard');
  }

  const submissions = await getApprovedSubmissionsWithoutInvoice();

  if (submissions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Submit Invoice</h1>
        <p>No approved submissions available for invoicing.</p>
      </div>
    );
  }

  return <NewInvoiceClient creator={creator} submissions={submissions} />;
}