import { db } from '../../../shared/db/index.js';
import { employees, auditLogs } from '../../../shared/db/schema.js';
import { eq, ilike, or, and, count, desc, isNull, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { toDocSchema, fromDocSchema, resolveEmployeeId } from '../utils/employeeMapper.js';
import { uploadDocument } from '../services/minioService.js';

const logAudit = async (req, actionType, targetId, oldValue, newValue) => {
  if (!req.user?.id) return;
  await db.insert(auditLogs).values({
    userId: req.user.id,
    actionType,
    targetTable: 'employees',
    targetId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
};

/** Doc schema validation for create */
const employeeCreateSchema = z.object({
  nik: z.string().min(1, 'NIK is required'),
  namaKaryawan: z.string().min(1, 'Nama karyawan is required'),
  namaJabatan: z.string().min(1, 'Nama jabatan is required'),
  tipeKaryawan: z.string().optional(),
  tmk: z.string().optional(),
  noKtp: z.string().optional(),
  noKk: z.string().optional(),
  npwp: z.string().optional(),
  noHp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  pendidikan: z.string().optional(),
  statusPajak: z.string().optional(),
  statusPerkawinan: z.string().optional(),
  jumlahAnak: z.number().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  jenisKelamin: z.string().optional(),
  alamatKtp: z.string().optional(),
  kotaKtp: z.string().optional(),
  provinsiKtp: z.string().optional(),
  noRek: z.string().optional(),
  namaBank: z.string().optional(),
  noJknKis: z.string().optional(),
  noJms: z.string().optional(),
  tanggalKeluar: z.string().nullable().optional(),
});

/** Doc schema validation for update (partial) */
const employeeUpdateSchema = employeeCreateSchema.partial();

function formatErrorResponse(error) {
  if (error.name === 'ZodError') {
    return {
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    };
  }
  return { message: error.message || 'Internal server error', code: 'ERROR' };
}

export const getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const search = (req.query.search || '').trim();
    const position = (req.query.position || '').trim();
    const status = req.query.status || 'active';
    const includeResigned = req.query.includeResigned === 'true';

    const hasPagination = !isNaN(page) && !isNaN(limit) && page >= 1 && limit >= 1;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(employees.name, `%${search}%`),
          ilike(employees.nik, `%${search}%`),
          ilike(employees.position, `%${search}%`),
          ilike(employees.email, `%${search}%`)
        )
      );
    }
    if (position) {
      conditions.push(eq(employees.position, position));
    }
    if (status === 'active') {
      conditions.push(isNull(employees.terminationDate));
    } else if (status === 'resigned') {
      conditions.push(isNotNull(employees.terminationDate));
    }
    const whereClause = conditions.length ? and(...conditions) : undefined;

    if (hasPagination) {
      const offset = (page - 1) * limit;
      const [totalRow] = await db.select({ count: count() }).from(employees).where(whereClause);
      const total = totalRow?.count ?? 0;
      const rows = await db
        .select()
        .from(employees)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(employees.createdAt));

      const data = rows.map((r) => toDocSchema(r));
      res.json({
        data,
        total: Number(total),
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit) || 1,
      });
    } else {
      const rows = await db.select().from(employees).where(whereClause).orderBy(desc(employees.createdAt));
      const data = rows.map((r) => toDocSchema(r));
      res.json(data);
    }
  } catch (error) {
    res.status(500).json(formatErrorResponse(error));
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { by, value } = resolveEmployeeId(id);
    if (!by || value == null) return res.status(404).json({ message: 'Employee not found', code: 'NOT_FOUND' });

    let employee;
    if (by === 'id') {
      [employee] = await db.select().from(employees).where(eq(employees.id, value));
    } else {
      [employee] = await db.select().from(employees).where(eq(employees.nik, value));
    }
    if (!employee) return res.status(404).json({ message: 'Employee not found', code: 'NOT_FOUND' });

    res.json(toDocSchema(employee));
  } catch (error) {
    res.status(500).json(formatErrorResponse(error));
  }
};

export const createEmployee = async (req, res) => {
  try {
    const parsed = employeeCreateSchema.parse(req.body);
    const dbData = fromDocSchema(parsed);
    dbData.ktp = dbData.ktp || parsed.noKtp || '';
    dbData.tmk = parsed.tmk ? new Date(parsed.tmk) : new Date();

    const [existing] = await db.select().from(employees).where(eq(employees.nik, dbData.nik));
    if (existing) {
      return res.status(409).json({
        message: 'Employee with this NIK already exists',
        code: 'DUPLICATE_NIK',
        errors: [{ field: 'nik', message: 'NIK already exists' }],
      });
    }

    const [newEmployee] = await db.insert(employees).values(dbData).returning();
    await logAudit(req, 'CREATE', newEmployee.id, null, newEmployee);

    res.status(201).json(toDocSchema(newEmployee));
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(formatErrorResponse(error));
    }
    res.status(500).json(formatErrorResponse(error));
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { by, value } = resolveEmployeeId(id);
    if (!by || value == null) return res.status(404).json({ message: 'Employee not found', code: 'NOT_FOUND' });

    const parsed = employeeUpdateSchema.parse(req.body);
    const dbData = fromDocSchema(parsed);
    if (parsed.tmk !== undefined) {
      if (parsed.tmk) dbData.tmk = new Date(parsed.tmk);
      else delete dbData.tmk; // Do not update tmk if empty string is passed
    }
    if (parsed.tanggalLahir !== undefined) dbData.dateOfBirth = parsed.tanggalLahir ? new Date(parsed.tanggalLahir) : null;
    if (parsed.tanggalKeluar !== undefined) dbData.terminationDate = parsed.tanggalKeluar ? new Date(parsed.tanggalKeluar) : null;

    let existing;
    if (by === 'id') {
      [existing] = await db.select().from(employees).where(eq(employees.id, value));
    } else {
      [existing] = await db.select().from(employees).where(eq(employees.nik, value));
    }
    if (!existing) return res.status(404).json({ message: 'Employee not found', code: 'NOT_FOUND' });

    const [updated] = await db
      .update(employees)
      .set({ ...dbData, updatedAt: new Date() })
      .where(eq(employees.id, existing.id))
      .returning();

    await logAudit(req, 'UPDATE', updated.id, existing, updated);
    res.json(toDocSchema(updated));
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(formatErrorResponse(error));
    }
    res.status(500).json(formatErrorResponse(error));
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { by, value } = resolveEmployeeId(id);
    if (!by || value == null) return res.status(404).json({ message: 'Employee not found', code: 'NOT_FOUND' });

    let existing;
    if (by === 'id') {
      [existing] = await db.select().from(employees).where(eq(employees.id, value));
    } else {
      [existing] = await db.select().from(employees).where(eq(employees.nik, value));
    }
    if (!existing) return res.status(404).json({ message: 'Employee not found', code: 'NOT_FOUND' });

    await db.update(employees).set({ deletedAt: new Date(), status: 'TERMINATED', terminationDate: new Date() }).where(eq(employees.id, existing.id));
    await logAudit(req, 'DELETE', existing.id, existing, null);

    res.status(204).send();
  } catch (error) {
    res.status(500).json(formatErrorResponse(error));
  }
};

export const uploadEmployeeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No file uploaded', code: 'NO_FILE' });

    const { by, value } = resolveEmployeeId(id);
    if (!by || value == null) return res.status(404).json({ message: 'Employee not found', code: 'NOT_FOUND' });

    let employee;
    if (by === 'id') {
      [employee] = await db.select().from(employees).where(eq(employees.id, value));
    } else {
      [employee] = await db.select().from(employees).where(eq(employees.nik, value));
    }
    if (!employee) return res.status(404).json({ message: 'Employee not found', code: 'NOT_FOUND' });

    const objectName = await uploadDocument(file, employee.nik, type);
    res.json({ message: 'Upload successful', objectName });
  } catch (error) {
    res.status(500).json(formatErrorResponse(error));
  }
};
