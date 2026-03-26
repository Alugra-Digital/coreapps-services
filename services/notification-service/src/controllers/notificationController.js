import { db } from '../../../shared/db/index.js';
import { notifications } from '../../../shared/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

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
      success: true,
      data: list.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.message,
        message: n.message,
        time: n.createdAt,
        createdAt: n.createdAt?.toISOString?.() ?? null,
        type: (n.type || 'INFO').toLowerCase(),
        unread: !n.isRead,
        isRead: n.isRead ?? false,
        link: n.link,
      })),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

/** GET /notifications/unread - get unread notifications */
export const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });

    const list = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    res.json({
      success: true,
      data: list.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.message,
        message: n.message,
        time: n.createdAt,
        createdAt: n.createdAt?.toISOString?.() ?? null,
        type: (n.type || 'INFO').toLowerCase(),
        unread: true,
        isRead: false,
        link: n.link,
      })),
    });
  } catch (error) {
    console.error('Get unread notifications error:', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

/** DELETE /notifications/:id - delete a notification */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid ID', code: 'VALIDATION_ERROR' });

    const [row] = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    if (!row) return res.status(404).json({ message: 'Notification not found', code: 'NOT_FOUND' });

    res.json({ success: true, data: { id: row.id } });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

/** PATCH /notifications/:id/read - mark one as read (CoreApps 2.0) */
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid ID', code: 'VALIDATION_ERROR' });

    const [row] = await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    if (!row) return res.status(404).json({ message: 'Notification not found', code: 'NOT_FOUND' });

    res.json({ success: true, data: { id: row.id, isRead: true } });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

/** PATCH /notifications/read-all - mark all as read (CoreApps 2.0) */
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));

    res.json({ success: true, data: { count: 'all' } });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
