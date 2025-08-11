'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { uploadProfilePicture, uploadIntroductionVideo } from '@/lib/supabase/storage';
import { triggerCreatorSignupAutomation } from '@/app/actions/creators';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { languages } from '@/lib/constants/languages';

// Define schemas for each step
const step1Schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  primary_language: z.string().min(1, 'Primary language is required'),
  has_dog: z.string(),
  has_children: z.string(),
});

const step2Schema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  website_url: z.string().url().optional().or(z.literal('')),
});

const step3Schema = z.object({
  profile_picture: z
    .any()
    .refine(
      (file) => file && file instanceof File,
      'Profile picture is required'
    )
    .refine(
      (file) => file && file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      (file) => file && ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
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

// Combined schema
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FormData = z.infer<typeof fullSchema>;

export default function CreatorSignupForm() {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  // Check if user signed up with OAuth
  const isOAuthUser = user?.primaryEmailAddress?.verification?.strategy?.startsWith('oauth');

  const form = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      primary_language: '',
      has_dog: 'no',
      has_children: 'no',
      email: user?.emailAddresses[0]?.emailAddress || '',
      phone: '',
      address: '',
      website_url: '',
    },
  });

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof FormData)[] = [];
    
    switch (step) {
      case 1:
        fieldsToValidate = ['first_name', 'last_name', 'date_of_birth', 'gender', 'primary_language', 'has_dog', 'has_children'];
        break;
      case 2:
        fieldsToValidate = ['email', 'phone', 'address', 'website_url'];
        break;
      case 3:
        fieldsToValidate = ['profile_picture', 'introduction_video'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // Upload files if provided
      let profilePictureUrl = null;
      let introductionVideoUrl = null;

      if (data.profile_picture) {
        profilePictureUrl = await uploadProfilePicture(data.profile_picture, user.id);
        if (!profilePictureUrl) {
          throw new Error('Failed to upload profile picture');
        }
      }

      if (data.introduction_video) {
        introductionVideoUrl = await uploadIntroductionVideo(data.introduction_video, user.id);
        if (!introductionVideoUrl) {
          throw new Error('Failed to upload introduction video');
        }
      }

      // Insert creator data
      const { data: newCreator, error } = await supabase
        .from('creators')
        .insert({
          clerk_user_id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          primary_language: data.primary_language,
          has_dog: data.has_dog === 'yes',
          has_children: data.has_children === 'yes',
          email: data.email,
          phone: data.phone,
          address: data.address,
          website_url: data.website_url || null,
          profile_picture_url: profilePictureUrl || null,
          introduction_video_url: introductionVideoUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger signup automation
      if (newCreator) {
        await triggerCreatorSignupAutomation({
          id: newCreator.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          primary_language: data.primary_language,
          profile_picture_url: profilePictureUrl,
          introduction_video_url: introductionVideoUrl,
        });
      }

      // Redirect to dashboard
      router.push('/dashboard/creator');
    } catch (error) {
      console.error('Error creating creator profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Creator Registration</CardTitle>
            <CardDescription>
              Complete your profile to start offering creative services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <Progress value={(currentStep / 3) * 100} className="mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Step {currentStep} of 3
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                    <FormField
                      control={form.control}
                      name="has_dog"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you have a dog?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                )}

                {/* Step 2: Contact Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} className={form.formState.errors.email ? "border-red-500" : ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                  </div>
                )}

                {/* Step 3: Media Upload */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Media Upload</h3>
                    
                    <FormField
                      control={form.control}
                      name="profile_picture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture <span className="text-red-500">*</span></FormLabel>
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
                                } else {
                                  setProfilePicturePreview(null);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            JPG, PNG, GIF, or WebP (Max 5MB) - Required
                          </FormDescription>
                          <FormMessage />
                          {profilePicturePreview && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Preview:</p>
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
                                } else {
                                  setVideoPreview(null);
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
                              <p className="text-sm font-medium mb-2">Preview:</p>
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
                  </div>
                )}


                <div className="flex justify-between">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                    >
                      Previous
                    </Button>
                  )}
                  
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="ml-auto"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading || !form.getValues('profile_picture')}
                      className="ml-auto"
                    >
                      {loading ? 'Creating Profile...' : 'Complete Registration'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}