'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Link as LinkIcon, Calendar, Building2, 
  CheckCircle, Clock, AlertCircle, Send, ExternalLink, Euro 
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { submitCreatorWork } from '@/app/actions/casting-briefings';

interface BriefingWithSubmission {
  id: string;
  casting_id: string;
  briefing_id: string;
  linked_by: string;
  linked_at: string;
  briefing: {
    id: string;
    title: string;
    content: any;
    client_id: string;
    status: string;
    created_at: string;
  };
  casting: {
    id: string;
    title: string;
    status: string;
    compensation: number;
    client?: {
      id: string;
      company_name: string;
    };
  };
  submission?: {
    id: string;
    content_upload_link?: string;
    submission_status: 'pending' | 'submitted' | 'pending_review' | 'revision_requested' | 'approved';
    submitted_at?: string;
    feedback?: string;
    feedback_at?: string;
    approved_at?: string;
  };
}

interface CreatorBriefingsClientProps {
  briefings: BriefingWithSubmission[];
}

const statusConfig = {
  pending: {
    label: 'Not Started',
    color: 'bg-gray-500',
    icon: Clock,
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-blue-500',
    icon: Send,
  },
  pending_review: {
    label: 'Under Review',
    color: 'bg-blue-500',
    icon: Clock,
  },
  revision_requested: {
    label: 'Needs Revision',
    color: 'bg-yellow-500',
    icon: AlertCircle,
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-500',
    icon: CheckCircle,
  },
};

export default function CreatorBriefingsClient({ briefings }: CreatorBriefingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubmit = async (castingId: string) => {
    setLoading(castingId);
    try {
      const result = await submitCreatorWork(castingId);
      if (result.success) {
        toast.success('Work submitted successfully!');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to submit work');
      }
    } catch (error) {
      toast.error('Failed to submit work');
    } finally {
      setLoading(null);
    }
  };

  if (briefings.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Briefings</h1>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl font-medium mb-2">No briefings yet</p>
            <p className="text-muted-foreground">
              When you're selected for castings, briefings will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeBriefings = briefings.filter(
    b => b.submission?.submission_status !== 'approved'
  );
  const completedBriefings = briefings.filter(
    b => b.submission?.submission_status === 'approved'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Briefings</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{activeBriefings.length} active</span>
          <span>{completedBriefings.length} completed</span>
        </div>
      </div>

      {activeBriefings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Briefings</h2>
          <div className="grid gap-4">
            {activeBriefings.map((briefingLink) => {
              const status = briefingLink.submission?.submission_status || 'pending';
              const StatusIcon = statusConfig[status].icon;

              return (
                <Card key={briefingLink.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {briefingLink.briefing.title}
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {briefingLink.casting.client?.company_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {briefingLink.casting.title}
                            </span>
                            {briefingLink.casting.compensation && (
                              <span className="flex items-center gap-1 font-medium">
                                <Euro className="h-3 w-3" />
                                {briefingLink.casting.compensation}
                              </span>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <Badge className={`${statusConfig[status].color} text-white`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {briefingLink.submission?.content_upload_link && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Content Upload Link</p>
                        <a
                          href={briefingLink.submission.content_upload_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          {briefingLink.submission.content_upload_link}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {status === 'revision_requested' && briefingLink.submission?.feedback && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                          Feedback from Social Bubble
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          {briefingLink.submission.feedback}
                        </p>
                        {briefingLink.submission.feedback_at && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                            {format(new Date(briefingLink.submission.feedback_at), 'PPp')}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/dashboard/creator/briefings/${briefingLink.briefing.id}`}>
                        <Button variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View Briefing
                        </Button>
                      </Link>
                      
                      {(status === 'pending' || status === 'revision_requested') && 
                       briefingLink.submission?.content_upload_link && (
                        <Button 
                          onClick={() => handleSubmit(briefingLink.casting_id)}
                          disabled={loading === briefingLink.casting_id}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {loading === briefingLink.casting_id ? 'Submitting...' : 'Mark as Complete'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {completedBriefings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Completed Briefings</h2>
          <div className="grid gap-4">
            {completedBriefings.map((briefingLink) => (
              <Card key={briefingLink.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {briefingLink.briefing.title}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {briefingLink.casting.client?.company_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {briefingLink.casting.title}
                          </span>
                          {briefingLink.casting.compensation && (
                            <span className="flex items-center gap-1 font-medium">
                              <Euro className="h-3 w-3" />
                              {briefingLink.casting.compensation}
                            </span>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Approved on {briefingLink.submission?.approved_at && 
                      format(new Date(briefingLink.submission.approved_at), 'PPP')
                    }
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}