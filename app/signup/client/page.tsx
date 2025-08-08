'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, Plus, X } from 'lucide-react';

// Define schemas for each step
const step1Schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Please enter a valid URL'),
  interesting_competitors: z.string().optional(),
  differentiation: z.string().optional(),
  cool_ads_brands: z.string().optional(),
});

const step2Schema = z.object({
  content_folder_link: z.string().optional(),
  brand_assets: z.any().optional(),
  ideal_customer: z.string().optional(),
  customer_problems: z.string().optional(),
  customer_objections: z.string().optional(),
});

const step3Schema = z.object({
  recent_research: z.string().optional(),
  pricing_info: z.string().optional(),
  cold_friendly_offer: z.string().optional(),
});

const step4Schema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  contract_email: z.string().email('Invalid email address'),
  contract_full_name: z.string().min(1, 'Full name is required'),
  address: z.string().min(1, 'Address is required'),
  kvk: z.string().min(1, 'KVK number is required'),
  invoice_details: z.string().optional(),
});

const step5Schema = z.object({
  inviteEmails: z.array(z.string().email()).optional(),
});

// Combined schema
const fullSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema);

type FormData = z.infer<typeof fullSchema>;

export default function ClientSignupPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [currentInviteEmail, setCurrentInviteEmail] = useState('');
  
  // Check if user signed up with OAuth (Google, Apple, etc.)
  const isOAuthUser = user?.primaryEmailAddress?.verification?.strategy === 'oauth_google' || 
                      user?.primaryEmailAddress?.verification?.strategy === 'oauth_apple' ||
                      user?.primaryEmailAddress?.verification?.strategy?.startsWith('oauth');

  const form = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      company_name: '',
      website: '',
      interesting_competitors: '',
      differentiation: '',
      cool_ads_brands: '',
      content_folder_link: '',
      ideal_customer: '',
      customer_problems: '',
      customer_objections: '',
      recent_research: '',
      pricing_info: '',
      cold_friendly_offer: '',
      phone: '',
      contract_email: '',
      contract_full_name: '',
      address: '',
      kvk: '',
      invoice_details: '',
      inviteEmails: [],
    },
  });

  // Check if user has client role
  useEffect(() => {
    async function checkRole() {
      if (!user) return;

      const supabase = createClient();
      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('clerk_user_id', user.id)
        .single();

      if (error || !userRole || userRole.role !== 'client') {
        // User doesn't have client role, redirect to onboarding
        router.push('/onboarding');
      }
    }

    checkRole();
  }, [user, router]);

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof FormData)[] = [];
    
    switch (step) {
      case 1:
        fieldsToValidate = ['company_name', 'website', 'interesting_competitors', 'differentiation', 'cool_ads_brands'];
        break;
      case 2:
        fieldsToValidate = ['content_folder_link', 'ideal_customer', 'customer_problems', 'customer_objections'];
        break;
      case 3:
        fieldsToValidate = ['recent_research', 'pricing_info', 'cold_friendly_offer'];
        break;
      case 4:
        fieldsToValidate = ['phone', 'contract_email', 'contract_full_name', 'address', 'kvk', 'invoice_details'];
        break;
      case 5:
        // No validation needed for invite step
        return true;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addInviteEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (currentInviteEmail && emailRegex.test(currentInviteEmail)) {
      setInviteEmails([...inviteEmails, currentInviteEmail]);
      setCurrentInviteEmail('');
    }
  };

  const removeInviteEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter(e => e !== email));
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // First verify user has client role
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('clerk_user_id', user.id)
        .single();

      if (roleError || !userRole || userRole.role !== 'client') {
        throw new Error('User does not have client role. Please complete onboarding first.');
      }

      // Upload brand assets if provided
      let brandAssetsUrl = '';
      // TODO: Implement file upload to Supabase Storage

      // Insert client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          company_name: data.company_name,
          website: data.website,
          interesting_competitors: data.interesting_competitors || null,
          differentiation: data.differentiation || null,
          cool_ads_brands: data.cool_ads_brands || null,
          content_folder_link: data.content_folder_link || null,
          brand_assets_url: brandAssetsUrl || null,
          ideal_customer: data.ideal_customer || null,
          customer_problems: data.customer_problems || null,
          customer_objections: data.customer_objections || null,
          recent_research: data.recent_research || null,
          pricing_info: data.pricing_info || null,
          cold_friendly_offer: data.cold_friendly_offer || null,
          contract_email: data.contract_email,
          contract_full_name: data.contract_full_name,
          phone: data.phone,
          address: data.address,
          kvk: data.kvk,
          invoice_details: data.invoice_details || null,
          created_by: user.id, // Add the user ID who created this client
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Get user email from Clerk
      const userEmail = user.emailAddresses[0]?.emailAddress;
      if (!userEmail) throw new Error('User email not found');

      // Insert primary client user
      const { error: userError } = await supabase
        .from('client_users')
        .insert({
          clerk_user_id: user.id,
          client_id: clientData.id,
          email: userEmail,
          is_primary: true,
        });

      if (userError) throw userError;

      // TODO: Send invites to additional users
      if (inviteEmails.length > 0) {
        // Implement invite system
      }

      // Redirect to dashboard
      router.push('/dashboard/client');
    } catch (error: any) {
      console.error('Error creating client profile:', error);
      // Better error handling
      const errorMessage = error?.message || error?.error_description || 'Unknown error occurred';
      alert(`Error creating client profile: ${errorMessage}`);
      
      // Log the full error object for debugging
      console.log('Full error object:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Client Registration</CardTitle>
            <CardDescription>
              Complete your company profile to start working with creators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <Progress value={(currentStep / 5) * 100} className="mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Step {currentStep} of 5
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Company Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Company Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="interesting_competitors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you have interesting competitors?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="differentiation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How do you differentiate from your competitors?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cool_ads_brands"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Which brands have cool advertisements according to you?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Marketing Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Marketing Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="content_folder_link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link to your content folder/promotional material</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="brand_assets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your brand book, logo & fonts</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf,.zip,.rar"
                              onChange={(e) => field.onChange(e.target.files?.[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Upload a PDF or ZIP file with your brand assets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ideal_customer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Who is your ideal customer?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_problems"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What problems does this customer face and what solution are they looking for?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_objections"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What objections might the customer have regarding your product?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Business Information */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Business Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="recent_research"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Have you conducted customer research in the past 6 months?</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={3} 
                              placeholder="If yes, please share the results with us!"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pricing_info"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are the prices of your product(s)/services?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cold_friendly_offer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is your current Cold-Friendly Offer?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 4: Contact & Legal Information */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contact & Legal Information</h3>
                    

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contract_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To whom may we send the contract - Email?</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contract_full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To whom may we send the contract - Full name?</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="kvk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>KVK (Chamber of Commerce) Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="invoice_details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other invoice details?</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} placeholder="Please specify here!" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 5: Team Invites */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Invite Team Members</h3>
                    


                    <div className="space-y-2">
                      <FormLabel>Invite Team Members (Optional)</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="colleague@company.com"
                          value={currentInviteEmail}
                          onChange={(e) => setCurrentInviteEmail(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addInviteEmail();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addInviteEmail}
                          variant="outline"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {inviteEmails.map((email) => (
                          <div key={email} className="flex items-center gap-2 text-sm">
                            <span>{email}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInviteEmail(email)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <FormDescription>
                        You can invite other users from your company to access this account
                      </FormDescription>
                    </div>
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
                  
                  {currentStep < 5 ? (
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
                      disabled={loading}
                      className="ml-auto"
                    >
                      {loading ? 'Creating Account...' : 'Complete Registration'}
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