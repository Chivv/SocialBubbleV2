'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { CreatorInvoice, InvoiceStatus } from '@/types';

// Generate signed URL for invoice PDF
export async function getInvoiceSignedUrl(path: string) {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getInvoiceSignedUrl:', error);
    return null;
  }
}

// Upload invoice PDF to storage
export async function uploadInvoicePDF(file: File) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();

    // Create unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const path = `${user.id}/${filename}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(path, file);

    if (error) {
      console.error('Storage error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Return the path instead of public URL since bucket is private
    return { success: true, url: path };
  } catch (error) {
    console.error('Error uploading invoice PDF:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload file' 
    };
  }
}

// Create a new invoice
export async function createInvoice(data: {
  creator_submission_id: string;
  invoice_pdf_url: string;
  full_name: string;
  iban: string;
  payment_reference: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();

    // Get creator ID
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single();

    if (!creator) {
      throw new Error('Creator not found');
    }

    // Get submission details to verify it's approved and get casting info
    const { data: submission } = await supabase
      .from('creator_submissions')
      .select(`
        *,
        casting:castings(
          id,
          compensation
        )
      `)
      .eq('id', data.creator_submission_id)
      .eq('creator_id', creator.id)
      .eq('submission_status', 'approved')
      .single();

    if (!submission) {
      throw new Error('Approved submission not found');
    }

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('creator_invoices')
      .insert({
        creator_submission_id: data.creator_submission_id,
        creator_id: creator.id,
        casting_id: submission.casting_id,
        deal_amount: submission.casting.compensation,
        invoice_pdf_url: data.invoice_pdf_url,
        full_name: data.full_name,
        iban: data.iban,
        payment_reference: data.payment_reference
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    revalidatePath('/dashboard/creator/invoices');
    revalidatePath('/dashboard/creator/briefings');
    
    return { success: true, invoice };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create invoice' 
    };
  }
}

// Get invoices for the logged-in creator
export async function getCreatorInvoices() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();

    // Get creator ID
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single();

    if (!creator) {
      return [];
    }

    const { data: invoices, error } = await supabase
      .from('creator_invoices')
      .select(`
        *,
        casting:castings(
          id,
          title,
          client:clients(id, company_name)
        ),
        submission:creator_submissions(*)
      `)
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    return invoices as CreatorInvoice[];
  } catch (error) {
    console.error('Error in getCreatorInvoices:', error);
    return [];
  }
}

// Get all invoices (Social Bubble only)
export async function getAllInvoices() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();

    // Check if user has social_bubble role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'social_bubble') {
      throw new Error('Unauthorized');
    }

    const { data: invoices, error } = await supabase
      .from('creator_invoices')
      .select(`
        *,
        creator:creators(*),
        casting:castings(
          id,
          title,
          client:clients(id, company_name)
        ),
        submission:creator_submissions(*)
      `)
      .order('payment_deadline', { ascending: true });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    return invoices as CreatorInvoice[];
  } catch (error) {
    console.error('Error in getAllInvoices:', error);
    return [];
  }
}

// Update invoice status (Social Bubble only)
export async function updateInvoiceStatus(
  invoiceId: string, 
  status: InvoiceStatus
) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();

    // Check if user has social_bubble role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'social_bubble') {
      throw new Error('Unauthorized');
    }

    const updateData: any = { status };

    // If marking as paid, set paid_at and paid_by
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
      updateData.paid_by = user.id;
    }

    const { data: invoice, error } = await supabase
      .from('creator_invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update invoice: ${error.message}`);
    }

    revalidatePath('/dashboard/invoices');
    
    return { success: true, invoice };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update invoice' 
    };
  }
}

// Get approved submissions without invoices for creator
export async function getApprovedSubmissionsWithoutInvoice() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const supabase = createServiceClient();

    // Get creator ID
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single();

    if (!creator) {
      return [];
    }

    // Get approved submissions that don't have invoices
    const { data: submissions, error } = await supabase
      .from('creator_submissions')
      .select(`
        *,
        casting:castings(
          id,
          title,
          compensation,
          client:clients(id, company_name)
        )
      `)
      .eq('creator_id', creator.id)
      .eq('submission_status', 'approved')
      .order('approved_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }

    // Filter out submissions that already have invoices
    const { data: existingInvoices } = await supabase
      .from('creator_invoices')
      .select('creator_submission_id')
      .eq('creator_id', creator.id);

    const invoicedSubmissionIds = existingInvoices?.map(inv => inv.creator_submission_id) || [];
    
    const availableSubmissions = submissions?.filter(
      sub => !invoicedSubmissionIds.includes(sub.id)
    ) || [];

    return availableSubmissions;
  } catch (error) {
    console.error('Error in getApprovedSubmissionsWithoutInvoice:', error);
    return [];
  }
}