'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreativeStrategy, CreativeStrategyComment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/briefings/status-badge';
import { AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import BriefingEditor from '@/components/briefings/editor';
import { CommentsSection } from '@/components/creative-strategies/comments-section';
import { addComment, updateCreativeStrategyStatus } from '@/app/actions/creative-strategies';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CreativeStrategyClientViewProps {
  strategy: CreativeStrategy | null;
  comments: CreativeStrategyComment[];
  currentUserId: string;
}

export default function CreativeStrategyClientView({ 
  strategy, 
  comments,
  currentUserId 
}: CreativeStrategyClientViewProps) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const canView = strategy && ['sent_client_feedback', 'client_feedback_given', 'approved'].includes(strategy.status);

  const handleAddComment = async (content: string) => {
    if (!strategy) return { success: false, error: 'No strategy found' };
    
    const result = await addComment(strategy.id, content);
    if (result.success) {
      router.refresh();
    }
    return result;
  };

  const handleApprove = async () => {
    if (!strategy) return;
    
    setIsUpdatingStatus(true);
    try {
      const result = await updateCreativeStrategyStatus(strategy.id, 'approved');
      if (result.success) {
        toast.success('Creative strategy approved!');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to approve strategy');
      }
    } catch (error) {
      toast.error('Failed to approve strategy');
    } finally {
      setIsUpdatingStatus(false);
      setShowApproveDialog(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!strategy) return;
    
    // Check if there are any comments from the current user
    const hasComments = comments.some(c => c.user_id === currentUserId && c.created_at > strategy.updated_at);
    
    if (!hasComments) {
      toast.error('Please add feedback comments before submitting');
      setShowFeedbackDialog(false);
      return;
    }
    
    setIsUpdatingStatus(true);
    try {
      const result = await updateCreativeStrategyStatus(strategy.id, 'client_feedback_given');
      if (result.success) {
        toast.success('Feedback submitted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsUpdatingStatus(false);
      setShowFeedbackDialog(false);
    }
  };

  if (!strategy) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Creative Strategy</h1>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Strategy Found</AlertTitle>
          <AlertDescription>
            No creative strategy has been created for your account yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Creative Strategy</h1>
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Strategy in Progress</AlertTitle>
          <AlertDescription>
            Your creative strategy is being prepared by our team. We&apos;ll notify you once it&apos;s ready for your review.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={strategy.status} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Creative Strategy</h1>
        {strategy.status === 'sent_client_feedback' && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowFeedbackDialog(true)}
              disabled={isUpdatingStatus}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
            <Button 
              onClick={() => setShowApproveDialog(true)}
              disabled={isUpdatingStatus}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Strategy
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={strategy.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            {strategy.status === 'sent_client_feedback' ? (
              <p className="text-sm text-muted-foreground">
                Please review the strategy and provide feedback or approve it.
              </p>
            ) : strategy.status === 'client_feedback_given' ? (
              <p className="text-sm text-muted-foreground">
                Our team is reviewing your feedback and will update the strategy soon.
              </p>
            ) : (
              <p className="text-sm text-green-600 font-medium">
                Strategy approved! No action required.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Strategy Content</TabsTrigger>
          <TabsTrigger value="feedback">
            Feedback & Comments
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
              <CardTitle>Your Creative Strategy</CardTitle>
              <CardDescription>
                Review your customized creative strategy below
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

        <TabsContent value="feedback" className="space-y-4">
          {strategy.status === 'sent_client_feedback' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Feedback Requested</AlertTitle>
              <AlertDescription>
                Please review the strategy and add any feedback or comments below. Once you&apos;re satisfied, you can approve the strategy.
              </AlertDescription>
            </Alert>
          )}
          
          <CommentsSection
            comments={comments}
            onAddComment={handleAddComment}
            currentUserRole="client"
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Creative Strategy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this creative strategy? This action will mark it as final and approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve Strategy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Have you added all your feedback comments? Submitting will notify our team to review and update the strategy based on your feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitFeedback}>
              Submit Feedback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}