'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CastingInvitation } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, Clock, Calendar, Building2, Camera, Euro } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { respondToInvitation } from '@/app/actions/castings';

interface OpportunitiesClientProps {
  opportunities: CastingInvitation[];
}

export default function OpportunitiesClient({ opportunities }: OpportunitiesClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<CastingInvitation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleAccept = async (invitationId: string) => {
    setLoading(true);
    try {
      const result = await respondToInvitation(invitationId, true);
      if (result.success) {
        toast.success('Invitation accepted successfully!');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      toast.error('Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedInvitation) return;

    setLoading(true);
    try {
      const result = await respondToInvitation(
        selectedInvitation.id, 
        false, 
        rejectionReason || undefined
      );
      if (result.success) {
        toast.success('Invitation declined');
        setRejectDialogOpen(false);
        setSelectedInvitation(null);
        setRejectionReason('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to decline invitation');
      }
    } catch (error) {
      toast.error('Failed to decline invitation');
    } finally {
      setLoading(false);
    }
  };

  const openRejectDialog = (invitation: CastingInvitation) => {
    setSelectedInvitation(invitation);
    setRejectDialogOpen(true);
  };

  // Separate opportunities based on invitation status and casting status
  const activeOpportunities = opportunities.filter(
    opp => opp.status === 'pending' && opp.casting?.status === 'inviting'
  );
  const missedOpportunities = opportunities.filter(
    opp => opp.status === 'pending' && opp.casting?.status !== 'inviting'
  );
  const respondedOpportunities = opportunities.filter(opp => opp.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Casting Opportunities</h1>
        <Badge variant="outline">
          {activeOpportunities.length} active
        </Badge>
      </div>

      {activeOpportunities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Invitations</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {opportunity.casting?.title || 'Casting Opportunity'}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {opportunity.casting?.client?.company_name || 'Client'}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {opportunity.casting?.compensation && (
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        <span className="font-semibold text-lg">
                          {opportunity.casting.compensation}
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Invited {format(new Date(opportunity.invited_at), 'PP')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAccept(opportunity.id)}
                      disabled={loading}
                      className="flex-1"
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button 
                      onClick={() => openRejectDialog(opportunity)}
                      disabled={loading}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {missedOpportunities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Missed Opportunities</h2>
          <p className="text-sm text-muted-foreground">
            These invitations are no longer active as the casting has moved to a different phase.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {missedOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="relative opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {opportunity.casting?.title || 'Casting Opportunity'}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {opportunity.casting?.client?.company_name || 'Client'}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-gray-500">
                      <X className="h-3 w-3 mr-1" />
                      Missed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {opportunity.casting?.compensation && (
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        <span className="font-semibold text-lg">
                          {opportunity.casting.compensation}
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Invited {format(new Date(opportunity.invited_at), 'PP')}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    This casting is no longer accepting responses.
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {respondedOpportunities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past Responses</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {respondedOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="relative opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {opportunity.casting?.title || 'Casting Opportunity'}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {opportunity.casting?.client?.company_name || 'Client'}
                        </div>
                      </CardDescription>
                    </div>
                    {opportunity.status === 'accepted' ? (
                      <Badge variant="outline" className="text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Accepted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        <X className="h-3 w-3 mr-1" />
                        Declined
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {opportunity.casting?.compensation && (
                    <div className="flex items-center gap-2 mb-2">
                      <Euro className="h-4 w-4" />
                      <span className="font-semibold">
                        {opportunity.casting.compensation}
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Invited {format(new Date(opportunity.invited_at), 'PP')}
                    </div>
                    {opportunity.responded_at && (
                      <div className="flex items-center gap-1 mt-1">
                        <Camera className="h-3 w-3" />
                        Responded {format(new Date(opportunity.responded_at), 'PP')}
                      </div>
                    )}
                  </div>
                  {opportunity.status === 'rejected' && opportunity.rejection_reason && (
                    <div className="text-sm">
                      <p className="font-medium">Reason:</p>
                      <p className="text-muted-foreground">{opportunity.rejection_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {opportunities.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl font-medium mb-2">No opportunities yet</p>
            <p className="text-muted-foreground">
              When brands invite you to castings, they'll appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {opportunities.length > 0 && 
       activeOpportunities.length === 0 && 
       missedOpportunities.length === 0 &&
       respondedOpportunities.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl font-medium mb-2">No active opportunities</p>
            <p className="text-muted-foreground">
              Check back later for new casting invitations.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this casting invitation? You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Let them know why you're declining..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedInvitation(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Declining...' : 'Decline Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}