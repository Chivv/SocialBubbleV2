'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreativeAgendaCard, ConceptingStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, RefreshCw, Building2, FileText, Lightbulb, Calendar, Edit2 } from 'lucide-react';
import { getCardsByDepartment, updateCardStatus } from '@/app/actions/creative-agenda';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColumns: { status: ConceptingStatus; title: string; isHighlighted?: boolean }[] = [
  { status: 'to_do', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'waiting_internal_feedback', title: 'Waiting Internal Feedback', isHighlighted: true },
  { status: 'internal_feedback_given', title: 'Internal Feedback Given', isHighlighted: true },
  { status: 'sent_client_feedback', title: 'Sent Client Feedback' },
  { status: 'approved', title: 'Approved' },
];

export function ConceptingClient() {
  const router = useRouter();
  const [cards, setCards] = useState<CreativeAgendaCard[]>([]);
  const [loading, setLoading] = useState(true);

  const columns: ColumnDef<CreativeAgendaCard>[] = [
    {
      id: 'icon',
      header: '',
      cell: ({ row }) => {
        const card = row.original;
        if (card.card_type === 'briefing') return <FileText className="h-4 w-4" />;
        return <Lightbulb className="h-4 w-4" />;
      },
      size: 40,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('title')}</span>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      cell: ({ row }) => {
        const card = row.original;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{card.client?.company_name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'card_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.getValue('card_type') === 'briefing' ? 'Briefing' : 'Concept'}
        </Badge>
      ),
    },
    {
      id: 'properties',
      header: 'Properties',
      cell: ({ row }) => {
        const card = row.original;
        if (!card.properties) return '-';
        
        return (
          <div className="flex flex-wrap gap-1">
            {card.properties.format && (
              <Badge variant="secondary" className="text-xs">
                {card.properties.format}
              </Badge>
            )}
            {card.properties.video_type && (
              <Badge variant="secondary" className="text-xs">
                {card.properties.video_type}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'deadline',
      header: 'Deadline',
      cell: ({ row }) => {
        const deadline = row.getValue('deadline') as string | undefined;
        if (!deadline) return '-';
        
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        const color = daysUntil < 0 ? 'text-red-600' : daysUntil <= 3 ? 'text-orange-600' : 'text-muted-foreground';
        
        return (
          <div className={cn("flex items-center gap-1 text-sm", color)}>
            <Calendar className="h-3 w-3" />
            <span>{format(deadlineDate, 'PP')}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'last_edited_at',
      header: 'Last Edited',
      cell: ({ row }) => {
        const lastEdited = row.getValue('last_edited_at') as string | undefined;
        if (!lastEdited) return '-';
        
        return (
          <span className="text-xs text-muted-foreground">
            {format(new Date(lastEdited), 'PP')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const card = row.original;
        return (
          <div className="text-right">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => router.push(`/dashboard/creative-agenda/card/${card.id}`)}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>
        );
      },
    }
  ];

  const loadCards = async () => {
    try {
      const fetchedCards = await getCardsByDepartment('concepting');
      setCards(fetchedCards);
    } catch (error) {
      console.error('Error loading cards:', error);
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);


  const getCardsByStatus = (status: ConceptingStatus) => {
    return cards.filter(card => card.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Concepting</h1>
          <p className="text-muted-foreground mt-1">
            Create and refine content concepts before production
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/creative-agenda/concepting/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Concept
        </Button>
      </div>

      <div className="space-y-8">
        {statusColumns.map((column) => {
          const statusCards = getCardsByStatus(column.status);
          return (
            <div key={column.status} className="space-y-4">
              <div className={cn(
                "flex items-center justify-between",
                column.isHighlighted && "px-4 py-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg"
              )}>
                <h3 className="text-lg font-semibold">{column.title}</h3>
                <Badge variant="secondary">{statusCards.length}</Badge>
              </div>
              <DataTable columns={columns} data={statusCards} />
            </div>
          );
        })}
      </div>
    </div>
  );
}