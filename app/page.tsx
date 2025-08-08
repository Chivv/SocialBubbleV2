'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Building2, Users, UserCircle } from 'lucide-react';

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">
          Social Bubble Internal Platform
        </h1>
        <p className="text-xl text-muted-foreground">
          The all-in-one platform for managing creators, clients, and campaigns
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/sign-in">
            <Button size="lg" className="w-full sm:w-auto">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Or create a new account as:</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up?redirect_url=/onboarding">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <UserCircle className="mr-2 h-4 w-4" />
                Sign Up as Creator
              </Button>
            </Link>
            <Link href="/sign-up?redirect_url=/onboarding">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Building2 className="mr-2 h-4 w-4" />
                Sign Up as Client
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <UserCircle className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-semibold">Creators</h3>
            <p className="text-sm text-muted-foreground">
              Manage your profile and showcase your creative work
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-semibold">Clients</h3>
            <p className="text-sm text-muted-foreground">
              Access your campaigns and collaborate with creators
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-semibold">Team</h3>
            <p className="text-sm text-muted-foreground">
              Oversee all platform activity and manage relationships
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}