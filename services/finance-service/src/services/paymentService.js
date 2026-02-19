import { db } from '../../../shared/db/index.js';
import { paymentEntries, invoices } from '../../../shared/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import * as accountingService from './accountingService.js';

export const createPayment = async (data) => {
    return await db.transaction(async (tx) => {
        // 1. Create Payment Entry
        const [payment] = await tx.insert(paymentEntries).values({
            invoiceId: data.invoiceId,
            date: data.date ? new Date(data.date) : new Date(),
            amount: data.amount.toString(),
            paymentMode: data.paymentMode,
            referenceNo: data.referenceNo,
        }).returning();

        // 2. Update Invoice Paid Amount
        const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, data.invoiceId));
        if (!invoice) throw new Error('Invoice not found');

        const newPaidAmount = Number(invoice.paidAmount || 0) + Number(data.amount);
        const grandTotal = Number(invoice.grandTotal);

        let newStatus = invoice.status;
        if (newPaidAmount >= grandTotal) {
            newStatus = 'PAID';
        } else if (newPaidAmount > 0) {
            newStatus = 'PARTIAL';
        }

        await tx.update(invoices)
            .set({
                paidAmount: newPaidAmount.toString(),
                status: newStatus
            })
            .where(eq(invoices.id, data.invoiceId));

        // 3. Trigger Auto-Posting to GL
        // Note: autoPostPayment also uses a transaction internally, but since we are already in one,
        // we should ensure it uses the current 'tx'. 
        // Our accountingService.autoPostPayment uses db.transaction which is fine (nested transactions in Drizzle/PG).

        await accountingService.autoPostPayment(payment.id);

        return payment;
    });
};

export const getPaymentsByInvoice = async (invoiceId) => {
    return await db.select().from(paymentEntries).where(eq(paymentEntries.invoiceId, invoiceId));
};

export const getPayments = async (filters = {}) => {
    const limit = Math.min(parseInt(filters.limit) || 50, 200);
    const page = parseInt(filters.page) || 1;
    const offset = (page - 1) * limit;
    const rows = await db.select({
        id: paymentEntries.id,
        invoiceId: paymentEntries.invoiceId,
        date: paymentEntries.date,
        amount: paymentEntries.amount,
        paymentMode: paymentEntries.paymentMode,
        referenceNo: paymentEntries.referenceNo,
    })
        .from(paymentEntries)
        .orderBy(desc(paymentEntries.createdAt))
        .limit(limit)
        .offset(offset);
    return rows.map((r) => ({
        id: r.id,
        paymentNumber: r.referenceNo || `PAY-${r.id}`,
        invoiceId: r.invoiceId,
        amount: parseFloat(r.amount || 0),
        paymentDate: r.date,
        paymentMethod: r.paymentMode === 'BANK' ? 'Bank Transfer' : 'Cash',
        reference: r.referenceNo,
    }));
};

export const getPaymentById = async (id) => {
    const [row] = await db.select().from(paymentEntries).where(eq(paymentEntries.id, parseInt(id)));
    if (!row) return null;
    return {
        id: row.id,
        paymentNumber: row.referenceNo || `PAY-${row.id}`,
        invoiceId: row.invoiceId,
        amount: parseFloat(row.amount || 0),
        paymentDate: row.date,
        paymentMethod: row.paymentMode === 'BANK' ? 'Bank Transfer' : 'Cash',
        reference: row.referenceNo,
    };
};
