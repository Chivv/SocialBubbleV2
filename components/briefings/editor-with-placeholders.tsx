'use client';

import { useState, useRef, useEffect } from 'react';
import BriefingEditor from '@/components/briefings/editor';
import { PlaceholderHelper } from '@/components/briefings/placeholder-helper';
import { GlobalPlaceholder } from '@/types';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, Edit as EditIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

interface EditorWithPlaceholdersProps {
  content: any;
  onChange: (content: any) => void;
  globalPlaceholders: GlobalPlaceholder[];
  previewContent?: any;
  showPreview?: boolean;
  placeholderFilterType?: 'briefing' | 'creative_strategy' | 'creative_agenda' | 'all';
}

export function EditorWithPlaceholders({
  content,
  onChange,
  globalPlaceholders,
  previewContent,
  showPreview = true,
  placeholderFilterType = 'all',
}: EditorWithPlaceholdersProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const editorRef = useRef<any>(null);

  const handleInsertContent = (placeholderContent: any) => {
    if (!content) return;
    
    // Validate placeholder content exists and is not empty
    if (!placeholderContent || 
        (typeof placeholderContent === 'object' && 
         (!placeholderContent.content || 
          (Array.isArray(placeholderContent.content) && placeholderContent.content.length === 0)))) {
      console.warn('Invalid or empty placeholder content:', placeholderContent);
      return;
    }

    // Deep clone the current content
    const newContent = JSON.parse(JSON.stringify(content));
    
    // Ensure newContent has proper structure
    if (!newContent.type || newContent.type !== 'doc') {
      newContent.type = 'doc';
      newContent.content = newContent.content || [];
    }
    
    // Handle different types of placeholder content
    if (typeof placeholderContent === 'string' && placeholderContent.trim()) {
      // If it's a non-empty string, create a text node
      if (newContent.content.length > 0) {
        const lastNode = newContent.content[newContent.content.length - 1];
        if (lastNode?.type === 'paragraph' && Array.isArray(lastNode.content)) {
          // Add to the last paragraph if it exists
          lastNode.content.push({ type: 'text', text: placeholderContent });
        } else {
          // Create a new paragraph with the text
          newContent.content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: placeholderContent }]
          });
        }
      } else {
        // Create first paragraph with the text
        newContent.content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: placeholderContent }]
        });
      }
    } else if (placeholderContent.type === 'doc' && Array.isArray(placeholderContent.content) && placeholderContent.content.length > 0) {
      // Validate all nodes in the content
      const validNodes = placeholderContent.content.filter((node: any) => {
        if (!node || typeof node !== 'object' || !node.type) return false;
        
        // If it's a text node, ensure it has valid text
        if (node.type === 'text' && (node.text === undefined || node.text === null)) {
          return false;
        }
        
        // If it has content array, validate recursively
        if (Array.isArray(node.content)) {
          node.content = node.content.filter((childNode: any) => {
            if (!childNode || typeof childNode !== 'object' || !childNode.type) return false;
            if (childNode.type === 'text' && (childNode.text === undefined || childNode.text === null)) {
              return false;
            }
            return true;
          });
        }
        
        return true;
      });
      
      if (validNodes.length === 0) {
        console.warn('No valid content nodes found in placeholder:', placeholderContent);
        return;
      }
      
      // Add an empty paragraph as separator if content is not empty
      if (newContent.content.length > 0) {
        // Check if the last element is already an empty paragraph
        const lastNode = newContent.content[newContent.content.length - 1];
        const isLastNodeEmpty = lastNode?.type === 'paragraph' && 
          (!lastNode.content || lastNode.content.length === 0);
        
        // Only add separator if last node is not empty
        if (!isLastNodeEmpty) {
          newContent.content.push({
            type: 'paragraph',
            content: []
          });
        }
      }
      
      // Append the validated content
      newContent.content.push(...validNodes);
    } else {
      // For any other format, log and return
      console.warn('Unexpected or invalid placeholder content format:', placeholderContent);
      return;
    }
    
    // Add an empty paragraph at the end for continued editing
    newContent.content.push({
      type: 'paragraph',
      content: []
    });
    
    onChange(newContent);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Content</Label>
        <div className="flex items-center gap-2">
          <PlaceholderHelper 
            globalPlaceholders={globalPlaceholders}
            onInsertContent={handleInsertContent}
            filterType={placeholderFilterType}
          />
          {showPreview && (
            <>
              <Button
                type="button"
                variant={previewMode ? 'outline' : 'default'}
                size="sm"
                onClick={() => setPreviewMode(false)}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                type="button"
                variant={previewMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </>
          )}
        </div>
      </div>
      
      {previewMode && showPreview ? (
        <Card>
          <CardHeader>
            <CardDescription>
              This is how the briefing will appear with placeholders replaced.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BriefingEditor 
              content={previewContent || content} 
              onChange={() => {}} 
              editable={false} 
            />
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Edit the content. Client placeholders like {'{{client_brandname}}'} will be replaced automatically when viewed.
          </p>
          <BriefingEditor 
            ref={editorRef}
            content={content} 
            onChange={onChange} 
          />
        </div>
      )}
    </div>
  );
}