'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { Creator } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getLanguageLabel } from '@/lib/constants/languages';

export default function CreatorDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreatorProfile() {
      if (!user) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('creators')
          .select('*')
          .eq('clerk_user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching creator profile:', error);
        } else if (data) {
          setCreator(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCreatorProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!creator) {
    // Redirect to creator signup if profile not found
    router.push('/signup/creator');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Redirecting to complete your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/creator/opportunities">
            <Button variant="outline">
              <Camera className="mr-2 h-4 w-4" />
              Opportunities
            </Button>
          </Link>
          <Link href="/dashboard/creator/profile">
            <Button>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your basic profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={creator.profile_picture_url || ''} />
                <AvatarFallback>
                  {creator.first_name[0]}{creator.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">
                  {creator.first_name} {creator.last_name}
                </h3>
                <p className="text-muted-foreground">{creator.email}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <div>
                <span className="font-medium">Phone:</span> {creator.phone}
              </div>
              <div>
                <span className="font-medium">Language:</span> {getLanguageLabel(creator.primary_language)}
              </div>
              <div>
                <span className="font-medium">Gender:</span> {creator.gender}
              </div>
              <div>
                <span className="font-medium">Date of Birth:</span>{' '}
                {new Date(creator.date_of_birth).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Other details about you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div>
                <span className="font-medium">Address:</span> {creator.address}
              </div>
              {creator.website_url && (
                <div>
                  <span className="font-medium">Website:</span>{' '}
                  <a
                    href={creator.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {creator.website_url}
                  </a>
                </div>
              )}
              <div>
                <span className="font-medium">Has Dog:</span>{' '}
                {creator.has_dog ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Has Children:</span>{' '}
                {creator.has_children ? 'Yes' : 'No'}
              </div>
            </div>

            {creator.introduction_video_url && (
              <div>
                <span className="font-medium">Introduction Video:</span>
                <video
                  src={creator.introduction_video_url}
                  controls
                  className="mt-2 w-full rounded-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Your account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div>
              <span className="font-medium">Member Since:</span>{' '}
              {new Date(creator.created_at).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {new Date(creator.updated_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}