'use client';

import { Creator } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Mail, Phone, Globe, MapPin, Calendar, 
  Dog, Baby, User, Video, Image as ImageIcon, Languages 
} from 'lucide-react';
import { getLanguageLabel } from '@/lib/constants/languages';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/lib/hooks/use-user-role';

interface CreatorProfileViewProps {
  creator: Creator;
}

export default function CreatorProfileView({ creator }: CreatorProfileViewProps) {
  const router = useRouter();
  const { role } = useUserRole();

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
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Creator Profile</h1>
      </div>

      {/* Header Card with Key Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={creator.profile_picture_url || ''} />
                <AvatarFallback className="text-3xl">
                  {creator.first_name[0]}{creator.last_name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {creator.first_name} {creator.last_name}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {creator.gender.charAt(0).toUpperCase() + creator.gender.slice(1)}
                  </Badge>
                  <Badge variant="secondary">
                    Age: {calculateAge(creator.date_of_birth)}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    {getLanguageLabel(creator.primary_language)}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {creator.has_dog && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Dog className="h-3 w-3" />
                    Has Dog
                  </Badge>
                )}
                {creator.has_children && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Baby className="h-3 w-3" />
                    Has Children
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{creator.address}</span>
              </div>
            </div>

            {role === 'social_bubble' && (
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <a href={`mailto:${creator.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Age</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{calculateAge(creator.date_of_birth)} years</p>
            <p className="text-xs text-muted-foreground">
              Born {format(new Date(creator.date_of_birth), 'MMM d, yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Language</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{getLanguageLabel(creator.primary_language)}</p>
            <p className="text-xs text-muted-foreground">Primary language</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold">
              {creator.address}
            </p>
            <p className="text-xs text-muted-foreground">Full address</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {creator.gender.charAt(0).toUpperCase() + creator.gender.slice(1)}
            </p>
            <p className="text-xs text-muted-foreground">Identity</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="media" className="w-full">
        <TabsList className={`grid w-full ${role === 'social_bubble' ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="media">Photos & Video</TabsTrigger>
          <TabsTrigger value="personal">Personal Details</TabsTrigger>
          {role === 'social_bubble' && <TabsTrigger value="contact">Contact Info</TabsTrigger>}
        </TabsList>

        <TabsContent value="media" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <CardDescription>Creator's main profile picture</CardDescription>
              </CardHeader>
              <CardContent>
                {creator.profile_picture_url ? (
                  <div className="relative w-full h-[400px] max-w-md mx-auto">
                    <Image 
                      src={creator.profile_picture_url} 
                      alt={`${creator.first_name} ${creator.last_name}`}
                      fill
                      className="rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center aspect-square bg-muted rounded-lg">
                    <User className="h-20 w-20 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No photo uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Introduction Video</CardTitle>
                <CardDescription>Personal introduction from the creator</CardDescription>
              </CardHeader>
              <CardContent>
                {creator.introduction_video_url ? (
                  <div className="w-full max-h-[400px] flex items-center justify-center">
                    <video 
                      controls 
                      className="rounded-lg w-full max-h-[400px] object-contain"
                      src={creator.introduction_video_url}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center aspect-video bg-muted rounded-lg">
                    <Video className="h-20 w-20 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No video uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Detailed information about the creator</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                    <p className="font-medium">{creator.first_name} {creator.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-medium">{format(new Date(creator.date_of_birth), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Gender</p>
                    <p className="font-medium">{creator.gender.charAt(0).toUpperCase() + creator.gender.slice(1)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Primary Language</p>
                    <p className="font-medium">{getLanguageLabel(creator.primary_language)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Has Dog</p>
                    <p className="font-medium flex items-center gap-2">
                      {creator.has_dog ? (
                        <>Yes <Dog className="h-4 w-4 text-green-600" /></>
                      ) : (
                        'No'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Has Children</p>
                    <p className="font-medium flex items-center gap-2">
                      {creator.has_children ? (
                        <>Yes <Baby className="h-4 w-4 text-green-600" /></>
                      ) : (
                        'No'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {role === 'social_bubble' && (
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Ways to reach the creator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                    <a href={`mailto:${creator.email}`} className="font-medium hover:underline">
                      {creator.email}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{creator.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="font-medium">{creator.address}</p>
                  </div>
                </div>

                {creator.website_url && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Website</p>
                      <a 
                        href={creator.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:underline text-blue-600"
                      >
                        {creator.website_url}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Account Metadata - Only for Social Bubble */}
      {role === 'social_bubble' && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Member since {format(new Date(creator.created_at), 'MMMM d, yyyy')}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}