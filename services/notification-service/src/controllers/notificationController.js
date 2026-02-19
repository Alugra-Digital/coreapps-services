import { db } from '../../../shared/db/index.js';
import { notifications } from '../../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    res.json({
      data: list.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.message,
        time: n.createdAt,
        type: (n.type || 'INFO').toLowerCase(),
        unread: !n.isRead,
        link: n.link,
      })),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
