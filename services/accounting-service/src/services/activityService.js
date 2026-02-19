import { db } from '../../../shared/db/index.js';
import { activityTimeline, users } from '../../../shared/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

export const logActivity = async (documentType, documentId, userId, actionType, description, metadata = {}) => {
    return await db.insert(activityTimeline).values({
        documentType,
        documentId,
        userId,
        actionType: actionType.toUpperCase(),
        description,
        metadata
    }).returning();
};

export const getActivityTimeline = async (documentType, documentId) => {
    return await db.select({
        id: activityTimeline.id,
        actionType: activityTimeline.actionType,
        description: activityTimeline.description,
        metadata: activityTimeline.metadata,
        createdAt: activityTimeline.createdAt,
        user: {
            id: users.id,
            username: users.username
        }
    })
        .from(activityTimeline)
        .leftJoin(users, eq(activityTimeline.userId, users.id))
        .where(and(
            eq(activityTimeline.documentType, documentType),
            eq(activityTimeline.documentId, documentId)
        ))
        .orderBy(desc(activityTimeline.createdAt));
};
