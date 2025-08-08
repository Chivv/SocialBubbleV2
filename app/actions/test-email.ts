'use server';

import { currentUser } from '@clerk/nextjs/server';
import { sendTestEmail as sendResendTestEmail } from '@/lib/resend';

export async function testEmailDelivery(email: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Sending test email to:', email);
    
    // Send test email directly (not through queue) for immediate feedback
    const result = await sendResendTestEmail(email);
    
    console.log('Email send result:', result);
    
    if (result.error) {
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
        details: result.error,
      };
    }
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Test email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email',
      details: error,
    };
  }
}