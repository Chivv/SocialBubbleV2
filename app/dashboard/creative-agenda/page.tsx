import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';

export default async function CreativeAgendaPage() {
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

  // Redirect to concepting page as the default Creative Agenda view
  redirect('/dashboard/creative-agenda/concepting');
}