'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Client, BriefingTemplate, GlobalPlaceholder, BriefingStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createBriefing, getClients } from '@/app/actions/briefings';
import { getDefaultBriefingTemplate, getGlobalPlaceholders } from '@/app/actions/placeholders';
import { replacePlaceholders } from '@/lib/placeholders/replacer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EditorWithPlaceholders } from '@/components/briefings/editor-with-placeholders';

const briefingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  client_id: z.string().min(1, 'Please select a client'),
  status: z.enum(['draft', 'waiting_internal_feedback', 'internal_feedback_given', 'sent_client_feedback', 'client_feedback_given', 'approved'] as const),
});

type BriefingFormData = z.infer<typeof briefingSchema>;

const statusOptions: { value: BriefingStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'waiting_internal_feedback', label: 'Waiting for Internal Feedback' },
  { value: 'internal_feedback_given', label: 'Internal Feedback Given' },
  { value: 'sent_client_feedback', label: 'Sent to Client for Feedback' },
  { value: 'client_feedback_given', label: 'Client Feedback Given' },
  { value: 'approved', label: 'Approved' },
];

export default function NewBriefingClient() {
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [clients, setClients] = useState<Client[]>([]);
  const [globalPlaceholders, setGlobalPlaceholders] = useState<GlobalPlaceholder[]>([]);
  const [template, setTemplate] = useState<BriefingTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const form = useForm<BriefingFormData>({
    resolver: zodResolver(briefingSchema),
    defaultValues: {
      title: '',
      client_id: '',
      status: 'draft',
    },
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // When client is selected, load template with replaced content
  useEffect(() => {
    if (selectedClient && template && globalPlaceholders && !content) {
      // Replace global placeholders in template with actual content for editing
      const replacedContent = replacePlaceholders(template.content, {
        client: selectedClient,
        globalPlaceholders,
      });
      setContent(replacedContent);
    }
  }, [selectedClient, template, globalPlaceholders, content]);

  async function fetchInitialData() {
    try {
      const [clientsList, defaultTemplate, placeholders] = await Promise.all([
        getClients(),
        getDefaultBriefingTemplate(),
        getGlobalPlaceholders(),
      ]);
      
      setClients(clientsList);
      setTemplate(defaultTemplate);
      setGlobalPlaceholders(placeholders);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    
    // Reset content to template with replaced placeholders when client changes
    if (client && template && globalPlaceholders) {
      const replacedContent = replacePlaceholders(template.content, {
        client,
        globalPlaceholders,
      });
      setContent(replacedContent);
    }
  };

  const getPreviewContent = () => {
    if (!content || !selectedClient) return content;
    
    return replacePlaceholders(content, {
      client: selectedClient,
      globalPlaceholders,
    });
  };

  const onSubmit = async (data: BriefingFormData) => {
    setSaving(true);
    try {
      const result = await createBriefing({
        title: data.title,
        client_id: data.client_id,
        content: JSON.stringify(content), // Send as string to preserve all properties
        status: data.status,
      });

      if (result.success && result.briefing) {
        router.push(`/dashboard/briefings/${result.briefing.id}`);
      } else {
        throw new Error(result.error || 'Failed to create briefing');
      }
    } catch (error) {
      console.error('Error creating briefing:', error);
      alert(error instanceof Error ? error.message : 'Failed to create briefing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  if (role !== 'social_bubble') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/briefings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only Social Bubble team members can create briefings. Client users have read-only access to briefings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/briefings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">New Briefing</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a new briefing document</CardTitle>
          <CardDescription>
            Select a client first to load the briefing template with personalized content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleClientChange(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter briefing title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedClient ? (
                <EditorWithPlaceholders
                  content={content}
                  onChange={setContent}
                  globalPlaceholders={globalPlaceholders}
                  previewContent={getPreviewContent()}
                  placeholderFilterType="briefing"
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Select a client</AlertTitle>
                  <AlertDescription>
                    Please select a client first to load the briefing template.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-4">
                <Link href="/dashboard/briefings">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving || !selectedClient}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Creating...' : 'Create Briefing'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}