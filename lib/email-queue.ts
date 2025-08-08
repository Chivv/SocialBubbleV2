/**
 * Email queue helper for rate-limited background email sending
 * This allows server actions to return immediately while emails are sent in the background
 */

type EmailTask = {
  id: string;
  sendFn: () => Promise<any>;
  recipient: string;
};

class EmailQueue {
  private queue: EmailTask[] = [];
  private isProcessing = false;
  private readonly delayMs = 500; // 2 emails per second for Resend rate limit

  add(task: EmailTask) {
    this.queue.push(task);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) continue;

      try {
        await task.sendFn();
        console.log(`Email sent successfully to ${task.recipient}`);
      } catch (error) {
        console.error(`Failed to send email to ${task.recipient}:`, error);
        // Could implement retry logic here if needed
      }

      // Wait before processing next email (if any)
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayMs));
      }
    }

    this.isProcessing = false;
  }
}

// Singleton instance
export const emailQueue = new EmailQueue();

/**
 * Helper function to queue multiple emails without blocking
 * Returns immediately while emails are sent in the background
 */
export function queueEmails(emails: Array<{
  recipient: string;
  sendFn: () => Promise<any>;
}>) {
  emails.forEach((email, index) => {
    emailQueue.add({
      id: `${Date.now()}-${index}`,
      recipient: email.recipient,
      sendFn: email.sendFn,
    });
  });
}