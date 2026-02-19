import { db } from '../../../shared/db/index.js';
import { invoices, auditLogs } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

const logAudit = async (req, actionType, targetId, oldValue, newValue) => {
  await db.insert(auditLogs).values({
    userId: req.user.id,
    actionType,
    targetTable: 'invoices',
    targetId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
};

/**
 * POST /invoices/:id/lock
 *
 * Locks the invoice PDF, preventing further edits.
 * Sets pdfLocked=true, lockedAt=now, lockedBy=current user.
 */
export const lockInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, parseInt(id)));

    if (!existing) {
      return res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' });
    }

    if (existing.pdfLocked) {
      return res.status(409).json({
        message: 'Invoice PDF is already locked',
        code: 'CONFLICT',
        lockedAt: existing.lockedAt,
        lockedBy: existing.lockedBy,
      });
    }

    // Only allow locking for ISSUED or PAID invoices
    if (existing.status === 'DRAFT') {
      return res.status(400).json({
        message: 'Cannot lock a DRAFT invoice. Issue the invoice first.',
        code: 'VALIDATION_ERROR',
      });
    }

    const [updated] = await db
      .update(invoices)
      .set({
        pdfLocked: true,
        lockedAt: new Date(),
        lockedBy: req.user.id,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    await logAudit(req, 'LOCK_PDF', parseInt(id),
      { pdfLocked: false },
      { pdfLocked: true, lockedAt: updated.lockedAt, lockedBy: updated.lockedBy }
    );

    res.json({
      message: 'Invoice PDF locked successfully',
      invoice: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

/**
 * POST /invoices/:id/revise
 *
 * Creates a new revision of a locked invoice.
 * - Increments revisionNumber
 * - Unlocks the PDF for editing
 * - Resets status to DRAFT
 *
 * Body (optional):
 *   - reason: string (reason for revision)
 */
export const createInvoiceRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const [existing] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, parseInt(id)));

    if (!existing) {
      return res.status(404).json({ message: 'Invoice not found', code: 'NOT_FOUND' });
    }

    if (!existing.pdfLocked) {
      return res.status(400).json({
        message: 'Invoice is not locked. Only locked invoices can be revised.',
        code: 'VALIDATION_ERROR',
      });
    }

    const newRevisionNumber = (existing.revisionNumber || 0) + 1;

    const [updated] = await db
      .update(invoices)
      .set({
        pdfLocked: false,
        revisionNumber: newRevisionNumber,
        lockedAt: null,
        lockedBy: null,
        status: 'DRAFT',
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    await logAudit(req, 'REVISE_INVOICE', parseInt(id),
      {
        revisionNumber: existing.revisionNumber,
        pdfLocked: true,
        status: existing.status,
      },
      {
        revisionNumber: newRevisionNumber,
        pdfLocked: false,
        status: 'DRAFT',
        reason,
      }
    );

    res.json({
      message: `Invoice revised to revision #${newRevisionNumber}`,
      invoice: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
