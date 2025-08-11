'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { 
  getCreatorEarnings, 
  getCreatorOpportunityStats, 
  getActiveSubmissions,
  getCreatorPerformanceMetrics 
} from '@/app/actions/creator-analytics';
import { MetricCard } from '@/components/dashboard/metric-card';
import { EarningsChart } from '@/components/dashboard/earnings-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Target,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText,
  ChevronRight,
  Camera,
  Pencil
} from 'lucide-react';
import Link from 'next/link';
import type { 
  CreatorEarnings, 
  OpportunityStats, 
  ActiveSubmissions, 
  PerformanceMetrics 
} from '@/types';

export default function CreatorDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityStats | null>(null);
  const [submissions, setSubmissions] = useState<ActiveSubmissions | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return;

      try {
        const [earningsData, opportunitiesData, submissionsData, performanceData] = await Promise.all([
          getCreatorEarnings(),
          getCreatorOpportunityStats(),
          getActiveSubmissions(),
          getCreatorPerformanceMetrics()
        ]);

        setEarnings(earningsData);
        setOpportunities(opportunitiesData);
        setSubmissions(submissionsData);
        setPerformance(performanceData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // If no data, redirect to signup
  if (!earnings && !opportunities && !submissions && !performance) {
    router.push('/signup/creator');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Redirecting to complete your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back! Here's your performance overview.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/dashboard/creator/opportunities" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Opportunities</span>
              <span className="sm:hidden">Opps</span>
            </Button>
          </Link>
          <Link href="/dashboard/creator/profile" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Earnings"
          value={formatCurrency(earnings?.totalEarnings || 0)}
          description={`From ${earnings?.invoiceCount || 0} campaigns`}
          icon={DollarSign}
        />
        <MetricCard
          title="Active Opportunities"
          value={opportunities?.pendingInvitations || 0}
          description="Awaiting your response"
          icon={Target}
        />
        <MetricCard
          title="Success Rate"
          value={`${Math.round(opportunities?.selectionRate || 0)}%`}
          description="Selection rate"
          icon={TrendingUp}
        />
        <MetricCard
          title="Pending Payments"
          value={formatCurrency(earnings?.pendingPayments || 0)}
          description="To be paid"
          icon={Clock}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 md:auto-rows-fr">
        {/* Earnings Chart */}
        <div className="min-h-[450px]">
          {earnings && earnings.monthlyEarnings.length > 0 ? (
            <EarningsChart data={earnings.monthlyEarnings} type="bar" />
          ) : (
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
                <CardDescription>No earnings data available yet</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-muted-foreground text-center">
                  Complete campaigns to see your earnings here
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Feed */}
        <Card className="min-h-[450px] flex flex-col">
          <CardHeader>
            <CardTitle>Current Activity</CardTitle>
            <CardDescription>Your active tasks and submissions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Tabs defaultValue="submissions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="submissions" className="text-xs sm:text-sm">
                  Submissions ({submissions?.totalActive || 0})
                </TabsTrigger>
                <TabsTrigger value="opportunities" className="text-xs sm:text-sm">
                  Opportunities ({opportunities?.activeOpportunities.length || 0})
                </TabsTrigger>
                <TabsTrigger value="invoices" className="text-xs sm:text-sm">
                  Invoices ({earnings?.recentInvoices.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="submissions" className="mt-4">
                <ScrollArea className="h-[260px]">
                  <div className="space-y-3">
                    {submissions?.pendingSubmission.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{sub.castingTitle}</p>
                          <p className="text-xs text-muted-foreground">{sub.briefingTitle}</p>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    ))}
                    {submissions?.inReview.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{sub.castingTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {sub.submittedAt ? formatDate(sub.submittedAt) : 'recently'}
                          </p>
                        </div>
                        <Badge>In Review</Badge>
                      </div>
                    ))}
                    {submissions?.needsRevision.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{sub.castingTitle}</p>
                          <p className="text-xs text-orange-600">{sub.feedback || 'Revision requested'}</p>
                        </div>
                        <Badge variant="outline" className="border-orange-600 text-orange-600">
                          Needs Revision
                        </Badge>
                      </div>
                    ))}
                    {(!submissions?.pendingSubmission?.length && !submissions?.inReview?.length && !submissions?.needsRevision?.length) && (
                      <p className="text-center text-muted-foreground py-8">
                        No active submissions
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="opportunities" className="mt-4">
                <ScrollArea className="h-[260px]">
                  <div className="space-y-3">
                    {opportunities?.activeOpportunities.map((opp) => (
                      <div key={opp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{opp.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(opp.compensation)} • Invited {formatDate(opp.invitedAt)}
                          </p>
                        </div>
                        <Link href="/dashboard/creator/opportunities">
                          <Button size="sm" variant="ghost">
                            View
                            <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {!opportunities?.activeOpportunities.length && (
                      <p className="text-center text-muted-foreground py-8">
                        No active opportunities
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="invoices" className="mt-4">
                <ScrollArea className="h-[260px]">
                  <div className="space-y-3">
                    {earnings?.recentInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{invoice.casting?.title || 'Campaign'}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(invoice.deal_amount)} • {formatDate(invoice.submitted_at)}
                          </p>
                        </div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                    {!earnings?.recentInvoices.length && (
                      <p className="text-center text-muted-foreground py-8">
                        No invoices yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Campaigns Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance?.totalCampaignsCompleted || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. turnaround: {Math.round(submissions?.avgTurnaroundDays || 0)} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(opportunities?.responseRate || 0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {opportunities?.acceptedInvitations || 0} accepted of {opportunities?.totalInvitations || 0} invitations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance?.monthsActive || 0} months</div>
            <p className="text-xs text-muted-foreground mt-1">
              Joined {performance?.memberSince ? formatDate(performance.memberSince) : 'recently'}
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}