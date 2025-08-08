'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreativeAgendaCard, PublicationStatus } from '@/types';
import { StatusTable } from '@/components/creative-agenda/status-table';
import { Card } from '@/components/ui/card';
import { RefreshCw, MessageSquare, CheckCircle2, TrendingUp, ShoppingCart } from 'lucide-react';
import { getCardsByDepartment, updateCardStatus } from '@/app/actions/creative-agenda';
import { toast } from 'sonner';

const statusColumns: { 
  status: PublicationStatus; 
  title: string; 
  isHighlighted?: boolean; 
  description?: string;
  icon?: React.ReactNode;
}[] = [
  { 
    status: 'waiting_client_feedback', 
    title: 'Waiting Client Feedback',
    isHighlighted: true,
    icon: <MessageSquare className="h-4 w-4" />
  },
  { 
    status: 'client_feedback_given', 
    title: 'Client Feedback Given',
    isHighlighted: true,
    icon: <MessageSquare className="h-4 w-4 fill-current" />
  },
  { 
    status: 'client_feedback_processed', 
    title: 'Feedback Processed',
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  { 
    status: 'media_buying', 
    title: 'Media Buying',
    description: 'Being promoted',
    icon: <ShoppingCart className="h-4 w-4" />
  },
  { 
    status: 'done', 
    title: 'Done',
    description: 'Published & complete',
    icon: <TrendingUp className="h-4 w-4" />
  },
];

export function PublicationClient() {
  const router = useRouter();
  const [cards, setCards] = useState<CreativeAgendaCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCards = async () => {
    try {
      const fetchedCards = await getCardsByDepartment('publication');
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


  const handleCardEdit = (card: CreativeAgendaCard) => {
    router.push(`/dashboard/creative-agenda/card/${card.id}`);
  };

  const getCardsByStatus = (status: PublicationStatus) => {
    return cards.filter(card => card.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const feedbackCount = getCardsByStatus('waiting_client_feedback').length + 
                       getCardsByStatus('client_feedback_given').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publication</h1>
          <p className="text-muted-foreground mt-1">
            Final approval, publishing, and media buying
          </p>
        </div>
        {feedbackCount > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 px-4 py-2 rounded-lg">
            <MessageSquare className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">
              {feedbackCount} cards need attention
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {statusColumns.map((column) => (
          <Card key={column.status} className="overflow-hidden">
            <StatusTable
              title={column.title}
              status={column.status}
              cards={getCardsByStatus(column.status)}
              onCardEdit={handleCardEdit}
              isHighlighted={column.isHighlighted}
              description={column.description}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}