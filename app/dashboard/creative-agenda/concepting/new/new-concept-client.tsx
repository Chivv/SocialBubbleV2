'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import BriefingEditor from '@/components/briefings/editor';
import { createConceptCard } from '@/app/actions/creative-agenda';
import { format } from 'date-fns';
import { CalendarIcon, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FormatType, VideoType } from '@/types';

interface NewConceptClientProps {
  clients: Array<{ id: string; company_name: string }>;
}

const formatOptions: { value: FormatType; label: string }[] = [
  { value: '4:5', label: '4:5 (Portrait)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '9:16', label: '9:16 (Story)' },
  { value: '9:16_safe', label: '9:16 with Safe Zones' },
  { value: '6:4', label: '6:4 (Landscape)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
];

export function NewConceptClient({ clients }: NewConceptClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [deadline, setDeadline] = useState<Date>();
  const [content, setContent] = useState({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  const [frameLink, setFrameLink] = useState('');
  const [exampleVideoUrl, setExampleVideoUrl] = useState('');
  const [videoType, setVideoType] = useState<VideoType | ''>('');
  const [formatType, setFormatType] = useState<FormatType | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !clientId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const result = await createConceptCard({
        title,
        client_id: clientId,
        content: JSON.stringify(content), // Send as string to preserve all properties (same as briefings)
        deadline: deadline?.toISOString(),
        properties: {
          frame_link: frameLink || undefined,
          example_video_url: exampleVideoUrl || undefined,
          video_type: videoType || undefined,
          format: formatType || undefined,
        },
      });

      if (result.success) {
        toast.success('Concept card created successfully');
        router.push('/dashboard/creative-agenda/concepting');
      } else {
        toast.error(result.error || 'Failed to create concept card');
      }
    } catch (error) {
      toast.error('Failed to create concept card');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/creative-agenda/concepting')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">New Concept Card</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Concept Details</CardTitle>
          <CardDescription>
            Create a new concept card for the concepting department
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter concept title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="deadline"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
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

          <div className="space-y-2">
            <Label>Content</Label>
            <div className="border rounded-md">
              <BriefingEditor
                content={content}
                onChange={setContent}
                editable={true}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Concept Properties</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frame-link">Frame Link</Label>
                <Input
                  id="frame-link"
                  type="url"
                  value={frameLink}
                  onChange={(e) => setFrameLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="example-video">Example Video URL</Label>
                <Input
                  id="example-video"
                  type="url"
                  value={exampleVideoUrl}
                  onChange={(e) => setExampleVideoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="video-type">Video Type</Label>
                <Select value={videoType} onValueChange={(v) => setVideoType(v as VideoType)}>
                  <SelectTrigger id="video-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={formatType} onValueChange={(v) => setFormatType(v as FormatType)}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/creative-agenda/concepting')}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Creating...' : 'Create Concept Card'}
        </Button>
      </div>
    </div>
  );
}