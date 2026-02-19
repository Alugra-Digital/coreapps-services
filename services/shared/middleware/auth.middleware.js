import { verifyToken } from '../utils/jwt.util.js';
import { db } from '../db/index.js';
import { rolePermissions, permissions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];
  const payload = await verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token', code: 'UNAUTHORIZED' });
  }

  req.user = payload;

  // Fetch permissions
  try {
    const perms = await db.select({
        name: permissions.name
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.role, req.user.role));

    req.user.permissions = perms.map(p => p.name);
  } catch (error) {
    console.error('Failed to fetch permissions', error);
    req.user.permissions = [];
  }

  next();
};
