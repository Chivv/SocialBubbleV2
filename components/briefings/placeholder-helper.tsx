'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { GlobalPlaceholder } from '@/types';

interface PlaceholderInfo {
  key: string;
  label: string;
  description: string;
  category: 'client' | 'global';
}

const placeholders: PlaceholderInfo[] = [
  // Client placeholders (available everywhere)
  {
    key: '{{client_brandname}}',
    label: 'Client Brand Name',
    description: 'The company name of the selected client',
    category: 'client',
  },
  {
    key: '{{client_domain}}',
    label: 'Client Domain',
    description: 'The website domain extracted from client\'s website URL',
    category: 'client',
  },
  // Briefing-specific placeholders
  {
    key: '{{briefing_client_overview}}',
    label: 'Briefing Client Overview',
    description: 'Custom briefing overview content specific to this client',
    category: 'client',
  },
  {
    key: '{{briefing_intro}}',
    label: 'Briefing Introduction',
    description: 'Standard introduction section for all briefings',
    category: 'global',
  },
  {
    key: '{{briefing_video_instructions}}',
    label: 'Video Instructions',
    description: 'Guidelines for creating video content',
    category: 'global',
  },
  {
    key: '{{briefing_expectations}}',
    label: 'Expectations',
    description: 'What we expect from content creators',
    category: 'global',
  },
  {
    key: '{{briefing_scripts}}',
    label: 'Content Scripts',
    description: 'Script templates and examples for content creation',
    category: 'global',
  },
  {
    key: '{{briefing_lifestyle_photos}}',
    label: 'Lifestyle Photos',
    description: 'Guidelines for lifestyle photography',
    category: 'global',
  },
  // Creative Strategy placeholders
  {
    key: '{{creative_strategy_template}}',
    label: 'Creative Strategy Template',
    description: 'Default template for all creative strategies',
    category: 'global',
  },
  // Creative Agenda placeholders
  {
    key: '{{creative_agenda_default_concept}}',
    label: 'Creative Agenda Default Concept',
    description: 'Default template for creative agenda concepts',
    category: 'global',
  },
];

interface PlaceholderHelperProps {
  globalPlaceholders?: GlobalPlaceholder[];
  onInsertContent?: (content: any) => void;
  filterType?: 'briefing' | 'creative_strategy' | 'creative_agenda' | 'all';
}

export function PlaceholderHelper({ globalPlaceholders, onInsertContent, filterType = 'all' }: PlaceholderHelperProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleGlobalPlaceholderClick = (placeholderKey: string) => {
    // Extract the key without the curly braces
    const key = placeholderKey.replace(/{{|}}/g, '');
    
    // Check if this is a global placeholder from our static list
    const staticPlaceholder = placeholders.find(p => p.key === placeholderKey);
    const isGlobalPlaceholder = staticPlaceholder?.category === 'global';
    
    // For global placeholders, try to insert content if available
    if (isGlobalPlaceholder && onInsertContent && globalPlaceholders) {
      // Find the global placeholder content from the database
      const placeholder = globalPlaceholders.find(p => p.key === key);
      
      if (placeholder && placeholder.content) {
        // Insert the actual content instead of the placeholder
        onInsertContent(placeholder.content);
        toast.success('Content inserted!');
        return;
      }
    }
    
    // For client placeholders or when content is not available, copy to clipboard
    copyToClipboard(placeholderKey);
  };

  // Filter placeholders based on type
  let filteredPlaceholders = placeholders;
  
  if (filterType === 'briefing') {
    // Show client_brandname, client_domain, and all briefing_ placeholders
    filteredPlaceholders = placeholders.filter(p => 
      p.key.includes('{{client_brandname}}') || 
      p.key.includes('{{client_domain}}') || 
      p.key.includes('{{briefing_')
    );
  } else if (filterType === 'creative_strategy') {
    // Show client_brandname, client_domain, and all creative_strategy_ placeholders
    filteredPlaceholders = placeholders.filter(p => 
      p.key.includes('{{client_brandname}}') || 
      p.key.includes('{{client_domain}}') || 
      p.key.includes('{{creative_strategy_')
    );
  } else if (filterType === 'creative_agenda') {
    // Show client_brandname, client_domain, and creative_agenda_default_concept
    filteredPlaceholders = placeholders.filter(p => 
      p.key.includes('{{client_brandname}}') || 
      p.key.includes('{{client_domain}}') || 
      p.key === '{{creative_agenda_default_concept}}'
    );
  }
  
  const clientPlaceholdersList = filteredPlaceholders.filter(p => p.category === 'client');
  const globalPlaceholdersList = filteredPlaceholders.filter(p => p.category === 'global');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="h-4 w-4 mr-2" />
          Placeholders
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px]" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Available Placeholders</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Click any placeholder to copy it to your clipboard. These will be automatically replaced when viewing the briefing.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium mb-2 text-muted-foreground">Client Placeholders</h5>
              <div className="space-y-2">
                {clientPlaceholdersList.map((placeholder) => (
                  <div
                    key={placeholder.key}
                    className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      // For client placeholders, we still copy to clipboard as they need context
                      copyToClipboard(placeholder.key);
                    }}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {placeholder.key}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {placeholder.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(placeholder.key);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium mb-2 text-muted-foreground">Global Placeholders</h5>
              <div className="space-y-2">
                {globalPlaceholdersList.map((placeholder) => (
                  <div
                    key={placeholder.key}
                    className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleGlobalPlaceholderClick(placeholder.key)}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {placeholder.key}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {placeholder.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGlobalPlaceholderClick(placeholder.key);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t space-y-1">
            <p className="text-xs text-muted-foreground">
              <strong>Client placeholders:</strong> Will be copied to clipboard for pasting
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Global placeholders:</strong> Will insert the actual content directly into the editor
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}