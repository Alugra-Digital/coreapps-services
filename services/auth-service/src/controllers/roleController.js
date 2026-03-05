import { db } from '../../../shared/db/index.js';
import { roles, users } from '../../../shared/db/schema.js';
import { eq, desc, count } from 'drizzle-orm';

function toDocSchema(row) {
  if (!row) return null;
  const keys = Array.isArray(row.permissionKeys) ? row.permissionKeys : (row.permissionKeys && JSON.parse(row.permissionKeys)) || [];
  return {
    id: `role-${row.id}`,
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    permissionKeys: keys,
    isActive: row.isActive ?? true,
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
}

function resolveRoleId(idParam) {
  if (!idParam) return null;
  const m = String(idParam).match(/^role-(\d+)$/);
  const num = m ? parseInt(m[1], 10) : parseInt(idParam, 10);
  return isNaN(num) ? null : num;
}

export const getRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const hasPagination = !isNaN(page) && !isNaN(limit) && page >= 1 && limit >= 1;

    if (hasPagination) {
      const offset = (page - 1) * limit;
      const [totalRow] = await db.select({ count: count() }).from(roles);
      const total = totalRow?.count ?? 0;
      const rows = await db
        .select()
        .from(roles)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(roles.createdAt));
      res.json({
        data: rows.map(toDocSchema),
        total: Number(total),
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit) || 1,
      });
    } else {
      const rows = await db.select().from(roles).orderBy(desc(roles.createdAt));
      res.json(rows.map(toDocSchema));
    }
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const id = resolveRoleId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Role not found', code: 'NOT_FOUND' });
    const [row] = await db.select().from(roles).where(eq(roles.id, id));
    if (!row) return res.status(404).json({ message: 'Role not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createRole = async (req, res) => {
  try {
    const { code, name, description, permissionKeys, isActive } = req.body;
    if (!code || !name) {
      return res.status(400).json({
        message: 'Code and name are required',
        code: 'VALIDATION_ERROR',
        errors: [{ field: !code ? 'code' : 'name', message: 'Required' }],
      });
    }
    const [row] = await db
      .insert(roles)
      .values({
        code,
        name,
        description: description ?? null,
        permissionKeys: permissionKeys ?? [],
        isActive: isActive ?? true,
      })
      .returning();
    res.status(201).json(toDocSchema(row));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: [{ field: 'code', message: 'Code already exists' }],
      });
    }
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const id = resolveRoleId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Role not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(roles).where(eq(roles.id, id));
    if (!existing) return res.status(404).json({ message: 'Role not found', code: 'NOT_FOUND' });
    const { code, name, description, permissionKeys, isActive } = req.body;
    const updates = {};
    if (code != null) updates.code = code;
    if (name != null) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (permissionKeys !== undefined) updates.permissionKeys = permissionKeys;
    if (isActive !== undefined) updates.isActive = isActive;
    const [row] = await db.update(roles).set({ ...updates, updatedAt: new Date() }).where(eq(roles.id, id)).returning();
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const id = resolveRoleId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'Role not found', code: 'NOT_FOUND' });
    const [existing] = await db.select().from(roles).where(eq(roles.id, id));
    if (!existing) return res.status(404).json({ message: 'Role not found', code: 'NOT_FOUND' });
    const [userCountRow] = await db.select({ count: count() }).from(users).where(eq(users.roleId, id));
    const userCount = userCountRow?.count ?? 0;
    if (userCount > 0) {
      return res.status(409).json({
        message: `Cannot delete role: ${userCount} user(s) are assigned to this role. Reassign or remove them first.`,
        code: 'ROLE_IN_USE',
      });
    }
    await db.delete(roles).where(eq(roles.id, id));
    res.status(204).send();
  } catch (error) {
    // PostgreSQL FK violation: 23503 = foreign_key_violation
    if (error.code === '23503') {
      return res.status(409).json({
        message: 'Cannot delete role: one or more users are assigned to this role. Reassign or remove them first.',
        code: 'ROLE_IN_USE',
      });
    }
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
