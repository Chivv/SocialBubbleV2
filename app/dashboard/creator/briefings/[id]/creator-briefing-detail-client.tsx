'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefing } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, Building2, Calendar, Link as LinkIcon, 
  CheckCircle, AlertCircle, Send, ExternalLink, FileText 
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { submitCreatorWork } from '@/app/actions/casting-briefings';

interface BriefingLink {
  id: string;
  casting_id: string;
  briefing_id: string;
  casting: {
    id: string;
    title: string;
    client?: {
      company_name: string;
    };
  };
  submission?: {
    id: string;
    content_upload_link?: string;
    status: 'pending' | 'submitted' | 'needs_revision' | 'approved';
    submitted_at?: string;
    feedback?: string;
    feedback_at?: string;
    approved_at?: string;
  };
}

interface CreatorBriefingDetailClientProps {
  briefing: Briefing;
  briefingLink: BriefingLink;
}

export default function CreatorBriefingDetailClient({ 
  briefing, 
  briefingLink 
}: CreatorBriefingDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const status = briefingLink.submission?.status || 'pending';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await submitCreatorWork(briefingLink.casting_id);
      if (result.success) {
        toast.success('Work submitted successfully!');
        router.refresh();
        router.push('/dashboard/creator/briefings');
      } else {
        toast.error(result.error || 'Failed to submit work');
      }
    } catch (error) {
      toast.error('Failed to submit work');
    } finally {
      setLoading(false);
    }
  };

  // Function to render Tiptap content
  const renderContent = (content: any) => {
    if (!content || !content.content) return null;
    
    // This is a simplified renderer - you might want to use a proper Tiptap renderer
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {content.content.map((node: any, index: number) => {
          if (node.type === 'paragraph') {
            return (
              <p key={index}>
                {node.content?.map((inline: any, i: number) => {
                  if (inline.type === 'text') {
                    return <span key={i}>{inline.text}</span>;
                  }
                  return null;
                })}
              </p>
            );
          }
          if (node.type === 'heading') {
            const Tag = `h${node.attrs.level}` as keyof JSX.IntrinsicElements;
            return (
              <Tag key={index}>
                {node.content?.map((inline: any, i: number) => {
                  if (inline.type === 'text') {
                    return <span key={i}>{inline.text}</span>;
                  }
                  return null;
                })}
              </Tag>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/creator/briefings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{briefing.title}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Briefing Content</CardTitle>
              <CardDescription>
                Review the briefing details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderContent(briefing.content)}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {briefingLink.casting.client?.company_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Casting</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {briefingLink.casting.title}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  {status === 'pending' && (
                    <Badge variant="secondary">Not Started</Badge>
                  )}
                  {status === 'submitted' && (
                    <Badge className="bg-blue-500 text-white">
                      <Send className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  )}
                  {status === 'needs_revision' && (
                    <Badge className="bg-yellow-500 text-white">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Needs Revision
                    </Badge>
                  )}
                  {status === 'approved' && (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {briefingLink.submission?.content_upload_link && (
            <Card>
              <CardHeader>
                <CardTitle>Content Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={briefingLink.submission.content_upload_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-2 text-sm break-all"
                >
                  <LinkIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{briefingLink.submission.content_upload_link}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </CardContent>
            </Card>
          )}

          {status === 'needs_revision' && briefingLink.submission?.feedback && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Revision Required
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {briefingLink.submission.feedback}
                </p>
                {briefingLink.submission.feedback_at && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    Feedback given on {format(new Date(briefingLink.submission.feedback_at), 'PPP')}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {(status === 'pending' || status === 'needs_revision') && 
           briefingLink.submission?.content_upload_link && (
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Submitting...' : 'Mark as Complete'}
            </Button>
          )}

          {status === 'submitted' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your work has been submitted and is awaiting review.
                {briefingLink.submission?.submitted_at && (
                  <p className="text-sm mt-1">
                    Submitted on {format(new Date(briefingLink.submission.submitted_at), 'PPP')}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {status === 'approved' && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Work Approved!
                </p>
                {briefingLink.submission?.approved_at && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Approved on {format(new Date(briefingLink.submission.approved_at), 'PPP')}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}