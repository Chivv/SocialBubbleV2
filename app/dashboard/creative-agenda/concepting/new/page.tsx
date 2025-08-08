import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NewConceptClient } from './new-concept-client';

export default async function NewConceptPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const supabase = createServiceClient();
  
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('clerk_user_id', user.id)
    .single();

  if (roleData?.role !== 'social_bubble') {
    redirect('/dashboard');
  }

  // Get all clients for the select dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .order('company_name');

  return <NewConceptClient clients={clients || []} />;
}