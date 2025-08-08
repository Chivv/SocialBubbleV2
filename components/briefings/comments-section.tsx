'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BriefingComment } from '@/types';
import { format } from 'date-fns';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface CommentsSectionProps {
  comments: BriefingComment[];
  onAddComment: (content: string) => Promise<{ success: boolean; error?: string }>;
  currentUserRole: 'social_bubble' | 'client';
}

export function CommentsSection({ comments, onAddComment, currentUserRole }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await onAddComment(newComment.trim());
      if (result.success) {
        setNewComment('');
        toast.success('Comment added successfully');
      } else {
        toast.error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'social_bubble' ? 'default' : 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback & Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div key={comment.id}>
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(comment.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.user?.name || 'Unknown User'}
                        </span>
                        <Badge variant={getRoleBadgeVariant(comment.user_role)} className="text-xs">
                          {comment.user_role === 'social_bubble' ? 'Team' : 'Client'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                  {index < comments.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <Separator />

        <div className="space-y-2">
          <Textarea
            placeholder={
              currentUserRole === 'client' 
                ? "Add your feedback here..." 
                : "Reply to client feedback..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Press ⌘+Enter to submit
            </p>
            <Button 
              onClick={handleSubmit} 
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Comment'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}