import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';

export async function GET() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const supabase = createServiceClient();
  
  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('clerk_user_id', user.id)
    .single();

  if (!roleData) {
    redirect('/onboarding');
  }

  // Redirect based on role
  switch (roleData.role) {
    case 'creator':
      redirect('/dashboard/creator');
    case 'client':
      redirect('/dashboard/client');
    case 'social_bubble':
      redirect('/dashboard/social-bubble');
    default:
      redirect('/dashboard');
  }
}