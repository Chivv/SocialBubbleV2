'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreativeAgendaCard, 
  CreativeAgendaComment, 
  FormatType, 
  VideoType,
  ConceptingStatus,
  EditingStatus,
  PublicationStatus,
  Department,
  GlobalPlaceholder
} from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentsSection } from '@/components/briefings/comments-section';
import BriefingEditor from '@/components/briefings/editor';
import { EditorWithPlaceholders } from '@/components/briefings/editor-with-placeholders';
import { 
  updateCardContent, 
  updateConceptCardProperties, 
  addCardComment,
  getCardComments,
  updateCardStatus 
} from '@/app/actions/creative-agenda';
import { getCreatorSubmissions } from '@/app/actions/casting-briefings';
import { getCreativeAgendaPlaceholders } from '@/app/actions/placeholders';
import { replacePlaceholders } from '@/lib/placeholders/replacer';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Save, 
  FileText, 
  Lightbulb, 
  Link, 
  ExternalLink,
  ArrowLeft,
  Building2,
  Clock,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CardDetailClientProps {
  card: CreativeAgendaCard;
}

const formatTypeOptions: { value: FormatType; label: string }[] = [
  { value: '4:5', label: '4:5 (Portrait)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '9:16', label: '9:16 (Story)' },
  { value: '9:16_safe', label: '9:16 with Safe Zones' },
  { value: '6:4', label: '6:4 (Landscape)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
];

export function CardDetailClient({ card: initialCard }: CardDetailClientProps) {
  const router = useRouter();
  const [card, setCard] = useState(initialCard);
  // Ensure content is always an object, never a string
  const [content, setContent] = useState(() => {
    if (!card.content) {
      return { type: 'doc', content: [{ type: 'paragraph' }] };
    }
    if (typeof card.content === 'string') {
      try {
        return JSON.parse(card.content);
      } catch {
        return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: card.content }] }] };
      }
    }
    return card.content;
  });
  const [title, setTitle] = useState(card.title || '');
  const [deadline, setDeadline] = useState<Date | undefined>(
    card.deadline ? new Date(card.deadline) : undefined
  );
  const [comments, setComments] = useState<CreativeAgendaComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [contentLink, setContentLink] = useState<string | null>(null);
  const [status, setStatus] = useState(card.status);
  const [placeholders, setPlaceholders] = useState<GlobalPlaceholder[]>([]);
  const [processedContent, setProcessedContent] = useState(content);
  
  // Concept card properties
  const [frameLink, setFrameLink] = useState(card.properties?.frame_link || '');
  const [exampleVideoUrl, setExampleVideoUrl] = useState(card.properties?.example_video_url || '');
  const [videoType, setVideoType] = useState<VideoType | ''>(card.properties?.video_type || '');
  const [formatType, setFormatType] = useState<FormatType | ''>(card.properties?.format || '');

  useEffect(() => {
    loadComments();
  }, [card.id]);

  useEffect(() => {
    if (card.creator_id && card.casting_id) {
      loadCreatorContentLink();
    }
  }, [card.creator_id, card.casting_id]);

  useEffect(() => {
    async function loadPlaceholders() {
      const loadedPlaceholders = await getCreativeAgendaPlaceholders();
      setPlaceholders(loadedPlaceholders);
    }
    loadPlaceholders();
  }, []);

  useEffect(() => {
    if (card.client && placeholders.length > 0) {
      const replaced = replacePlaceholders(content, {
        client: card.client,
        globalPlaceholders: placeholders,
        creativeAgendaPlaceholders: placeholders // Pass the same array since it includes both
      });
      setProcessedContent(replaced);
    } else {
      setProcessedContent(content);
    }
  }, [content, card.client, placeholders]);

  const loadComments = async () => {
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

  const loadCreatorContentLink = async () => {
    if (!card.casting_id || !card.creator_id) return;
    
    try {
      const submissions = await getCreatorSubmissions(card.casting_id);
      
      if (submissions && submissions.length > 0) {
        const creatorSubmission = submissions.find(s => s.creator_id === card.creator_id);
        
        if (creatorSubmission?.content_upload_link) {
          setContentLink(creatorSubmission.content_upload_link);
        }
      }
    } catch (error) {
      console.error('Error loading creator content link:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update status if changed
      if (status !== card.status) {
        const statusResult = await updateCardStatus(card.id, status);
        if (!statusResult.success) {
          throw new Error(statusResult.error);
        }
      }

      // Save content, title, and deadline
      const contentResult = await updateCardContent(
        card.id, 
        JSON.stringify(content), // Send as string to preserve all properties (same as briefings)
        title,
        deadline?.toISOString()
      );
      if (!contentResult.success) {
        throw new Error(contentResult.error);
      }

      // Save card properties (frame link for all cards, other properties for concept cards)
      const propertiesToSave: any = {
        frame_link: frameLink || undefined,
      };

      if (card.card_type === 'concept') {
        propertiesToSave.example_video_url = exampleVideoUrl || undefined;
        propertiesToSave.video_type = videoType || undefined;
        propertiesToSave.format = formatType || undefined;
      }

      const propsResult = await updateConceptCardProperties(card.id, propertiesToSave);
      if (!propsResult.success) {
        throw new Error(propsResult.error);
      }

      toast.success('Card updated successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update card');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (commentContent: string) => {
    const result = await addCardComment(card.id, commentContent);
    if (result.success) {
      await loadComments();
      router.refresh();
    }
    return result;
  };

  const isBriefingCard = card.card_type === 'briefing';
  const isEditable = !isBriefingCard || card.department !== 'concepting';
  const isCreatorCard = isBriefingCard && card.creator_id && card.department === 'editing';

  // Get available statuses based on department
  const getStatusOptions = () => {
    switch (card.department) {
      case 'concepting':
        return [
          { value: 'to_do', label: 'To Do' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'waiting_internal_feedback', label: 'Waiting Internal Feedback' },
          { value: 'internal_feedback_given', label: 'Internal Feedback Given' },
          { value: 'sent_client_feedback', label: 'Sent Client Feedback' },
          { value: 'approved', label: 'Approved' }
        ];
      case 'editing':
        return [
          { value: 'to_do', label: 'To Do' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'waiting_internal_feedback', label: 'Waiting Internal Feedback' },
          { value: 'internal_feedback_given', label: 'Internal Feedback Given' },
          { value: 'approved', label: 'Approved' }
        ];
      case 'publication':
        return [
          { value: 'waiting_client_feedback', label: 'Waiting Client Feedback' },
          { value: 'client_feedback_given', label: 'Client Feedback Given' },
          { value: 'client_feedback_processed', label: 'Client Feedback Processed' },
          { value: 'media_buying', label: 'Media Buying' },
          { value: 'done', label: 'Done' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/creative-agenda/${card.department}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {card.department}
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-muted">
              {isBriefingCard ? (
                <FileText className="h-6 w-6" />
              ) : (
                <Lightbulb className="h-6 w-6" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {isBriefingCard ? 'Briefing Card' : 'Concept Card'}
                </Badge>
                <Badge>{card.department}</Badge>
                <Badge variant="secondary">{card.status.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
          </div>
          
          {isEditable && (
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{card.client?.company_name}</p>
              </div>
            </div>
            
            {card.deadline && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium">{format(new Date(card.deadline), 'PPP')}</p>
                </div>
              </div>
            )}
            
            {card.last_edited_at && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Edited</p>
                  <p className="font-medium">{format(new Date(card.last_edited_at), 'PPP')}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="content">Content & Properties</TabsTrigger>
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

        <TabsContent value="content" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Content & Properties</CardTitle>
              {!isEditable && (
                <CardDescription>
                  Note: Briefing cards in concepting cannot be edited directly. 
                  Edit the briefing document to update this card.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={status} 
                    onValueChange={(value) => setStatus(value as typeof status)}
                    disabled={!isEditable}
                  >
                    <SelectTrigger id="status" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getStatusOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Frame Link - Available for all card types */}
              <div>
                <Label htmlFor="frame-link">Frame Link</Label>
                <Input
                  id="frame-link"
                  type="text"
                  placeholder="Enter frame link..."
                  value={frameLink}
                  onChange={(e) => setFrameLink(e.target.value)}
                  disabled={!isEditable}
                  className="mt-1"
                />
              </div>

              {/* Concept Card Properties */}
              {card.card_type === 'concept' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="video-type">Video Type</Label>
                      <Select 
                        value={videoType} 
                        onValueChange={(v) => setVideoType(v as VideoType)}
                        disabled={!isEditable}
                      >
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
                      <Select 
                        value={formatType} 
                        onValueChange={(v) => setFormatType(v as FormatType)}
                        disabled={!isEditable}
                      >
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

                  <div>
                    <Label htmlFor="example-video">Example Video URL</Label>
                    <Input
                      id="example-video"
                      type="text"
                      placeholder="Enter video URL..."
                      value={exampleVideoUrl}
                      onChange={(e) => setExampleVideoUrl(e.target.value)}
                      disabled={!isEditable}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {isCreatorCard && (
                <div className="space-y-3">
                  <h3 className="font-medium">Linked Resources</h3>
                  
                  {card.briefing_id && (
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => router.push(`/dashboard/briefings/${card.briefing_id}`)}
                    >
                      <span>View Original Briefing</span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {contentLink && (
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => window.open(contentLink, '_blank')}
                    >
                      <span>View Creator Content</span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {isEditable ? (
                <EditorWithPlaceholders
                  content={content}
                  onChange={setContent}
                  globalPlaceholders={placeholders}
                  previewContent={processedContent}
                  showPreview={true}
                  placeholderFilterType="creative_agenda"
                />
              ) : (
                <div>
                  <Label>Content</Label>
                  <div className="mt-1 border rounded-md">
                    <BriefingEditor
                      content={processedContent}
                      onChange={() => {}}
                      editable={false}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>
                Discussion and feedback for this card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommentsSection
                comments={comments.map(c => ({
                  ...c,
                  briefing_id: c.card_id
                } as any))}
                onAddComment={handleAddComment}
                currentUserRole="social_bubble"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
              <CardDescription>
                Track status changes and transitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Status history coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}