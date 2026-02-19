import { db } from '../../../shared/db/index.js';
import { users, roles } from '../../../shared/db/schema.js';
import { PERMISSION_KEYS } from '../../../shared/constants/permissionKeys.js';
import { eq } from 'drizzle-orm';

/**
 * Fetch current user with resilient column selection.
 * Handles DB schema before/after migration 0003 (email, full_name, role_id, etc.).
 */
async function fetchUser(userId) {
  try {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      roleId: users.roleId,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, userId));
    return user;
  } catch (err) {
    if (err?.message?.includes('does not exist') || err?.code === '42703') {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users).where(eq(users.id, userId));
      return user ? { ...user, email: null, fullName: null, roleId: null, isActive: true } : null;
    }
    throw err;
  }
}

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });

    const user = await fetchUser(userId);
    if (!user) return res.status(401).json({ message: 'User not found', code: 'UNAUTHORIZED' });

    const response = {
      id: `user-${user.id}`,
      username: user.username,
      email: user.email ?? null,
      fullName: user.fullName ?? user.username ?? null,
      roleId: user.roleId != null ? `role-${user.roleId}` : null,
      isActive: user.isActive ?? true,
      createdAt: user.createdAt?.toISOString?.() ?? null,
      updatedAt: user.updatedAt?.toISOString?.() ?? null,
      role: null,
    };

    const effectiveRole = user.role ?? req.user?.role;

    if (user.roleId) {
      try {
        const [role] = await db.select().from(roles).where(eq(roles.id, user.roleId));
        if (role) {
          const keys = Array.isArray(role.permissionKeys) ? role.permissionKeys : (role.permissionKeys && JSON.parse(role.permissionKeys)) || [];
          response.role = {
            id: `role-${role.id}`,
            code: role.code,
            name: role.name,
            permissionKeys: role.code === 'SUPER_ADMIN' ? [...PERMISSION_KEYS] : keys,
          };
        }
      } catch {
        // roles table missing or query failed - fall through to effectiveRole
      }
    }

    if (!response.role && effectiveRole) {
      const fallbackKeys =
        effectiveRole === 'SUPER_ADMIN' ? [...PERMISSION_KEYS] : ['dashboard', 'finance', 'hr', 'access_control'];
      response.role = {
        id: `role-${effectiveRole}`,
        code: effectiveRole,
        name: effectiveRole,
        permissionKeys: fallbackKeys,
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
