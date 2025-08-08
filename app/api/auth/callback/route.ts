import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_URL));
    }

    // Check if user already has a role
    const supabase = await createClient();
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .maybeSingle();

    if (roleData) {
      // User has a role, redirect to appropriate dashboard
      switch (roleData.role) {
        case 'creator':
          return NextResponse.redirect(new URL('/dashboard/creator', process.env.NEXT_PUBLIC_URL));
        case 'client':
          return NextResponse.redirect(new URL('/dashboard/client', process.env.NEXT_PUBLIC_URL));
        case 'social_bubble':
          return NextResponse.redirect(new URL('/dashboard/social-bubble', process.env.NEXT_PUBLIC_URL));
        default:
          return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_URL));
      }
    } else {
      // No role yet, go to onboarding
      return NextResponse.redirect(new URL('/onboarding', process.env.NEXT_PUBLIC_URL));
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/onboarding', process.env.NEXT_PUBLIC_URL));
  }
}