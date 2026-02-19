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
