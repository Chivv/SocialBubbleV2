'use client';

import { useState } from 'react';
import { GlobalPlaceholder } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, Eye, Edit as EditIcon } from 'lucide-react';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import BriefingEditor from '@/components/briefings/editor';
import { updateGlobalPlaceholder } from '@/app/actions/placeholders';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlaceholdersClientProps {
  initialPlaceholders: GlobalPlaceholder[];
}

export default function PlaceholdersClient({ initialPlaceholders }: PlaceholdersClientProps) {
  const { role, loading: roleLoading } = useUserRole();
  const [placeholders] = useState<GlobalPlaceholder[]>(initialPlaceholders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleEdit = (placeholder: GlobalPlaceholder) => {
    setEditingId(placeholder.id);
    setEditingContent(placeholder.content);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingContent(null);
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const result = await updateGlobalPlaceholder(id, JSON.stringify(editingContent));
      
      if (result.success) {
        toast.success('Placeholder updated successfully');
        setEditingId(null);
        setEditingContent(null);
        // In a real app, we'd refresh the data here
        window.location.reload();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating placeholder:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update placeholder');
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  if (role !== 'social_bubble') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Global Placeholders</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only Social Bubble team members can manage global placeholders.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Global Placeholders</h1>
        <p className="text-muted-foreground mt-2">
          Manage reusable content blocks that can be used in briefing templates. These placeholders can contain nested placeholders like {'{{briefing_client_brandname}}'}.
        </p>
      </div>

      <div className="grid gap-6">
        {placeholders.map((placeholder) => (
          <Card key={placeholder.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {placeholder.name}
                    <Badge variant="secondary" className="font-mono text-xs">
                      {`{{${placeholder.key}}}`}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Use this placeholder in templates by typing {`{{${placeholder.key}}}`}
                  </CardDescription>
                </div>
                {editingId !== placeholder.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(placeholder)}
                  >
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingId === placeholder.id ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      You can use client placeholders like {'{{briefing_client_brandname}}'} within this content.
                    </p>
                    <BriefingEditor 
                      content={editingContent} 
                      onChange={setEditingContent} 
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSave(placeholder.id)}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <BriefingEditor 
                    content={placeholder.content} 
                    onChange={() => {}} 
                    editable={false} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Available Placeholders</CardTitle>
          <CardDescription>
            You can use these placeholders within any global placeholder content:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {'{{briefing_client_brandname}}'}
              </Badge>
              <span className="text-sm text-muted-foreground">Client&apos;s company name</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {'{{briefing_client_domain}}'}
              </Badge>
              <span className="text-sm text-muted-foreground">Client&apos;s website domain</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {'{{briefing_client_overview}}'}
              </Badge>
              <span className="text-sm text-muted-foreground">Client-specific briefing overview</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}