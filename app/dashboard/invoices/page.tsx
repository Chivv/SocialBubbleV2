import { getAllInvoices } from '@/app/actions/creator-invoices';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import InvoiceManagementClient from './invoice-management-client';

export default async function InvoiceManagementPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const supabase = createServiceClient();
  
  // Check if user has social_bubble role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('clerk_user_id', user.id)
    .single();

  if (!roleData || roleData.role !== 'social_bubble') {
    redirect('/dashboard');
  }

  const invoices = await getAllInvoices();

  return <InvoiceManagementClient invoices={invoices} />;
}