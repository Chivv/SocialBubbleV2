'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Building2, Calendar, Clock, 
  ExternalLink, FileText, Send, CheckCircle, AlertCircle, Receipt 
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { submitCreatorWork } from '@/app/actions/casting-briefings';
import { getCreatorInvoices } from '@/app/actions/creator-invoices';
import BriefingEditor from '@/components/briefings/editor';

interface CreatorBriefingDetailProps {
  briefingLink: any;
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

export default function CreatorBriefingDetail({ briefingLink }: CreatorBriefingDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [checkingInvoice, setCheckingInvoice] = useState(true);
  const status = briefingLink.submission?.submission_status || 'pending';
  const StatusIcon = statusConfig[status as keyof typeof statusConfig]?.icon || statusConfig.pending.icon;

  useEffect(() => {
    async function checkInvoice() {
      if (status === 'approved' && briefingLink.submission?.id) {
        try {
          const invoices = await getCreatorInvoices();
          const hasSubmittedInvoice = invoices.some(
            inv => inv.creator_submission_id === briefingLink.submission.id
          );
          setHasInvoice(hasSubmittedInvoice);
        } catch (error) {
          console.error('Error checking invoice:', error);
        }
      }
      setCheckingInvoice(false);
    }
    checkInvoice();
  }, [status, briefingLink.submission?.id]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await submitCreatorWork(briefingLink.casting_id);
      if (result.success) {
        toast.success('Work submitted successfully!');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to submit work');
      }
    } catch (error) {
      toast.error('Failed to submit work');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/creator/briefings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Briefings
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{briefingLink.briefing.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {briefingLink.casting.client?.company_name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {briefingLink.casting.title}
            </span>
          </div>
        </div>
        <Badge className={`${statusConfig[status as keyof typeof statusConfig]?.color || statusConfig.pending.color} text-white`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig[status as keyof typeof statusConfig]?.label || statusConfig.pending.label}
        </Badge>
      </div>

      {briefingLink.briefing.status === 'approved' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Briefing Content</CardTitle>
            </CardHeader>
            <CardContent>
              <BriefingEditor 
                content={briefingLink.briefing.content} 
                onChange={() => {}} 
                editable={false} 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Upload</CardTitle>
              <CardDescription>
                Upload your content to the provided link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(briefingLink.submission?.drive_folder_url || briefingLink.submission?.content_upload_link) ? (
                <>
                  {status === 'revision_requested' && briefingLink.submission?.feedback && (
                    <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 mb-4">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                        Revision Requested
                      </AlertTitle>
                      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                        {briefingLink.submission.feedback}
                        {briefingLink.submission.feedback_at && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                            {format(new Date(briefingLink.submission.feedback_at), 'PPp')}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button asChild variant="outline" className="w-full">
                    <a 
                      href={briefingLink.submission.drive_folder_url || briefingLink.submission.content_upload_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Upload Link
                    </a>
                  </Button>
                  
                  {(status === 'pending' || status === 'revision_requested') && (
                    <Button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? 'Submitting...' : 'Mark as Complete'}
                    </Button>
                  )}
                </>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Waiting for Content Upload Link</AlertTitle>
                  <AlertDescription>
                    The Social Bubble team will provide a content upload link soon. Please check back later.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>


          {status === 'pending_review' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Submission Under Review</AlertTitle>
              <AlertDescription>
                Your submission is being reviewed by the Social Bubble team. You&apos;ll be notified once it&apos;s approved or if any changes are needed.
              </AlertDescription>
            </Alert>
          )}

          {status === 'approved' && (
            <>
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-200">
                  Approved
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Your submission has been approved!
                  {briefingLink.submission?.approved_at && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Approved on {format(new Date(briefingLink.submission.approved_at), 'PPP')}
                    </p>
                  )}
                </AlertDescription>
              </Alert>

              {!checkingInvoice && !hasInvoice && (
                <Card>
                  <CardHeader>
                    <CardTitle>Submit Invoice</CardTitle>
                    <CardDescription>
                      Your work is approved! You can now submit an invoice for payment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/dashboard/creator/invoices/new">
                      <Button className="w-full">
                        <Receipt className="h-4 w-4 mr-2" />
                        Submit Invoice
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {!checkingInvoice && hasInvoice && (
                <Alert>
                  <Receipt className="h-4 w-4" />
                  <AlertTitle>Invoice Submitted</AlertTitle>
                  <AlertDescription>
                    You have already submitted an invoice for this work.
                    <Link href="/dashboard/creator/invoices" className="block mt-2 text-sm underline">
                      View your invoices
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">Briefing in Progress</h3>
            <p className="text-muted-foreground">
              The briefing is still being created. Please check back later for the final version.
            </p>
            {briefingLink.casting.status === 'shooting' && (
              <p className="text-sm text-muted-foreground mt-4">
                The casting is already in production, the briefing will be available soon.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}