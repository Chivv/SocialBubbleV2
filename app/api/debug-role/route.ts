import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'No user' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Try to fetch user role
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('clerk_user_id', user.id);

    return NextResponse.json({
      clerkUserId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      roleData: data,
      error: error,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}