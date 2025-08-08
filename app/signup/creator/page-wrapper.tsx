'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CreatorSignupForm from './creator-signup-form';

export default function CreatorSignupPageWrapper() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [hasCreatorRole, setHasCreatorRole] = useState(false);
  const [checking, setChecking] = useState(true);

  // Handle redirect for non-authenticated users
  useEffect(() => {
    if (isLoaded && !user && !checking) {
      const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent('/signup/creator')}`;
      router.push(signUpUrl);
    }
  }, [isLoaded, user, checking, router]);

  // Check and assign role
  useEffect(() => {
    async function checkAndAssignRole() {
      if (!isLoaded) return;
      
      if (!user) {
        setChecking(false);
        return;
      }

      const supabase = createClient();
      
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('clerk_user_id', user.id)
        .single();

      if (existingRole) {
        if (existingRole.role === 'creator') {
          // Check if creator profile exists
          const { data: creatorProfile } = await supabase
            .from('creators')
            .select('id')
            .eq('clerk_user_id', user.id)
            .single();
          
          if (creatorProfile) {
            // Creator already has a profile, redirect to dashboard
            router.push('/dashboard/creator');
          } else {
            // Has role but no profile, show form
            setHasCreatorRole(true);
            setChecking(false);
          }
        } else {
          // User has a different role, redirect appropriately
          if (existingRole.role === 'client') {
            router.push('/dashboard/client');
          } else {
            router.push('/dashboard');
          }
        }
      } else {
        // No role assigned, assign creator role
        try {
          const { error } = await supabase
            .from('user_roles')
            .insert({
              clerk_user_id: user.id,
              role: 'creator',
            });

          if (!error) {
            setHasCreatorRole(true);
          }
        } catch (error) {
          console.error('Error assigning creator role:', error);
        }
        setChecking(false);
      }
    }

    checkAndAssignRole();
  }, [user, isLoaded, router]);

  // Show loading while checking
  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we set up your account</p>
        </div>
      </div>
    );
  }

  // If user is not signed in, show loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Redirecting to sign up...</h2>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  // If user is signed in and has creator role, show the form
  if (user && hasCreatorRole) {
    return <CreatorSignupForm />;
  }

  // Fallback
  return null;
}