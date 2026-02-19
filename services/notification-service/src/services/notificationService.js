import { db } from '../../../shared/db/index.js';
import { notifications, emailQueue, users } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

export class NotificationService {
    constructor(socketIO = null) {
        this.io = socketIO;
    }

    setIO(socketIO) {
        this.io = socketIO;
    }

    // Create in-app notification
    async notify(userId, { type, title, message, link, icon }) {
        const [notification] = await db.insert(notifications).values({
            userId,
            type: type || 'INFO',
            title,
            message,
            link,
            icon,
            isRead: false
        }).returning();

        // Push real-time via WebSocket if available
        if (this.io) {
            this.io.to(`user_${userId}`).emit('notification', notification);
        }

        return notification;
    }

    // Extract @usernames from content
    extractMentions(content) {
        const mentionRegex = /@(\w+)/g;
        const matches = content.match(mentionRegex);
        return matches ? matches.map(m => m.substring(1)) : [];
    }

    // Handle notifications for mentions
    async handleMentions(content, authorId, documentType, documentId) {
        const usernames = this.extractMentions(content);
        if (usernames.length === 0) return;

        for (const username of usernames) {
            const [user] = await db.select().from(users).where(eq(users.username, username));
            if (!user) continue;

            await this.notify(user.id, {
                type: 'MENTION',
                title: 'You were mentioned',
                message: `Someone mentioned you in ${documentType} #${documentId}`,
                link: `/${documentType.toLowerCase()}/${documentId}`,
                icon: 'AtSign'
            });
        }
    }

    // Queue email for later sending
    async queueEmail(to, subject, templateId, templateData) {
        return await db.insert(emailQueue).values({
            toEmail: to,
            subject,
            templateId,
            templateData,
            status: 'PENDING'
        }).returning();
    }
}
