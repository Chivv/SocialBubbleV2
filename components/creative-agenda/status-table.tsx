'use client';

import { CreativeAgendaCard } from '@/types';

interface StatusTableProps {
  title: string;
  status: string;
  cards: CreativeAgendaCard[];
  onCardEdit: (card: CreativeAgendaCard) => void;
  isHighlighted?: boolean;
  description?: string;
}

export function StatusTable({ 
  title, 
  cards, 
  onCardEdit,
  isHighlighted,
  description 
}: StatusTableProps) {
  return (
    <div className={`p-4 ${isHighlighted ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <span className="text-sm text-muted-foreground">{cards.length} items</span>
      </div>
      
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No items</p>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div 
              key={card.id}
              className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onCardEdit(card)}
            >
              <div>
                <p className="font-medium">{card.title}</p>
                <p className="text-sm text-muted-foreground">{(card as any).campaign_name || (card as any).client_name || ''}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(card.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}