'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Casting, CastingInvitation, CastingSelection, Creator, CastingStatus,
  CastingBriefingLink, Briefing, CreatorSubmission, SubmissionStatus
} from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Euro, Users, Calendar, AlertCircle, 
  Send, Check, X, Clock, UserPlus, Eye, FileText,
  Link as LinkIcon, ExternalLink, MessageSquare, Filter
} from 'lucide-react';
import Link from 'next/link';
import { format, differenceInYears } from 'date-fns';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { toast } from 'sonner';
import { 
  updateCasting, 
  sendCastingInvitations, 
  selectCreatorsForClient,
  selectFinalCreators
} from '@/app/actions/castings';
import {
  linkBriefingToCasting,
  unlinkBriefingFromCasting,
  reviewCreatorSubmission
} from '@/app/actions/casting-briefings';
import { languages } from '@/lib/constants/languages';

interface CastingDetailClientProps {
  casting: Casting;
  invitations: CastingInvitation[];
  selections: CastingSelection[];
  allCreators: Creator[];
  linkedBriefings: CastingBriefingLink[];
  availableBriefings: Briefing[];
  creatorSubmissions: CreatorSubmission[];
}

const statusColors: Record<CastingStatus, string> = {
  draft: 'bg-gray-500',
  inviting: 'bg-blue-500',
  check_intern: 'bg-yellow-500',
  send_client_feedback: 'bg-purple-500',
  approved_by_client: 'bg-green-500',
  shooting: 'bg-orange-500',
  done: 'bg-gray-700',
};

const statusLabels: Record<CastingStatus, string> = {
  draft: 'Draft',
  inviting: 'Inviting',
  check_intern: 'Check Intern',
  send_client_feedback: 'Send to Client',
  approved_by_client: 'Approved',
  shooting: 'Shooting',
  done: 'Done',
};

export default function CastingDetailClient({ 
  casting, 
  invitations, 
  selections,
  allCreators,
  linkedBriefings,
  availableBriefings,
  creatorSubmissions
}: CastingDetailClientProps) {
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [reviewingCreator, setReviewingCreator] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    ageMin: '',
    ageMax: '',
    language: '',
    gender: [] as string[],
    hasDog: null as boolean | null,
    hasChildren: null as boolean | null,
  });

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  // Filter out creators who already have invitations
  const invitedCreatorIds = invitations.map(inv => inv.creator_id);
  const availableCreatorsBase = allCreators.filter(
    creator => !invitedCreatorIds.includes(creator.id)
  );

  // Apply filters
  const filteredCreators = availableCreatorsBase.filter(creator => {
    // Age filter
    if (filters.ageMin || filters.ageMax) {
      const age = differenceInYears(new Date(), new Date(creator.date_of_birth));
      if (filters.ageMin && age < parseInt(filters.ageMin)) return false;
      if (filters.ageMax && age > parseInt(filters.ageMax)) return false;
    }

    // Language filter
    if (filters.language && creator.primary_language !== filters.language) return false;

    // Gender filter
    if (filters.gender.length > 0 && !filters.gender.includes(creator.gender)) return false;

    // Has dog filter
    if (filters.hasDog !== null && creator.has_dog !== filters.hasDog) return false;

    // Has children filter
    if (filters.hasChildren !== null && creator.has_children !== filters.hasChildren) return false;

    return true;
  });

  const availableCreators = filteredCreators;

  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');
  const socialBubbleSelections = selections.filter(sel => sel.selected_by_role === 'social_bubble');
  const clientSelections = selections.filter(sel => sel.selected_by_role === 'client');

  const handleStatusUpdate = async (newStatus: CastingStatus) => {
    setLoading(true);
    try {
      const result = await updateCasting(casting.id, { status: newStatus });
      if (result.success) {
        toast.success('Status updated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitations = async () => {
    if (selectedCreators.length === 0) {
      toast.error('Please select at least one creator');
      return;
    }

    setLoading(true);
    try {
      const result = await sendCastingInvitations(casting.id, selectedCreators);
      if (result.success) {
        toast.success('Invitations sent successfully');
        setSelectedCreators([]);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to send invitations');
      }
    } catch (error) {
      toast.error('Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForClient = async () => {
    const selectedFromAccepted = acceptedInvitations
      .filter(inv => selectedCreators.includes(inv.creator_id))
      .map(inv => inv.creator_id);

    if (selectedFromAccepted.length === 0) {
      toast.error('Please select creators from the accepted invitations');
      return;
    }

    setLoading(true);
    try {
      const result = await selectCreatorsForClient(casting.id, selectedFromAccepted);
      if (result.success) {
        // Update status to send_client_feedback
        const statusResult = await updateCasting(casting.id, { status: 'send_client_feedback' });
        if (statusResult.success) {
          toast.success('Creators selected and sent for client review');
        } else {
          toast.success('Creators selected for client review');
        }
        setSelectedCreators([]);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to select creators');
      }
    } catch (error) {
      toast.error('Failed to select creators');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelection = async () => {
    const selectedFromSBSelections = socialBubbleSelections
      .filter(sel => selectedCreators.includes(sel.creator_id))
      .map(sel => sel.creator_id);

    if (selectedFromSBSelections.length === 0) {
      toast.error('Please select creators to approve');
      return;
    }

    if (selectedFromSBSelections.length > casting.max_creators) {
      toast.error(`You can only select up to ${casting.max_creators} creators`);
      return;
    }

    setLoading(true);
    try {
      const result = await selectFinalCreators(casting.id, selectedFromSBSelections);
      if (result.success) {
        toast.success('Creators approved successfully');
        setSelectedCreators([]);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to approve creators');
      }
    } catch (error) {
      toast.error('Failed to approve creators');
    } finally {
      setLoading(false);
    }
  };

  const toggleCreatorSelection = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const clearFilters = () => {
    setFilters({
      ageMin: '',
      ageMax: '',
      language: '',
      gender: [],
      hasDog: null,
      hasChildren: null,
    });
  };

  const toggleGenderFilter = (gender: string) => {
    setFilters(prev => ({
      ...prev,
      gender: prev.gender.includes(gender)
        ? prev.gender.filter(g => g !== gender)
        : [...prev.gender, gender]
    }));
  };

  const getCreatorInitials = (creator: Creator) => {
    return `${creator.first_name[0]}${creator.last_name[0]}`.toUpperCase();
  };

  const activeFilterCount = [
    filters.ageMin || filters.ageMax,
    filters.language,
    filters.gender.length > 0,
    filters.hasDog !== null,
    filters.hasChildren !== null,
  ].filter(Boolean).length;

  const handleLinkBriefing = async () => {
    if (!selectedBriefing) return;
    
    setLoading(true);
    try {
      const result = await linkBriefingToCasting(casting.id, selectedBriefing);
      if (result.success) {
        toast.success('Briefing linked successfully');
        setSelectedBriefing('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to link briefing');
      }
    } catch (error) {
      toast.error('Failed to link briefing');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkBriefing = async (briefingId: string) => {
    setLoading(true);
    try {
      const result = await unlinkBriefingFromCasting(casting.id, briefingId);
      if (result.success) {
        toast.success('Briefing unlinked successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to unlink briefing');
      }
    } catch (error) {
      toast.error('Failed to unlink briefing');
    } finally {
      setLoading(false);
    }
  };


  const handleReviewSubmission = async (creatorId: string, approved: boolean) => {
    const feedbackText = approved ? undefined : feedback[creatorId];
    
    if (!approved && !feedbackText) {
      toast.error('Please provide feedback for revision requests');
      return;
    }

    setLoading(true);
    try {
      const result = await reviewCreatorSubmission(casting.id, creatorId, approved, feedbackText);
      if (result.success) {
        toast.success(approved ? 'Submission approved' : 'Revision requested');
        setReviewingCreator(null);
        setFeedback(prev => {
          const newFeedback = { ...prev };
          delete newFeedback[creatorId];
          return newFeedback;
        });
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to review submission');
      }
    } catch (error) {
      toast.error('Failed to review submission');
    } finally {
      setLoading(false);
    }
  };

  const showCompensation = role === 'social_bubble';
  const canManageInvitations = role === 'social_bubble' && casting.status === 'draft';
  const canSelectForClient = role === 'social_bubble' && casting.status === 'check_intern';
  const canClientSelect = role === 'client' && casting.status === 'send_client_feedback';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={role === 'client' ? '/dashboard/client/castings' : '/dashboard/castings'}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{casting.title}</h1>
        <Badge className={`${statusColors[casting.status]} text-white`}>
          {statusLabels[casting.status]}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Casting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{casting.client?.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Creators</p>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <p className="font-medium">{casting.max_creators}</p>
              </div>
            </div>
            {showCompensation && (
              <div>
                <p className="text-sm text-muted-foreground">Compensation per Creator</p>
                <div className="flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  <p className="font-medium">{casting.compensation.toFixed(2)}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <p className="font-medium">{format(new Date(casting.created_at), 'PPP')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Management</CardTitle>
            <CardDescription>
              Update the casting status as it progresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {role === 'social_bubble' && (
              <div className="space-y-4">
                <Select 
                  value={casting.status} 
                  onValueChange={(value) => handleStatusUpdate(value as CastingStatus)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="inviting">Inviting</SelectItem>
                    <SelectItem value="check_intern">Check Intern</SelectItem>
                    <SelectItem value="send_client_feedback">Send to Client</SelectItem>
                    <SelectItem value="approved_by_client">Approved by Client</SelectItem>
                    <SelectItem value="shooting">Shooting</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Move the casting through different stages of the recruitment process.
                </p>
              </div>
            )}

            {role === 'client' && casting.status === 'send_client_feedback' && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Action Required</AlertTitle>
                  <AlertDescription>
                    Please review the selected creators below and approve your final selection.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => handleStatusUpdate('approved_by_client')}
                  disabled={clientSelections.length === 0 || loading}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Selected Creators
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={role === 'client' ? 'selections' : 'invitations'} className="space-y-4">
        <TabsList>
          {role !== 'client' && (
            <TabsTrigger value="invitations">
              Invitations ({invitations.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="selections">
            Selections ({selections.length})
          </TabsTrigger>
          {canManageInvitations && (
            <TabsTrigger value="invite">
              Invite Creators
            </TabsTrigger>
          )}
          {role === 'social_bubble' && (
            <>
              <TabsTrigger value="briefings">
                Briefings ({linkedBriefings.length})
              </TabsTrigger>
              <TabsTrigger value="submissions">
                Submissions ({creatorSubmissions.length})
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {role !== 'client' && (
          <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Creator Invitations</CardTitle>
              <CardDescription>
                {acceptedInvitations.length} accepted out of {invitations.length} invited
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No invitations sent yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canSelectForClient && <TableHead className="w-12"></TableHead>}
                      <TableHead>Creator</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead>Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        {canSelectForClient && (
                          <TableCell>
                            <Checkbox
                              checked={selectedCreators.includes(invitation.creator_id)}
                              onCheckedChange={() => toggleCreatorSelection(invitation.creator_id)}
                              disabled={invitation.status !== 'accepted'}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Link 
                            href={`/dashboard/creators/${invitation.creator_id}/view`}
                            className="font-medium hover:underline text-blue-600"
                          >
                            {invitation.creator?.first_name} {invitation.creator?.last_name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {invitation.status === 'accepted' && (
                            <Badge variant="outline" className="text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Accepted
                            </Badge>
                          )}
                          {invitation.status === 'rejected' && (
                            <Badge variant="outline" className="text-red-600">
                              <X className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                          {invitation.status === 'pending' && (
                            <Badge variant="outline" className="text-yellow-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invitation.invited_at), 'PP')}
                        </TableCell>
                        <TableCell>
                          {invitation.responded_at 
                            ? format(new Date(invitation.responded_at), 'PP')
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {canSelectForClient && acceptedInvitations.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={handleSelectForClient}
                    disabled={selectedCreators.length === 0 || loading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Selected to Client ({selectedCreators.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="selections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selected Creators</CardTitle>
              <CardDescription>
                Creators selected for this casting
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selections.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No creators selected yet
                </p>
              ) : (
                <div className="space-y-6">
                  {socialBubbleSelections.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Social Bubble Selections</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {canClientSelect && <TableHead className="w-12"></TableHead>}
                            <TableHead>Creator</TableHead>
                            <TableHead>Selected By</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {socialBubbleSelections.map((selection) => (
                            <TableRow key={selection.id}>
                              {canClientSelect && (
                                <TableCell>
                                  <Checkbox
                                    checked={selectedCreators.includes(selection.creator_id)}
                                    onCheckedChange={() => toggleCreatorSelection(selection.creator_id)}
                                  />
                                </TableCell>
                              )}
                              <TableCell>
                                <Link 
                                  href={`/dashboard/creators/${selection.creator_id}/view`}
                                  className="font-medium hover:underline text-blue-600"
                                >
                                  {selection.creator?.first_name} {selection.creator?.last_name}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">Social Bubble</Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(selection.created_at), 'PP')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {clientSelections.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Client Approved</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Creator</TableHead>
                            <TableHead>Selected By</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientSelections.map((selection) => (
                            <TableRow key={selection.id}>
                              <TableCell>
                                <Link 
                                  href={`/dashboard/creators/${selection.creator_id}/view`}
                                  className="font-medium hover:underline text-blue-600"
                                >
                                  {selection.creator?.first_name} {selection.creator?.last_name}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">Client</Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(selection.created_at), 'PP')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {canClientSelect && socialBubbleSelections.length > 0 && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleClientSelection}
                        disabled={selectedCreators.length === 0 || loading}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve Selected Creators ({selectedCreators.length} / {casting.max_creators})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canManageInvitations && (
          <TabsContent value="invite" className="space-y-4">
            {/* Filter Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>
                      Filter creators to find the perfect match
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <>
                        <Badge variant="secondary">
                          {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Age Range */}
                  <div className="space-y-2">
                    <Label>Age Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.ageMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
                        min="0"
                        max="100"
                      />
                      <span className="self-center">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.ageMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={filters.language || 'all'}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, language: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All languages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All languages</SelectItem>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <div className="space-y-2">
                      {['male', 'female', 'other', 'prefer-not-to-say'].map((gender) => (
                        <div key={gender} className="flex items-center space-x-2">
                          <Checkbox
                            id={`gender-${gender}`}
                            checked={filters.gender.includes(gender)}
                            onCheckedChange={() => toggleGenderFilter(gender)}
                          />
                          <label
                            htmlFor={`gender-${gender}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {gender === 'prefer-not-to-say' ? 'Prefer not to say' : gender}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Has Dog */}
                  <div className="space-y-2">
                    <Label>Has Dog</Label>
                    <Select
                      value={filters.hasDog === null ? 'any' : filters.hasDog ? 'yes' : 'no'}
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        hasDog: value === 'any' ? null : value === 'yes' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Has Children */}
                  <div className="space-y-2">
                    <Label>Has Children</Label>
                    <Select
                      value={filters.hasChildren === null ? 'any' : filters.hasChildren ? 'yes' : 'no'}
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        hasChildren: value === 'any' ? null : value === 'yes' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creators Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Select Creators</CardTitle>
                <CardDescription>
                  {availableCreators.length} creator{availableCreators.length !== 1 ? 's' : ''} available
                  {availableCreatorsBase.length !== availableCreators.length && 
                    ` (${availableCreatorsBase.length - availableCreators.length} filtered out)`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableCreators.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    {availableCreatorsBase.length === 0 
                      ? 'All creators have already been invited'
                      : 'No creators match your filters'
                    }
                  </p>
                ) : (
                  <>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableCreators.map((creator) => {
                          const age = differenceInYears(new Date(), new Date(creator.date_of_birth));
                          const isSelected = selectedCreators.includes(creator.id);
                          
                          return (
                            <div
                              key={creator.id}
                              className={`relative p-6 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                              }`}
                              onClick={() => toggleCreatorSelection(creator.id)}
                            >
                              <div className="absolute top-3 right-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleCreatorSelection(creator.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              
                              <div className="flex flex-col items-center text-center">
                                <Avatar className="h-[200px] w-[200px] mb-4">
                                  <AvatarImage 
                                    src={creator.profile_picture_url} 
                                    alt={`${creator.first_name} ${creator.last_name}`}
                                  />
                                  <AvatarFallback className="text-4xl">
                                    {getCreatorInitials(creator)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <h4 className="font-medium">
                                  {creator.first_name} {creator.last_name}
                                </h4>
                                
                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                  <p>{age} years old</p>
                                  <p className="capitalize">{creator.gender}</p>
                                </div>
                                
                                <Link 
                                  href={`/dashboard/creators/${creator.id}/view`}
                                  className="mt-3 text-sm text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View Profile
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <div className="mt-4 flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {selectedCreators.length} creator{selectedCreators.length !== 1 ? 's' : ''} selected
                      </p>
                      <Button 
                        onClick={handleSendInvitations}
                        disabled={selectedCreators.length === 0 || loading}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitations
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {role === 'social_bubble' && (
          <TabsContent value="briefings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Linked Briefings</CardTitle>
                <CardDescription>
                  Manage briefings linked to this casting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linkedBriefings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No briefings linked yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Briefing</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Linked Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedBriefings.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <Link 
                              href={`/dashboard/briefings/${link.briefing_id}`}
                              className="font-medium hover:underline text-blue-600"
                            >
                              {link.briefing?.title || 'Unnamed Briefing'}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {link.briefing?.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {link.linked_at ? format(new Date(link.linked_at), 'PP') : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnlinkBriefing(link.briefing_id)}
                              disabled={loading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <Select
                      value={selectedBriefing}
                      onValueChange={setSelectedBriefing}
                      disabled={loading || availableBriefings.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a briefing to link" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBriefings.map((briefing) => (
                          <SelectItem key={briefing.id} value={briefing.id}>
                            {briefing.title || `Briefing ${briefing.id.slice(0, 8)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleLinkBriefing}
                      disabled={!selectedBriefing || loading}
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link Briefing
                    </Button>
                  </div>
                  {availableBriefings.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No available briefings for this client or all briefings are already linked.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {role === 'social_bubble' && (
          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Creator Submissions</CardTitle>
                <CardDescription>
                  Manage content upload links and review creator submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientSelections.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No creators have been approved by the client yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {clientSelections.map((selection) => {
                      const submission = creatorSubmissions.find(
                        sub => sub.creator_id === selection.creator_id
                      );
                      const isReviewing = reviewingCreator === selection.creator_id;
                      
                      return (
                        <Card key={selection.id}>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Link 
                                    href={`/dashboard/creators/${selection.creator_id}/view`}
                                    className="font-medium hover:underline text-blue-600"
                                  >
                                    {selection.creator?.first_name} {selection.creator?.last_name}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-1">
                                    {submission && (
                                      <Badge 
                                        variant="outline" 
                                        className={submission.submission_status === 'approved' ? 'text-green-600' : submission.submission_status === 'pending_review' ? 'text-yellow-600' : 'text-blue-600'}
                                      >
                                        {submission.submission_status.replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Google Drive Folder
                                </label>
                                <div className="flex gap-2">
                                  {submission?.drive_folder_url ? (
                                    <>
                                      <Input
                                        value={submission.drive_folder_url}
                                        disabled
                                        readOnly
                                        className="flex-1"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                      >
                                        <a 
                                          href={submission.drive_folder_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          Open
                                        </a>
                                      </Button>
                                    </>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      Drive folder will be created when the casting moves to shooting status
                                    </p>
                                  )}
                                </div>
                              </div>

                              {submission?.drive_folder_url && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Google Drive Folder
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 p-2 bg-muted rounded-md text-sm">
                                      {submission.drive_folder_url}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                    >
                                      <a 
                                        href={submission.drive_folder_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open Folder
                                      </a>
                                    </Button>
                                  </div>
                                  {submission.drive_folder_created_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Folder created: {format(new Date(submission.drive_folder_created_at), 'PPp')}
                                    </p>
                                  )}
                                </div>
                              )}

                              {submission?.submission_status === 'pending_review' && (
                                <div className="space-y-2">
                                  <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Review Required</AlertTitle>
                                    <AlertDescription>
                                      Creator has submitted their work. Please review and provide feedback.
                                    </AlertDescription>
                                  </Alert>
                                  
                                  {isReviewing ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        placeholder="Provide feedback for the creator..."
                                        value={feedback[selection.creator_id] || ''}
                                        onChange={(e) => setFeedback(prev => ({
                                          ...prev,
                                          [selection.creator_id]: e.target.value
                                        }))}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleReviewSubmission(selection.creator_id, true)}
                                          disabled={loading}
                                        >
                                          <Check className="h-4 w-4 mr-2" />
                                          Approve
                                        </Button>
                                        <Button
                                          onClick={() => handleReviewSubmission(selection.creator_id, false)}
                                          disabled={!feedback[selection.creator_id] || loading}
                                          variant="outline"
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Request Revision
                                        </Button>
                                        <Button
                                          onClick={() => setReviewingCreator(null)}
                                          variant="ghost"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      onClick={() => setReviewingCreator(selection.creator_id)}
                                      disabled={loading}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Review Submission
                                    </Button>
                                  )}
                                </div>
                              )}

                              {submission?.feedback && submission.submission_status === 'revision_requested' && (
                                <Alert>
                                  <MessageSquare className="h-4 w-4" />
                                  <AlertTitle>Revision Feedback</AlertTitle>
                                  <AlertDescription>{submission.feedback}</AlertDescription>
                                </Alert>
                              )}

                              {submission?.submission_status === 'approved' && (
                                <Alert className="border-green-200 bg-green-50">
                                  <Check className="h-4 w-4 text-green-600" />
                                  <AlertTitle className="text-green-800">Approved</AlertTitle>
                                  <AlertDescription className="text-green-700">
                                    Creator's submission has been approved.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}