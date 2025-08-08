import { Client, GlobalPlaceholder } from '@/types';

interface PlaceholderContext {
  client: Client | null;
  globalPlaceholders: GlobalPlaceholder[];
  creativeAgendaPlaceholders?: GlobalPlaceholder[]; // Optional creative agenda specific placeholders
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Get client-specific placeholder value
 */
function getClientPlaceholderValue(key: string, client: Client | null): any {
  if (!client) return null;

  switch (key) {
    case 'briefing_client_overview':
      return client.briefing_client_overview || { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No overview available' }] }] };
    case 'client_brandname':
    case 'briefing_client_brandname': // Support old format for backward compatibility
      return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: client.company_name }] }] };
    case 'client_domain':
    case 'briefing_client_domain': // Support old format for backward compatibility
      const domain = extractDomain(client.website);
      return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: domain }] }] };
    default:
      return null;
  }
}

/**
 * Get global placeholder value
 */
function getGlobalPlaceholderValue(key: string, globalPlaceholders: GlobalPlaceholder[]): any {
  const placeholder = globalPlaceholders.find(p => p.key === key);
  return placeholder?.content || null;
}

/**
 * Get creative agenda placeholder value
 */
function getCreativeAgendaPlaceholderValue(key: string, context: PlaceholderContext): any {
  // First check if it's a creative_agenda prefixed placeholder
  if (key.startsWith('creative_agenda_') && context.creativeAgendaPlaceholders) {
    const placeholder = context.creativeAgendaPlaceholders.find(p => p.key === key);
    if (placeholder) return placeholder.content;
  }
  
  // If not found or not prefixed, check global placeholders
  return getGlobalPlaceholderValue(key, context.globalPlaceholders);
}

/**
 * Replace placeholders in text content
 */
function replaceTextPlaceholders(text: string, context: PlaceholderContext): string {
  if (!text.includes('{{')) return text;

  let modifiedText = text;
  
  // Replace client placeholders - simple text replacement
  const clientPlaceholders = [
    'client_brandname', 'client_domain', 
    'briefing_client_brandname', 'briefing_client_domain', 'briefing_client_overview'
  ];
  clientPlaceholders.forEach(key => {
    const placeholder = `{{${key}}}`;
    if (modifiedText.includes(placeholder)) {
      const value = getClientPlaceholderValue(key, context.client);
      if (value && value.content?.[0]?.content?.[0]?.text) {
        const replacementText = value.content[0].content[0].text;
        modifiedText = modifiedText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacementText);
      }
    }
  });

  return modifiedText;
}

/**
 * Deep clone an object
 */
function deepClone(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Replace placeholders in Tiptap content recursively
 */
export function replacePlaceholders(content: any, context: PlaceholderContext): any {
  if (!content) return content;

  // Clone to avoid mutating original
  const clonedContent = deepClone(content);

  // Process the content recursively
  function processNode(node: any): any {
    if (!node) return node;

    // If it's a text node, replace placeholders in text
    if (node.type === 'text' && node.text) {
      node.text = replaceTextPlaceholders(node.text, context);
      return node;
    }

    // If it's a paragraph with just a placeholder, replace the entire paragraph
    if (node.type === 'paragraph' && node.content?.length === 1 && node.content[0].type === 'text') {
      const text = node.content[0].text;
      const placeholderMatch = text.match(/^{{(\w+)}}$/);
      
      if (placeholderMatch) {
        const key = placeholderMatch[1];
        
        // Check client placeholders first
        const clientValue = getClientPlaceholderValue(key, context.client);
        if (clientValue && clientValue.type === 'doc' && clientValue.content) {
          // Replace with the content from the placeholder (could be multiple nodes)
          return clientValue.content;
        }
        
        // Check global placeholders (or creative agenda placeholders)
        const placeholderValue = context.creativeAgendaPlaceholders 
          ? getCreativeAgendaPlaceholderValue(key, context)
          : getGlobalPlaceholderValue(key, context.globalPlaceholders);
          
        if (placeholderValue && placeholderValue.type === 'doc' && placeholderValue.content) {
          // Recursively process placeholder content for nested placeholders
          return placeholderValue.content.map((n: any) => processNode(n));
        }
      }
    }

    // Process children
    if (node.content && Array.isArray(node.content)) {
      const processedContent: any[] = [];
      
      node.content.forEach((child: any) => {
        const processed = processNode(child);
        // If the result is an array (from placeholder replacement), flatten it
        if (Array.isArray(processed)) {
          processedContent.push(...processed);
        } else {
          processedContent.push(processed);
        }
      });
      
      node.content = processedContent;
    }

    return node;
  }

  // Process the entire document
  if (clonedContent.content && Array.isArray(clonedContent.content)) {
    const processedContent: any[] = [];
    
    clonedContent.content.forEach((node: any) => {
      const processed = processNode(node);
      // If the result is an array (from placeholder replacement), flatten it
      if (Array.isArray(processed)) {
        processedContent.push(...processed);
      } else {
        processedContent.push(processed);
      }
    });
    
    clonedContent.content = processedContent;
  }

  return clonedContent;
}

/**
 * Get list of all placeholders in content
 */
export function getPlaceholdersInContent(content: any): string[] {
  const placeholders = new Set<string>();

  function extractFromText(text: string) {
    const matches = text.matchAll(/{{(\w+)}}/g);
    for (const match of matches) {
      placeholders.add(match[1]);
    }
  }

  function processNode(node: any) {
    if (!node) return;

    if (node.type === 'text' && node.text) {
      extractFromText(node.text);
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(processNode);
    }
  }

  if (content?.content && Array.isArray(content.content)) {
    content.content.forEach(processNode);
  }

  return Array.from(placeholders);
}

/**
 * Check if content has placeholders
 */
export function hasPlaceholders(content: any): boolean {
  return getPlaceholdersInContent(content).length > 0;
}