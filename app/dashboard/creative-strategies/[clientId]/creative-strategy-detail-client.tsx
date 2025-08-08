'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreativeStrategy, CreativeStrategyComment, CreativeStrategyStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/briefings/status-badge';
import { ArrowLeft, Edit, FileText, Building2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import BriefingEditor from '@/components/briefings/editor';
import { CommentsSection } from '@/components/creative-strategies/comments-section';
import { addComment, updateCreativeStrategyStatus } from '@/app/actions/creative-strategies';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CreativeStrategyDetailClientProps {
  strategy: CreativeStrategy;
  comments: CreativeStrategyComment[];
}

const statusOptions: { value: CreativeStrategyStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'waiting_internal_feedback', label: 'Waiting for Internal Feedback' },
  { value: 'internal_feedback_given', label: 'Internal Feedback Given' },
  { value: 'sent_client_feedback', label: 'Sent to Client for Feedback' },
  { value: 'client_feedback_given', label: 'Client Feedback Given' },
  { value: 'approved', label: 'Approved' },
];

export default function CreativeStrategyDetailClient({ 
  strategy, 
  comments 
}: CreativeStrategyDetailClientProps) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleAddComment = async (content: string) => {
    const result = await addComment(strategy.id, content);
    if (result.success) {
      router.refresh();
    }
    return result;
  };

  const handleStatusChange = async (newStatus: CreativeStrategyStatus) => {
    setIsUpdatingStatus(true);
    try {
      const result = await updateCreativeStrategyStatus(strategy.id, newStatus);
      if (result.success) {
        toast.success('Status updated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/creative-strategies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Creative Strategy</h1>
        </div>
        <Link href={`/dashboard/creative-strategies/${strategy.client_id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Strategy
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{strategy.client?.company_name || 'Unknown Client'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <StatusBadge status={strategy.status} />
              <Select
                value={strategy.status}
                onValueChange={handleStatusChange}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {format(new Date(strategy.updated_at), 'PPP')}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(strategy.updated_at), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="comments">
            Comments
            {comments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {comments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Content</CardTitle>
              <CardDescription>
                The creative strategy content for {strategy.client?.company_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BriefingEditor 
                content={strategy.content} 
                onChange={() => {}} 
                editable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <CommentsSection
            comments={comments}
            onAddComment={handleAddComment}
            currentUserRole="social_bubble"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}