'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreativeStrategy, Client, GlobalPlaceholder, CreativeStrategyStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateCreativeStrategy } from '@/app/actions/creative-strategies';
import { replacePlaceholders } from '@/lib/placeholders/replacer';
import { EditorWithPlaceholders } from '@/components/briefings/editor-with-placeholders';
import { toast } from 'sonner';

const strategySchema = z.object({
  status: z.enum(['draft', 'waiting_internal_feedback', 'internal_feedback_given', 'sent_client_feedback', 'client_feedback_given', 'approved']),
});

type StrategyFormData = z.infer<typeof strategySchema>;

const statusOptions: { value: CreativeStrategyStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'waiting_internal_feedback', label: 'Waiting for Internal Feedback' },
  { value: 'internal_feedback_given', label: 'Internal Feedback Given' },
  { value: 'sent_client_feedback', label: 'Sent to Client for Feedback' },
  { value: 'client_feedback_given', label: 'Client Feedback Given' },
  { value: 'approved', label: 'Approved' },
];

interface EditCreativeStrategyClientProps {
  strategy: CreativeStrategy;
  clients: Client[];
  globalPlaceholders: GlobalPlaceholder[];
}

export default function EditCreativeStrategyClient({ 
  strategy, 
  clients,
  globalPlaceholders 
}: EditCreativeStrategyClientProps) {
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState(strategy.content);

  const form = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      status: strategy.status,
    },
  });

  const getPreviewContent = () => {
    const client = clients.find(c => c.id === strategy.client_id);
    if (!content || !client) return content;
    
    return replacePlaceholders(content, {
      client,
      globalPlaceholders,
    });
  };

  const onSubmit = async (data: StrategyFormData) => {
    setSaving(true);
    try {
      const result = await updateCreativeStrategy(strategy.id, {
        content: JSON.stringify(content), // Send as string to preserve all properties
        status: data.status,
      });

      if (result.success) {
        toast.success('Creative strategy updated successfully');
        router.push(`/dashboard/creative-strategies/${strategy.client_id}`);
      } else {
        throw new Error(result.error || 'Failed to update creative strategy');
      }
    } catch (error) {
      console.error('Error updating creative strategy:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update creative strategy');
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
          <Link href="/dashboard/creative-strategies">
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
            Only Social Bubble team members can edit creative strategies.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/creative-strategies/${strategy.client_id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Creative Strategy</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update creative strategy</CardTitle>
          <CardDescription>
            Edit the creative strategy for {strategy.client?.company_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Client: {strategy.client?.company_name}</p>
              </div>

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
                placeholderFilterType="creative_strategy"
              />

              <div className="flex justify-end gap-4">
                <Link href={`/dashboard/creative-strategies/${strategy.client_id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Updating...' : 'Update Strategy'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}