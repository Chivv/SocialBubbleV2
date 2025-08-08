import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
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

  // Check profile completion and redirect
  switch (roleData.role) {
    case 'creator': {
      const { data: creatorProfile } = await supabase
        .from('creators')
        .select('id')
        .eq('clerk_user_id', user.id)
        .maybeSingle();
      
      if (!creatorProfile) {
        redirect('/signup/creator');
      }
      redirect('/dashboard/creator');
      break;
    }
    
    case 'client': {
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('clerk_user_id', user.id)
        .maybeSingle();
      
      if (!clientUser) {
        redirect('/signup/client');
      }
      redirect('/dashboard/client');
      break;
    }
    
    case 'social_bubble': {
      redirect('/dashboard/social-bubble');
      break;
    }
    
    default:
      redirect('/onboarding');
  }
}