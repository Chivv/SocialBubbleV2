'use client';

import { CreativeAgendaCard } from '@/types';
import { AgendaCard } from './agenda-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface StatusColumnProps {
  title: string;
  status: string;
  cards: CreativeAgendaCard[];
  onCardEdit: (card: CreativeAgendaCard) => void;
  onCardDrop?: (cardId: string, newStatus: string) => void;
  isHighlighted?: boolean;
  description?: string;
}

export function StatusColumn({ 
  title, 
  status, 
  cards, 
  onCardEdit,
  onCardDrop,
  isHighlighted,
  description
}: StatusColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-accent');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-accent');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-accent');
    
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId && onCardDrop) {
      onCardDrop(cardId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, card: CreativeAgendaCard) => {
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex flex-col h-full">
      <div className={cn(
        "px-4 py-3 border-b",
        isHighlighted && "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
      )}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {cards.length}
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <ScrollArea 
        className="flex-1 p-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-3 min-h-[200px]">
          {cards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No cards
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, card)}
                className="cursor-move"
              >
                <AgendaCard 
                  card={card} 
                  onEdit={() => onCardEdit(card)}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}