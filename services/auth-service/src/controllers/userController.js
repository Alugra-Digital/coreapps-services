import { db } from '../../../shared/db/index.js';
import { users, roles } from '../../../shared/db/schema.js';
import { eq, desc, count } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

function toDocSchema(row) {
  if (!row) return null;
  return {
    id: `user-${row.id}`,
    username: row.username,
    email: row.email ?? null,
    fullName: row.fullName ?? null,
    roleId: row.roleId != null ? `role-${row.roleId}` : null,
    isActive: row.isActive ?? true,
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
}

function resolveUserId(idParam) {
  if (!idParam) return null;
  const m = String(idParam).match(/^user-(\d+)$/);
  return m ? parseInt(m[1], 10) : (isNaN(parseInt(idParam, 10)) ? null : parseInt(idParam, 10));
}

const userSelectFields = {
  id: users.id,
  username: users.username,
  email: users.email,
  fullName: users.fullName,
  roleId: users.roleId,
  isActive: users.isActive,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const hasPagination = !isNaN(page) && !isNaN(limit) && page >= 1 && limit >= 1;

    if (hasPagination) {
      const offset = (page - 1) * limit;
      const [totalRow] = await db.select({ count: count() }).from(users);
      const total = totalRow?.count ?? 0;
      const rows = await db
        .select(userSelectFields)
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt));
      res.json({
        data: rows.map(toDocSchema),
        total: Number(total),
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit) || 1,
      });
    } else {
      const rows = await db
        .select(userSelectFields)
        .from(users)
        .orderBy(desc(users.createdAt));
      res.json(rows.map(toDocSchema));
    }
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = resolveUserId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    const [row] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      roleId: users.roleId,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
    if (!row) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, fullName, roleId, password, isActive } = req.body;
    const errors = [];
    if (!username) errors.push({ field: 'username', message: 'Required' });
    if (!email) errors.push({ field: 'email', message: 'Required' });
    if (!fullName) errors.push({ field: 'fullName', message: 'Required' });
    if (!roleId || (typeof roleId === 'string' && roleId.trim() === '')) {
      errors.push({ field: 'roleId', message: 'Role is required' });
    }
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
      });
    }
    const [existing] = await db.select().from(users).where(eq(users.username, username));
    if (existing) {
      return res.status(409).json({ message: 'Username already exists', code: 'DUPLICATE_USERNAME' });
    }
    const roleIdNum = parseInt(String(roleId).replace(/^role-/, ''), 10);
    if (isNaN(roleIdNum)) {
      return res.status(400).json({
        message: 'Invalid role',
        code: 'VALIDATION_ERROR',
        errors: [{ field: 'roleId', message: 'Invalid role ID' }],
      });
    }
    const [roleExists] = await db.select().from(roles).where(eq(roles.id, roleIdNum));
    if (!roleExists) {
      return res.status(400).json({
        message: 'Role not found',
        code: 'VALIDATION_ERROR',
        errors: [{ field: 'roleId', message: 'Role does not exist' }],
      });
    }
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('changeme', 10);
    const [row] = await db.insert(users).values({
      username,
      password: hashedPassword,
      email: email ?? null,
      fullName: fullName ?? null,
      roleId: roleIdNum,
      role: 'SUPER_ADMIN',
      isActive: isActive ?? true,
    }).returning();
    res.status(201).json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = resolveUserId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(users).where(eq(users.id, id));
    if (!existing) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    const { username, email, fullName, roleId, password, isActive } = req.body;
    const updates = {};
    if (username != null) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (fullName !== undefined) updates.fullName = fullName;
    if (roleId !== undefined) {
      updates.roleId = roleId ? parseInt(String(roleId).replace(/^role-/, ''), 10) : null;
    }
    if (isActive !== undefined) updates.isActive = isActive;
    if (password) updates.password = await bcrypt.hash(password, 10);
    updates.updatedAt = new Date();
    const [row] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = resolveUserId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(users).where(eq(users.id, id));
    if (!existing) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    await db.delete(users).where(eq(users.id, id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
