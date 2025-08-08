'use server';

import { createServiceClient } from '@/lib/supabase/service';

export async function setupDefaultBriefingTemplate() {
  try {
    const supabase = createServiceClient();
    
    // Default template content with placeholders
    const defaultTemplateContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{briefing_intro}}' }]
        },
        {
          type: 'paragraph',
          content: []
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{video_instructions}}' }]
        },
        {
          type: 'paragraph',
          content: []
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{expectations}}' }]
        },
        {
          type: 'paragraph',
          content: []
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{scripts}}' }]
        },
        {
          type: 'paragraph',
          content: []
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{lifestyle_photos}}' }]
        }
      ]
    };
    
    // Check if default template exists
    const { data: existingTemplate } = await supabase
      .from('briefing_templates')
      .select('id')
      .eq('is_default', true)
      .single();
      
    if (existingTemplate) {
      // Update existing default template
      const { error } = await supabase
        .from('briefing_templates')
        .update({
          name: 'Default Briefing Template',
          content: defaultTemplateContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTemplate.id);
        
      if (error) throw error;
      
      return { success: true, message: 'Default template updated successfully' };
    } else {
      // Create new default template
      const { error } = await supabase
        .from('briefing_templates')
        .insert({
          name: 'Default Briefing Template',
          content: defaultTemplateContent,
          is_default: true
        });
        
      if (error) throw error;
      
      return { success: true, message: 'Default template created successfully' };
    }
  } catch (error) {
    console.error('Error setting up default template:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}