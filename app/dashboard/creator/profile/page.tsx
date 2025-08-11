'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Creator } from '@/types';
import { uploadProfilePicture, uploadIntroductionVideo, deleteProfilePicture, deleteIntroductionVideo } from '@/lib/supabase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { languages } from '@/lib/constants/languages';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  primary_language: z.string().min(1, 'Primary language is required'),
  has_dog: z.string(),
  has_children: z.string(),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  website_url: z.string().url().optional().or(z.literal('')),
  profile_picture: z
    .any()
    .optional()
    .refine(
      (file) => !file || file instanceof File,
      'Please select a valid file'
    )
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      (file) => !file || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      'File must be an image (JPG, PNG, GIF, or WebP)'
    ),
  introduction_video: z
    .any()
    .optional()
    .refine(
      (file) => !file || file instanceof File,
      'Please select a valid file'
    )
    .refine(
      (file) => !file || file.size <= 500 * 1024 * 1024,
      'File size must be less than 500MB'
    ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditCreatorProfile() {
  const router = useRouter();
  const { user } = useUser();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      primary_language: '',
      has_dog: 'no',
      has_children: 'no',
      phone: '',
      address: '',
      website_url: '',
    },
  });

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
          setProfilePicturePreview(data.profile_picture_url || null);
          setVideoPreview(data.introduction_video_url || null);
          form.reset({
            first_name: data.first_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            gender: data.gender,
            primary_language: data.primary_language,
            has_dog: data.has_dog ? 'yes' : 'no',
            has_children: data.has_children ? 'yes' : 'no',
            phone: data.phone,
            address: data.address,
            website_url: data.website_url || '',
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCreatorProfile();
  }, [user, form]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user || !creator) return;

    setSaving(true);
    try {
      const supabase = createClient();

      // Handle file uploads
      let profilePictureUrl: string | undefined = creator.profile_picture_url || undefined;
      let introductionVideoUrl: string | undefined = creator.introduction_video_url || undefined;

      // Upload new profile picture if provided
      if (data.profile_picture) {
        // Delete old picture if exists
        if (profilePictureUrl) {
          await deleteProfilePicture(profilePictureUrl);
        }
        
        const uploadedUrl = await uploadProfilePicture(data.profile_picture, user.id);
        if (!uploadedUrl) {
          throw new Error('Failed to upload profile picture');
        }
        profilePictureUrl = uploadedUrl;
      }

      // Upload new introduction video if provided
      if (data.introduction_video) {
        // Delete old video if exists
        if (introductionVideoUrl) {
          await deleteIntroductionVideo(introductionVideoUrl);
        }
        
        const uploadedVideoUrl = await uploadIntroductionVideo(data.introduction_video, user.id);
        if (!uploadedVideoUrl) {
          throw new Error('Failed to upload introduction video');
        }
        introductionVideoUrl = uploadedVideoUrl;
      }

      const { error } = await supabase
        .from('creators')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          primary_language: data.primary_language,
          has_dog: data.has_dog === 'yes',
          has_children: data.has_children === 'yes',
          phone: data.phone,
          address: data.address,
          website_url: data.website_url || null,
          profile_picture_url: profilePictureUrl,
          introduction_video_url: introductionVideoUrl,
        })
        .eq('clerk_user_id', user.id);

      if (error) throw error;

      router.push('/dashboard/creator');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/creator">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} className={form.formState.errors.first_name ? "border-red-500" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} className={form.formState.errors.last_name ? "border-red-500" : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className={form.formState.errors.date_of_birth ? "border-red-500" : ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primary_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Language</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="has_dog"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you have a dog?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_children"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you have children?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} className={form.formState.errors.phone ? "border-red-500" : ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Address</FormLabel>
                    <FormControl>
                      <Input {...field} className={form.formState.errors.address ? "border-red-500" : ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website/Portfolio URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} className={form.formState.errors.website_url ? "border-red-500" : ""} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profile_picture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.webp"
                        className={form.formState.errors.profile_picture ? "border-red-500" : ""}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfilePicturePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      JPG, PNG, GIF, or WebP (Max 5MB)
                    </FormDescription>
                    <FormMessage />
                    {profilePicturePreview && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Current/Preview:</p>
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="rounded-lg max-w-xs w-full object-cover"
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="introduction_video"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Introduction Video</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="*"
                        className={form.formState.errors.introduction_video ? "border-red-500" : ""}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file);
                          if (file) {
                            const videoUrl = URL.createObjectURL(file);
                            setVideoPreview(videoUrl);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      All video formats accepted (Max 500MB)
                    </FormDescription>
                    <FormMessage />
                    {videoPreview && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Current/Preview:</p>
                        <video
                          controls
                          src={videoPreview}
                          className="rounded-lg max-w-sm w-full"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Link href="/dashboard/creator">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}