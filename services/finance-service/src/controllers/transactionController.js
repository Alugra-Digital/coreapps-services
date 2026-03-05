import { db } from '../../../shared/db/index.js';
import { financeTransactions } from '../../../shared/db/schema.js';
import { eq, desc, sql, ilike, or, and } from 'drizzle-orm';

function formatJt(value) {
  const num = Number(value);
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(1)} jt`;
  if (num >= 1e3) return `Rp ${(num / 1e3).toFixed(1)} rb`;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

function generateTxId() {
  return `TX-${Date.now().toString().slice(-4)}`;
}

export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search;
    const type = req.query.type;
    const status = req.query.status;
    const category = req.query.category;
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder || 'desc';

    const andConds = [];
    if (search) {
      andConds.push(or(
        ilike(financeTransactions.entity, `%${search}%`),
        ilike(financeTransactions.category, `%${search}%`)
      ));
    }
    if (type) andConds.push(eq(financeTransactions.type, type));
    if (status) andConds.push(eq(financeTransactions.status, status));
    if (category) andConds.push(eq(financeTransactions.category, category));

    const whereClause = andConds.length ? and(...andConds) : undefined;
    const baseQuery = whereClause
      ? db.select().from(financeTransactions).where(whereClause)
      : db.select().from(financeTransactions);

    const allRows = await baseQuery;
    const total = allRows.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    const orderCol = sortBy === 'amount' ? financeTransactions.amount : financeTransactions.date;
    const ordered = sortOrder === 'asc'
      ? [...allRows].sort((a, b) => (sortBy === 'amount' ? Number(a.amount) - Number(b.amount) : new Date(a.date) - new Date(b.date)))
      : [...allRows].sort((a, b) => (sortBy === 'amount' ? Number(b.amount) - Number(a.amount) : new Date(b.date) - new Date(a.date)));
    const rows = ordered.slice(offset, offset + limit);

    const data = rows.map((r) => ({
      id: r.transactionId,
      date: r.date,
      entity: r.entity,
      category: r.category,
      amount: Number(r.amount),
      formattedAmount: formatJt(r.amount),
      type: r.type,
      status: r.status,
    }));

    res.json({
      success: true,
      message: 'Transactions fetched successfully',
      data,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { date, entity, category, amount, type, status } = req.body;
    const errors = [];
    if (!date) errors.push({ field: 'date', message: 'Required' });
    if (!entity) errors.push({ field: 'entity', message: 'Required' });
    if (!category) errors.push({ field: 'category', message: 'Required' });
    if (amount == null) errors.push({ field: 'amount', message: 'Required' });
    if (!type) errors.push({ field: 'type', message: 'Required' });
    if (!status) errors.push({ field: 'status', message: 'Required' });
    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors });
    }

    const transactionId = generateTxId();
    const [row] = await db.insert(financeTransactions).values({
      transactionId,
      date,
      entity,
      category,
      amount: String(amount),
      type,
      status,
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        id: row.transactionId,
        date: row.date,
        entity: row.entity,
        category: row.category,
        amount: Number(row.amount),
        formattedAmount: formatJt(row.amount),
        type: row.type,
        status: row.status,
        createdAt: row.createdAt?.toISOString?.(),
        updatedAt: row.updatedAt?.toISOString?.(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const [row] = await db.select().from(financeTransactions).where(eq(financeTransactions.transactionId, transactionId));
    if (!row) return res.status(404).json({ message: 'Transaction not found', code: 'NOT_FOUND' });

    res.json({
      success: true,
      message: 'Transaction fetched successfully',
      data: {
        id: row.transactionId,
        date: row.date,
        entity: row.entity,
        category: row.category,
        amount: Number(row.amount),
        formattedAmount: formatJt(row.amount),
        type: row.type,
        status: row.status,
        updatedAt: row.updatedAt?.toISOString?.(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { date, entity, category, amount, type, status } = req.body;
    const [existing] = await db.select().from(financeTransactions).where(eq(financeTransactions.transactionId, transactionId));
    if (!existing) return res.status(404).json({ message: 'Transaction not found', code: 'NOT_FOUND' });

    const updates = { updatedAt: new Date() };
    if (date !== undefined) updates.date = date;
    if (entity !== undefined) updates.entity = entity;
    if (category !== undefined) updates.category = category;
    if (amount !== undefined) updates.amount = String(amount);
    if (type !== undefined) updates.type = type;
    if (status !== undefined) updates.status = status;

    const [row] = await db.update(financeTransactions).set(updates).where(eq(financeTransactions.transactionId, transactionId)).returning();

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        id: row.transactionId,
        date: row.date,
        entity: row.entity,
        category: row.category,
        amount: Number(row.amount),
        formattedAmount: formatJt(row.amount),
        type: row.type,
        status: row.status,
        updatedAt: row.updatedAt?.toISOString?.(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const [existing] = await db.select().from(financeTransactions).where(eq(financeTransactions.transactionId, transactionId));
    if (!existing) return res.status(404).json({ message: 'Transaction not found', code: 'NOT_FOUND' });

    await db.delete(financeTransactions).where(eq(financeTransactions.transactionId, transactionId));

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { id: transactionId, deleted: true, deletedAt: new Date().toISOString() },
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
