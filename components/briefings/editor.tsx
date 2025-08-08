'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Undo,
  Redo,
  List,
  ListOrdered,
  Quote,
  Code,
  Plus,
  Trash2,
  TableProperties,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useRef, forwardRef, useMemo, useEffect } from 'react';
import React from 'react';

interface EditorProps {
  content: any;
  onChange: (content: any) => void;
  editable?: boolean;
}

const BriefingEditor = forwardRef<any, EditorProps>(({ content, onChange, editable = true }, ref) => {
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialog, setImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeDialog, setYoutubeDialog] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and normalize content
  const normalizedContent = useMemo(() => {
    if (!content) {
      return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [] }]
      };
    }
    
    // If content is a string, create a proper doc structure
    if (typeof content === 'string') {
      return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }]
      };
    }
    
    // Ensure content has proper structure
    if (content && typeof content === 'object') {
      // Validate doc structure
      if (!content.type || content.type !== 'doc') {
        return {
          type: 'doc',
          content: Array.isArray(content.content) ? content.content : [{ type: 'paragraph', content: [] }]
        };
      }
      
      // Validate content array
      if (!Array.isArray(content.content)) {
        return {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }]
        };
      }
      
      // Validate each node in content
      const validatedContent = content.content.map((node: any) => {
        // Basic validation - ensure node has a type
        if (!node || typeof node !== 'object' || !node.type) {
          return null;
        }
        
        // Don't modify heading nodes - let TipTap handle them
        if (node.type === 'heading') {
          return node;
        }
        
        return node;
      }).filter(Boolean);
      
      // If all content was filtered out, add an empty paragraph
      if (validatedContent.length === 0) {
        validatedContent.push({ type: 'paragraph', content: [] });
      }
      
      return {
        type: 'doc',
        content: validatedContent
      };
    }
    
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }]
    };
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions from StarterKit that we're adding separately
        link: false,
        underline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Underline,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 480,
        HTMLAttributes: {
          class: 'rounded-lg overflow-hidden',
        },
      }),
    ],
    content: normalizedContent,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  // Expose editor instance through ref
  React.useImperativeHandle(ref, () => editor, [editor]);


  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && normalizedContent) {
      try {
        const currentContent = editor.getJSON();
        // Only update if content is actually different to avoid infinite loops
        if (JSON.stringify(currentContent) !== JSON.stringify(normalizedContent)) {
          editor.commands.setContent(normalizedContent);
        }
      } catch (error) {
        console.error('Error updating editor content:', error);
        // If there's an error, try to set a default content
        editor.commands.setContent({
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }]
        });
      }
    }
  }, [editor, normalizedContent]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkDialog(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageDialog(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/briefing-media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      
      // Insert the uploaded image into the editor
      editor.chain().focus().setImage({ src: url }).run();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setImageDialog(false);
    }
  };

  const addYoutube = () => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
      setYoutubeDialog(false);
    }
  };

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0',
        active && 'bg-gray-200 dark:bg-gray-700'
      )}
    >
      {children}
    </Button>
  );

  if (!editable) {
    return (
      <div className="prose prose-sm max-w-none w-full dark:prose-invert">
        <EditorContent editor={editor} className="w-full" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b p-2 flex flex-wrap items-center gap-1 shadow-sm">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton onClick={() => setLinkDialog(true)}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {editor.isActive('table') ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <TableProperties className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addColumnBefore().run()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Column Before
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Column After
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteColumn().run()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Column
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addRowBefore().run()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row Before
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row After
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteRow().run()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Row
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
        )}
        <ToolbarButton onClick={() => setImageDialog(true)}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => setYoutubeDialog(true)}>
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div className="p-4 min-h-[400px] prose prose-sm max-w-none w-full dark:prose-invert focus:outline-none [&_.ProseMirror]:outline-none">
        <EditorContent editor={editor} className="w-full" />
      </div>

      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addLink}>Add Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Upload from device</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
              />
              {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addImage();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addImage} disabled={!imageUrl || uploading}>
              Add from URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={youtubeDialog} onOpenChange={setYoutubeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add YouTube Video</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addYoutube();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYoutubeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addYoutube}>Add Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

BriefingEditor.displayName = 'BriefingEditor';

export default BriefingEditor;