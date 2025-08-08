import { Badge } from '@/components/ui/badge';
import { BriefingStatus } from '@/types';

interface StatusBadgeProps {
  status: BriefingStatus;
}

const statusConfig: Record<BriefingStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  draft: { label: 'Draft', variant: 'secondary' },
  waiting_internal_feedback: { label: 'Waiting Internal Feedback', variant: 'destructive' },
  internal_feedback_given: { label: 'Internal Feedback Given', variant: 'destructive' },
  sent_client_feedback: { label: 'Sent to Client', variant: 'default' },
  client_feedback_given: { label: 'Client Feedback Given', variant: 'destructive' },
  approved: { label: 'Approved', variant: 'default' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}