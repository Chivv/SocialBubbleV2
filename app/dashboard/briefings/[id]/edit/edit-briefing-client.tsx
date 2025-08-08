'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefing, Client } from '@/types';
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
import { updateBriefing } from '@/app/actions/briefings';
import { BriefingStatus, GlobalPlaceholder } from '@/types';
import { getGlobalPlaceholders } from '@/app/actions/placeholders';
import { replacePlaceholders } from '@/lib/placeholders/replacer';
import { EditorWithPlaceholders } from '@/components/briefings/editor-with-placeholders';

const briefingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  client_id: z.string().min(1, 'Please select a client'),
  status: z.enum(['draft', 'waiting_internal_feedback', 'internal_feedback_given', 'sent_client_feedback', 'client_feedback_given', 'approved']),
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

interface EditBriefingClientProps {
  briefing: Briefing;
  clients: Client[];
}

export default function EditBriefingClient({ briefing, clients }: EditBriefingClientProps) {
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState(briefing.content);
  const [globalPlaceholders, setGlobalPlaceholders] = useState<GlobalPlaceholder[]>([]);

  const form = useForm<BriefingFormData>({
    resolver: zodResolver(briefingSchema),
    defaultValues: {
      title: briefing.title,
      client_id: briefing.client_id,
      status: briefing.status,
    },
  });

  useEffect(() => {
    async function loadPlaceholders() {
      const placeholders = await getGlobalPlaceholders();
      setGlobalPlaceholders(placeholders);
    }
    loadPlaceholders();
  }, []);

  const getPreviewContent = () => {
    const selectedClient = clients.find(c => c.id === form.watch('client_id'));
    if (!content || !selectedClient) return content;
    
    return replacePlaceholders(content, {
      client: selectedClient,
      globalPlaceholders,
    });
  };

  const onSubmit = async (data: BriefingFormData) => {
    setSaving(true);
    try {
      const result = await updateBriefing(briefing.id, {
        title: data.title,
        client_id: data.client_id,
        content: JSON.stringify(content), // Send as string to preserve all properties
        status: data.status,
      });

      if (result.success) {
        router.push(`/dashboard/briefings/${briefing.id}`);
      } else {
        throw new Error(result.error || 'Failed to update briefing');
      }
    } catch (error) {
      console.error('Error updating briefing:', error);
      alert(error instanceof Error ? error.message : 'Failed to update briefing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading) {
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
            Only Social Bubble team members can edit briefings. Client users have read-only access to briefings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/briefings/${briefing.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Briefing</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update briefing document</CardTitle>
          <CardDescription>
            Make changes to the briefing document. All changes will be saved when you click update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

              <EditorWithPlaceholders
                content={content}
                onChange={setContent}
                globalPlaceholders={globalPlaceholders}
                previewContent={getPreviewContent()}
                placeholderFilterType="briefing"
              />

              <div className="flex justify-end gap-4">
                <Link href={`/dashboard/briefings/${briefing.id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Updating...' : 'Update Briefing'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}