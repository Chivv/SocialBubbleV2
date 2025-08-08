import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { EditingClient } from './editing-client';

export default async function EditingPage() {
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

  return <EditingClient />;
}