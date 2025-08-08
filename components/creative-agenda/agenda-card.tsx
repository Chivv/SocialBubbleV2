'use client';

import { CreativeAgendaCard } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Building2, FileText, Lightbulb, Clock, 
  Users, CheckCircle, AlertCircle, Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AgendaCardProps {
  card: CreativeAgendaCard;
  onEdit?: () => void;
  onStatusChange?: (newStatus: string) => void;
  isDragging?: boolean;
}

export function AgendaCard({ card, onEdit, isDragging }: AgendaCardProps) {
  const isWaitlist = false; // waitlist status removed
  const isBriefingCard = card.card_type === 'briefing';
  
  const getCardIcon = () => {
    if (isBriefingCard) return FileText;
    return Lightbulb;
  };

  const Icon = getCardIcon();

  const getDeadlineColor = () => {
    if (!card.deadline) return '';
    const deadline = new Date(card.deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'text-red-600';
    if (daysUntil <= 3) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  return (
    <Card 
      className={cn(
        "cursor-move transition-all",
        isDragging && "opacity-50 rotate-2 scale-105",
        isWaitlist && "border-orange-500"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{card.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{card.client?.company_name}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {isBriefingCard ? 'Briefing' : 'Concept'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Waitlist Info */}
        {/* isWaitlist && card.waitlist_data && (
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Creators Progress</span>
              <span className="text-orange-600">
                {card.waitlist_data.approved_creators}/{card.waitlist_data.total_creators}
              </span>
            </div>
            <div className="space-y-1">
              {card.waitlist_data.creator_statuses.slice(0, 3).map((creator) => (
                <div key={creator.creator_id} className="flex items-center gap-2 text-xs">
                  {creator.submission_status === 'approved' ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <Clock className="h-3 w-3 text-orange-600" />
                  )}
                  <span className="truncate">{creator.creator_name}</span>
                </div>
              ))}
              {card.waitlist_data.creator_statuses.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{card.waitlist_data.creator_statuses.length - 3} more
                </span>
              )}
            </div>
          </div>
        ) */}

        {/* Properties for concept cards */}
        {card.properties && (
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
        )}

        {/* Deadline */}
        {card.deadline && (
          <div className={cn("flex items-center gap-1 text-xs", getDeadlineColor())}>
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(card.deadline), 'PP')}</span>
          </div>
        )}

        {/* Last edited */}
        {card.last_edited_at && (
          <div className="text-xs text-muted-foreground">
            Last edited {format(new Date(card.last_edited_at), 'PP')}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}