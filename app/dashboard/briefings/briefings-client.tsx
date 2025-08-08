'use client';

import { useEffect, useState, useMemo } from 'react';
import { Briefing, Client, BriefingStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Building2, Calendar, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { StatusBadge } from '@/components/briefings/status-badge';
import { cn } from '@/lib/utils';

interface BriefingsClientProps {
  initialBriefings: Briefing[];
  initialClients: Client[];
}

const statusOrder: BriefingStatus[] = [
  'client_feedback_given',
  'waiting_internal_feedback',
  'internal_feedback_given',
  'draft',
  'sent_client_feedback',
  'approved'
];

const statusLabels: Record<BriefingStatus, string> = {
  draft: 'Draft',
  waiting_internal_feedback: 'Waiting for Internal Feedback',
  internal_feedback_given: 'Internal Feedback Given',
  sent_client_feedback: 'Sent to Client',
  client_feedback_given: 'Client Feedback Given',
  approved: 'Approved'
};

const actionRequiredStatuses: BriefingStatus[] = [
  'client_feedback_given',
  'waiting_internal_feedback',
  'internal_feedback_given'
];

export default function BriefingsClient({ initialBriefings, initialClients }: BriefingsClientProps) {
  const { role } = useUserRole();
  const [briefings] = useState<Briefing[]>(initialBriefings);
  const [clients] = useState<Client[]>(initialClients);
  const [filteredBriefings, setFilteredBriefings] = useState<Briefing[]>(initialBriefings);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let filtered = briefings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(briefing => {
        const searchLower = searchTerm.toLowerCase();
        return (
          briefing.title.toLowerCase().includes(searchLower) ||
          briefing.client?.company_name?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(briefing => briefing.client_id === clientFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(briefing => briefing.status === statusFilter);
    }

    setFilteredBriefings(filtered);
  }, [searchTerm, clientFilter, statusFilter, briefings]);

  const getPreviewText = (content: any): string => {
    if (!content || !content.content) return 'No content';
    
    // Extract text from Tiptap JSON content
    const extractText = (nodes: any[]): string => {
      let text = '';
      nodes.forEach(node => {
        if (node.type === 'text') {
          text += node.text;
        } else if (node.content) {
          text += extractText(node.content) + ' ';
        }
      });
      return text;
    };

    const fullText = extractText(content.content);
    return fullText.length > 150 ? fullText.substring(0, 150) + '...' : fullText;
  };

  // Group briefings by status
  const groupedBriefings = useMemo(() => {
    const groups: Record<BriefingStatus, Briefing[]> = {} as Record<BriefingStatus, Briefing[]>;
    
    // Initialize empty arrays for each status
    statusOrder.forEach(status => {
      groups[status] = [];
    });
    
    // Group filtered briefings
    filteredBriefings.forEach(briefing => {
      if (groups[briefing.status]) {
        groups[briefing.status].push(briefing);
      }
    });
    
    return groups;
  }, [filteredBriefings]);

  const renderBriefingCard = (briefing: Briefing) => {
    return (
      <Link key={briefing.id} href={`/dashboard/briefings/${briefing.id}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {briefing.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  {briefing.client?.company_name || 'Unknown Client'}
                </CardDescription>
              </div>
              <StatusBadge status={briefing.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {getPreviewText(briefing.content)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(briefing.created_at), 'PPp')}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Briefings</h1>
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOrder.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={clientFilter}
            onValueChange={setClientFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search briefings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          {role === 'social_bubble' && (
            <Link href="/dashboard/briefings/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Briefing
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredBriefings.length} of {briefings.length} briefings
      </div>

      {/* Grouped view */}
      <div className="space-y-8">
        {statusOrder.map((status) => {
          const briefingsInStatus = groupedBriefings[status];
          if (briefingsInStatus.length === 0 && statusFilter !== 'all') return null;
          
          const isActionRequired = actionRequiredStatuses.includes(status);
          
          return (
            <div key={status} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className={cn(
                  "text-lg font-semibold",
                  isActionRequired && "text-orange-600 dark:text-orange-500"
                )}>
                  {isActionRequired && <AlertCircle className="inline-block h-5 w-5 mr-1" />}
                  {statusLabels[status]}
                </h2>
                <span className={cn(
                  "text-sm px-2 py-1 rounded-full",
                  isActionRequired 
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {briefingsInStatus.length}
                </span>
                {isActionRequired && (
                  <span className="text-sm text-orange-600 dark:text-orange-500 font-medium">
                    Action Required
                  </span>
                )}
              </div>
              
              {briefingsInStatus.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {briefingsInStatus.map(renderBriefingCard)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  No briefings in this status
                </p>
              )}
            </div>
          );
        })}
      </div>

      {filteredBriefings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm || clientFilter !== 'all' || statusFilter !== 'all'
              ? 'No briefings found matching your filters.' 
              : 'No briefings yet. Create your first briefing!'}
          </p>
        </div>
      )}
    </div>
  );
}