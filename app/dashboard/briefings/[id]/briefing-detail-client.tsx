'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefing, GlobalPlaceholder, BriefingComment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BriefingEditor from '@/components/briefings/editor';
import { ArrowLeft, Edit, Building2, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { StatusBadge } from '@/components/briefings/status-badge';
import { replacePlaceholders } from '@/lib/placeholders/replacer';
import { getGlobalPlaceholders } from '@/app/actions/placeholders';
import { addBriefingComment } from '@/app/actions/briefings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentsSection } from '@/components/briefings/comments-section';

interface BriefingDetailClientProps {
  briefing: Briefing;
  comments: BriefingComment[];
  currentUserId: string;
}

export default function BriefingDetailClient({ briefing, comments, currentUserId }: BriefingDetailClientProps) {
  const { role } = useUserRole();
  const router = useRouter();
  const [globalPlaceholders, setGlobalPlaceholders] = useState<GlobalPlaceholder[]>([]);
  const [processedContent, setProcessedContent] = useState(briefing.content);

  useEffect(() => {
    async function loadPlaceholders() {
      const placeholders = await getGlobalPlaceholders();
      setGlobalPlaceholders(placeholders);
    }
    loadPlaceholders();
  }, []);

  useEffect(() => {
    if (briefing.client && globalPlaceholders.length > 0) {
      const replaced = replacePlaceholders(briefing.content, {
        client: briefing.client,
        globalPlaceholders,
      });
      setProcessedContent(replaced);
    }
  }, [briefing, globalPlaceholders]);

  const handleAddComment = async (content: string) => {
    const result = await addBriefingComment(briefing.id, content);
    if (result.success) {
      router.refresh();
    }
    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/briefings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{briefing.title}</h1>
        </div>
        {role === 'social_bubble' && (
          <Link href={`/dashboard/briefings/${briefing.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Briefing Content</TabsTrigger>
          <TabsTrigger value="feedback">
            Feedback & Comments
            {comments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {comments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <CardTitle>Briefing Details</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span>{briefing.client?.company_name || 'Unknown Client'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(briefing.created_at), 'PPP')}</span>
                      </div>
                    </div>
                  </CardDescription>
                </div>
                <StatusBadge status={briefing.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <BriefingEditor content={processedContent} onChange={() => {}} editable={false} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <CommentsSection
            comments={comments}
            onAddComment={handleAddComment}
            currentUserRole={(role === 'creator' ? 'social_bubble' : role) || 'social_bubble'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}