'use server';

import { createServiceClient } from '@/lib/supabase/service';

export async function cleanupMisplacedGlobalPlaceholders() {
  try {
    const supabase = createServiceClient();
    
    // List of keys that should ONLY be client placeholders
    const clientOnlyKeys = [
      'briefing_client_overview',
      'briefing_client_brandname', 
      'briefing_client_domain'
    ];
    
    // Delete any global placeholders that have client-only keys
    const { data: deleted, error } = await supabase
      .from('global_placeholders')
      .delete()
      .in('key', clientOnlyKeys)
      .select();
      
    if (error) {
      console.error('Error cleaning up placeholders:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      deletedCount: deleted?.length || 0,
      deletedPlaceholders: deleted || []
    };
  } catch (error) {
    console.error('Error in cleanup:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function listAllGlobalPlaceholders() {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('global_placeholders')
      .select('*')
      .order('key');
      
    if (error) {
      console.error('Error listing placeholders:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, placeholders: data || [] };
  } catch (error) {
    console.error('Error in listing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}