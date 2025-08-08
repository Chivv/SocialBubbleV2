'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Creator } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Globe, MapPin, Calendar, Dog, Baby, User, Video } from 'lucide-react';
import { getLanguageLabel } from '@/lib/constants/languages';
import { format } from 'date-fns';
import Image from 'next/image';

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreator() {
      if (!params.id) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('creators')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Error fetching creator:', error);
          router.push('/dashboard/creators');
        } else if (data) {
          setCreator(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCreator();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading creator details...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Creator not found</p>
      </div>
    );
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/creators')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Creator Profile</h1>
      </div>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={creator.profile_picture_url || ''} />
              <AvatarFallback className="text-2xl">
                {creator.first_name[0]}{creator.last_name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {creator.first_name} {creator.last_name}
                </h2>
                <p className="text-muted-foreground">
                  {getLanguageLabel(creator.primary_language)} Speaker
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {creator.gender.charAt(0).toUpperCase() + creator.gender.slice(1)}
                </Badge>
                <Badge variant="outline">
                  Age: {calculateAge(creator.date_of_birth)}
                </Badge>
                {creator.has_dog && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Dog className="h-3 w-3" />
                    Has Dog
                  </Badge>
                )}
                {creator.has_children && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Baby className="h-3 w-3" />
                    Has Children
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild>
                <a href={`mailto:${creator.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              </Button>
              {creator.website_url && (
                <Button variant="outline" asChild>
                  <a href={creator.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Portfolio
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic information about the creator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-base">{creator.first_name} {creator.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="text-base">{format(new Date(creator.date_of_birth), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="text-base">{creator.gender.charAt(0).toUpperCase() + creator.gender.slice(1)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Primary Language</p>
                  <p className="text-base">{getLanguageLabel(creator.primary_language)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Has Dog</p>
                  <p className="text-base">{creator.has_dog ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Has Children</p>
                  <p className="text-base">{creator.has_children ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Ways to reach the creator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <a href={`mailto:${creator.email}`} className="text-base hover:underline">
                      {creator.email}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-base">{creator.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-base">{creator.address}</p>
                  </div>
                </div>

                {creator.website_url && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Website</p>
                      <a 
                        href={creator.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base hover:underline"
                      >
                        {creator.website_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media & Assets</CardTitle>
              <CardDescription>Profile picture and introduction video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {creator.profile_picture_url ? (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Profile Picture</p>
                  <div className="relative w-full max-w-sm aspect-square">
                    <Image 
                      src={creator.profile_picture_url} 
                      alt={`${creator.first_name} ${creator.last_name}`}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-muted rounded-lg">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No profile picture uploaded</p>
                </div>
              )}

              {creator.introduction_video_url ? (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Introduction Video</p>
                  <video 
                    controls 
                    className="rounded-lg max-w-full"
                    src={creator.introduction_video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="text-center py-8 bg-muted rounded-lg">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No introduction video uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {format(new Date(creator.created_at), 'MMMM d, yyyy')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}