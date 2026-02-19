import { db } from '../../../shared/db/index.js';
import { emailQueue, emailTemplates } from '../../../shared/db/schema.js';
import { eq, and, lt } from 'drizzle-orm';

// Placeholder for actual email sending logic (e.g., nodemailer)
const sendActualEmail = async ({ to, subject, html }) => {
    console.log(`[Email Sent] To: ${to}, Subject: ${subject}`);
    // In production, use nodemailer or a service like SendGrid
    return true;
};

export const processEmailQueue = async () => {
    const pending = await db.select()
        .from(emailQueue)
        .where(and(
            eq(emailQueue.status, 'PENDING'),
            lt(emailQueue.retryCount, 3)
        ))
        .limit(50);

    for (const email of pending) {
        try {
            let html = email.bodyHtml;

            // If templateId provided, we would render it here
            // For now, assume bodyHtml is populated or use data

            const success = await sendActualEmail({
                to: email.toEmail,
                subject: email.subject,
                html: html
            });

            if (success) {
                await db.update(emailQueue)
                    .set({ status: 'SENT', sentAt: new Date() })
                    .where(eq(emailQueue.id, email.id));
            }
        } catch (error) {
            console.error(`Failed to send email ${email.id}:`, error);
            await db.update(emailQueue)
                .set({
                    retryCount: email.retryCount + 1,
                    errorMessage: error.message
                })
                .where(eq(emailQueue.id, email.id));
        }
    }
};

// Start the processor interval
export const startEmailProcessor = (intervalMs = 60000) => {
    console.log(`Email processor started (every ${intervalMs}ms)`);
    setInterval(processEmailQueue, intervalMs);
};
