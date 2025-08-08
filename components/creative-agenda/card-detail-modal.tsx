'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreativeAgendaCard, CreativeAgendaComment, FormatType, VideoType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CommentsSection } from '@/components/briefings/comments-section';
import BriefingEditor from '@/components/briefings/editor';
import { StatusBadge } from '@/components/briefings/status-badge';
import { 
  updateCardContent, 
  updateConceptCardProperties, 
  addCardComment,
  getCardComments 
} from '@/app/actions/creative-agenda';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Save, FileText, Lightbulb, Link, Video, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CardDetailModalProps {
  card: CreativeAgendaCard | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const formatTypeOptions: { value: FormatType; label: string }[] = [
  { value: '4:5', label: '4:5 (Portrait)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '9:16', label: '9:16 (Story)' },
  { value: '9:16_safe', label: '9:16 with Safe Zones' },
  { value: '6:4', label: '6:4 (Landscape)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
];

export function CardDetailModal({ card, isOpen, onClose, onUpdate }: CardDetailModalProps) {
  const router = useRouter();
  const [content, setContent] = useState(card?.content || {});
  const [title, setTitle] = useState(card?.title || '');
  const [deadline, setDeadline] = useState<Date | undefined>(
    card?.deadline ? new Date(card.deadline) : undefined
  );
  const [comments, setComments] = useState<CreativeAgendaComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Concept card properties
  const [frameLink, setFrameLink] = useState(card?.properties?.frame_link || '');
  const [exampleVideoUrl, setExampleVideoUrl] = useState(card?.properties?.example_video_url || '');
  const [videoType, setVideoType] = useState<VideoType | ''>(card?.properties?.video_type || '');
  const [formatType, setFormatType] = useState<FormatType | ''>(card?.properties?.format || '');

  useEffect(() => {
    if (card) {
      setContent(card.content);
      setTitle(card.title);
      setDeadline(card.deadline ? new Date(card.deadline) : undefined);
      setFrameLink(card.properties?.frame_link || '');
      setExampleVideoUrl(card.properties?.example_video_url || '');
      setVideoType(card.properties?.video_type || '');
      setFormatType(card.properties?.format || '');
      loadComments();
    }
  }, [card]);

  const loadComments = async () => {
    if (!card) return;
    setIsLoading(true);
    try {
      const fetchedComments = await getCardComments(card.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!card) return;
    
    setIsSaving(true);
    try {
      // Save content and title
      const contentResult = await updateCardContent(card.id, content, title);
      if (!contentResult.success) {
        throw new Error(contentResult.error);
      }

      // Save concept card properties if it's a concept card
      if (card.card_type === 'concept') {
        const propsResult = await updateConceptCardProperties(card.id, {
          frame_link: frameLink || undefined,
          example_video_url: exampleVideoUrl || undefined,
          video_type: videoType || undefined,
          format: formatType || undefined,
        });
        if (!propsResult.success) {
          throw new Error(propsResult.error);
        }
      }

      toast.success('Card updated successfully');
      onUpdate?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update card');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (commentContent: string) => {
    if (!card) return { success: false, error: 'No card selected' };
    
    const result = await addCardComment(card.id, commentContent);
    if (result.success) {
      await loadComments();
      router.refresh();
    }
    return result;
  };

  if (!card) return null;

  const isBriefingCard = card.card_type === 'briefing';
  const isEditable = !isBriefingCard || card.department !== 'concepting';
  const isCreatorCard = isBriefingCard && card.creator_id && card.department === 'editing';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isBriefingCard ? (
                <FileText className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Lightbulb className="h-5 w-5 text-muted-foreground" />
              )}
              <DialogTitle>{title || 'Untitled'}</DialogTitle>
              <Badge variant="outline">
                {isBriefingCard ? 'Briefing Card' : 'Concept Card'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{card.department}</Badge>
              <Badge variant="outline">{card.status.replace(/_/g, ' ')}</Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            {!isBriefingCard && (
              <TabsTrigger value="properties">Properties</TabsTrigger>
            )}
            <TabsTrigger value="comments">
              Comments
              {comments.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {comments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="content" className="h-full p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isEditable}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !deadline && "text-muted-foreground"
                        )}
                        disabled={!isEditable}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP") : "Set deadline"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {isCreatorCard && card.briefing_id ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-medium mb-2">Linked Briefing</h3>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => router.push(`/dashboard/briefings/${card.briefing_id}`)}
                      >
                        <span>View Original Briefing</span>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex-1">
                      <Label>Creator Notes</Label>
                      <div className="mt-1 border rounded-md">
                        <BriefingEditor
                          content={content}
                          onChange={setContent}
                          editable={isEditable}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <Label>Content</Label>
                      <div className="mt-1 border rounded-md">
                        <BriefingEditor
                          content={content}
                          onChange={setContent}
                          editable={isEditable}
                        />
                      </div>
                    </div>

                    {!isEditable && (
                      <p className="text-sm text-muted-foreground">
                        Note: Briefing cards in concepting cannot be edited directly. 
                        Edit the briefing document to update this card.
                      </p>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {!isBriefingCard && (
              <TabsContent value="properties" className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="frame-link">Frame Link</Label>
                    <Input
                      id="frame-link"
                      type="url"
                      placeholder="https://..."
                      value={frameLink}
                      onChange={(e) => setFrameLink(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="example-video">Example Video URL</Label>
                    <Input
                      id="example-video"
                      type="url"
                      placeholder="https://..."
                      value={exampleVideoUrl}
                      onChange={(e) => setExampleVideoUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="video-type">Video Type</Label>
                      <Select value={videoType} onValueChange={(v) => setVideoType(v as VideoType)}>
                        <SelectTrigger id="video-type" className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="static">Static</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="format">Format</Label>
                      <Select value={formatType} onValueChange={(v) => setFormatType(v as FormatType)}>
                        <SelectTrigger id="format" className="mt-1">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {formatTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="comments" className="p-4">
              <CommentsSection
                comments={comments}
                onAddComment={handleAddComment}
                currentUserRole="social_bubble"
              />
            </TabsContent>

            <TabsContent value="history" className="p-4">
              <div className="text-center py-8 text-muted-foreground">
                Status history coming soon...
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {isEditable && (
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}