'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types';
import { Building2, Users, UserCircle } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(true);
  const [checkingRole, setCheckingRole] = useState(true);
  
  // Check if user came from creator signup
  const [searchParams] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return null;
  });
  const fromCreatorSignup = searchParams?.get('from') === 'creator';

  // Check if user already has a role or is from Social Bubble
  useEffect(() => {
    async function checkAndAssignRole() {
      if (!user || !user.emailAddresses[0]) {
        setCheckingEmail(false);
        setCheckingRole(false);
        return;
      }

      const supabase = createClient();
      
      // First check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('clerk_user_id', user.id)
        .single();

      if (existingRole) {
        // User already has a role, redirect to appropriate dashboard
        if (existingRole.role === 'creator') {
          // Check if creator profile exists
          const { data: creatorProfile } = await supabase
            .from('creators')
            .select('id')
            .eq('clerk_user_id', user.id)
            .single();
          
          if (creatorProfile) {
            router.push('/dashboard/creator');
          } else {
            router.push('/signup/creator');
          }
        } else if (existingRole.role === 'client') {
          // Check if client profile exists
          const { data: clientUser } = await supabase
            .from('client_users')
            .select('id')
            .eq('clerk_user_id', user.id)
            .single();
          
          if (clientUser) {
            router.push('/dashboard/client');
          } else {
            router.push('/signup/client');
          }
        } else {
          // social_bubble role
          router.push('/dashboard');
        }
        return;
      }

      setCheckingRole(false);

      const email = user.emailAddresses[0].emailAddress;
      const domain = email.split('@')[1];
      
      // Check if email domain is Social Bubble
      if (domain === 'socialbubble.nl' || domain === 'bubbleads.nl') {
        setLoading(true);
        try {
          // Insert user role as social_bubble
          const { error } = await supabase
            .from('user_roles')
            .insert({
              clerk_user_id: user.id,
              role: 'social_bubble' as UserRole,
            });

          if (error) throw error;

          // Redirect to Social Bubble dashboard
          router.push('/dashboard');
        } catch (error) {
          console.error('Error setting Social Bubble role:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setCheckingEmail(false);
      }
    }

    checkAndAssignRole();
  }, [user, router]);

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) return;

    setLoading(true);
    try {
      const supabase = createClient();
      
      // Insert user role (this should only be called for new users)
      const { error } = await supabase
        .from('user_roles')
        .insert({
          clerk_user_id: user.id,
          role: selectedRole,
        });

      if (error) throw error;

      // Note: publicMetadata updates need to be done server-side
      // For now, we'll rely on the database role

      // Redirect based on role
      if (selectedRole === 'creator') {
        router.push('/signup/creator');
      } else if (selectedRole === 'client') {
        router.push('/signup/client');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Error setting user role:', error);
      // Show error to user
      alert(`Error setting user role: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      role: 'client' as UserRole,
      title: 'Client',
      description: 'Business looking for creative services',
      icon: Building2,
    },
    {
      role: 'creator' as UserRole,
      title: 'Creator',
      description: 'Creative professional offering services',
      icon: UserCircle,
    },
  ];

  if (checkingEmail || checkingRole || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Setting up your account...</h2>
          <p className="text-muted-foreground">Please wait while we configure your access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Social Bubble</h1>
          <p className="text-muted-foreground">Please select your account type to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.role}
                className={`cursor-pointer transition-all ${
                  selectedRole === option.role
                    ? 'ring-2 ring-primary'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedRole(option.role)}
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <Icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-center">{option.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {option.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!selectedRole || loading}
            onClick={handleRoleSelection}
          >
            {loading ? 'Setting up...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}