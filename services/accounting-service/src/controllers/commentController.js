import { db } from '../../../shared/db/index.js';
import { comments, users } from '../../../shared/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
// Since NotificationService is in another microservice, we will use a client or direct DB insert for now
// Ideally we'd hit the notification-service API.
import axios from 'axios';

export const createComment = async (req, res) => {
    try {
        const { documentType, documentId, content, parentCommentId } = req.body;
        const userId = req.user.id;

        const [comment] = await db.insert(comments).values({
            documentType,
            documentId,
            userId,
            content,
            parentCommentId
        }).returning();

        // Trigger mention notifications via the notification service
        try {
            await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notification/internal/handle-mentions`, {
                content,
                authorId: userId,
                documentType,
                documentId
            }, {
                headers: { 'Internal-Secret': process.env.INTERNAL_SERVICE_SECRET }
            });
        } catch (err) {
            console.error('Failed to trigger mention notifications:', err.message);
        }

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getComments = async (req, res) => {
    try {
        const { docType, docId } = req.params;
        const result = await db.select({
            id: comments.id,
            content: comments.content,
            createdAt: comments.createdAt,
            user: {
                id: users.id,
                username: users.username
            }
        })
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .where(and(
                eq(comments.documentType, docType),
                eq(comments.documentId, parseInt(docId))
            ))
            .orderBy(desc(comments.createdAt));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
