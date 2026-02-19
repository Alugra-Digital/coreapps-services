import { db } from '../../../shared/db/index.js';
import { expenseClaims, auditLogs } from '../../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const expenseSchema = z.object({
    employeeId: z.number().int(),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    category: z.string().min(1),
    description: z.string().optional(),
    amount: z.number().min(0),
    debitAccountId: z.number().int(),
    creditAccountId: z.number().int(),
});

const logAudit = async (req, actionType, targetId, oldValue, newValue) => {
    try {
        await db.insert(auditLogs).values({
            userId: req.user?.id,
            actionType,
            targetTable: 'expense_claims',
            targetId,
            oldValue: oldValue ?? null,
            newValue: newValue ?? null,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
    } catch (e) {
        console.error("Audit Log Failed", e);
    }
};

export const getExpenses = async (req, res) => {
    try {
        const data = await db.select().from(expenseClaims).orderBy(desc(expenseClaims.createdAt));
        res.json(data);
    } catch (error) {
        console.error('[getExpenses]', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const createExpense = async (req, res) => {
    try {
        const validatedData = expenseSchema.parse(req.body);

        const [newExpense] = await db.insert(expenseClaims).values({
            ...validatedData,
            amount: validatedData.amount.toString(),
            status: 'DRAFT'
        }).returning();

        await logAudit(req, 'CREATE', newExpense.id, null, newExpense);

        res.status(201).json(newExpense);
    } catch (error) {
        console.error('[createExpense]', error);
        res.status(400).json({ message: error.errors || error.message, code: 'VALIDATION_ERROR' });
    }
};

export const updateExpenseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const numId = parseInt(id, 10);
        if (isNaN(numId)) return res.status(400).json({ message: 'Invalid expense ID', code: 'INVALID_ID' });

        const [existing] = await db.select().from(expenseClaims).where(eq(expenseClaims.id, numId));
        if (!existing) return res.status(404).json({ message: 'Expense not found', code: 'NOT_FOUND' });

        const [updated] = await db.update(expenseClaims)
            .set({ status, updatedAt: new Date() })
            .where(eq(expenseClaims.id, numId))
            .returning();

        await logAudit(req, 'UPDATE_STATUS', numId, { status: existing.status }, { status: updated.status });

        res.json(updated);
    } catch (error) {
        console.error('[updateExpenseStatus]', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const postExpense = async (req, res) => {
    // Placeholder for accounting posting logic
    try {
        const { id } = req.params;
        const numId = parseInt(id, 10);
        if (isNaN(numId)) return res.status(400).json({ message: 'Invalid expense ID', code: 'INVALID_ID' });

        const [existing] = await db.select().from(expenseClaims).where(eq(expenseClaims.id, numId));
        if (!existing) return res.status(404).json({ message: 'Expense not found', code: 'NOT_FOUND' });

        if (existing.status !== 'APPROVED') {
            return res.status(400).json({ message: 'Expense must be APPROVED before posting', code: 'VALIDATION_ERROR' });
        }

        const [updated] = await db.update(expenseClaims)
            .set({ status: 'POSTED', postedAt: new Date() })
            .where(eq(expenseClaims.id, numId))
            .returning();

        // TODO: Create Journal Entry here

        res.json(updated);
    } catch (error) {
        console.error('[postExpense]', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
