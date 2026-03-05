import { db } from '../../../shared/db/index.js';
import { clientPurchaseOrders } from '../../../shared/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { clients } from '../../../shared/db/schema.js';
import { projects } from '../../../shared/db/schema.js';

const CPO_STATUSES = ['RECEIVED', 'VERIFIED', 'EXPIRED', 'CANCELLED'];

function toDocSchema(row, clientRow, projectRow) {
  if (!row) return null;
  const projectName = projectRow?.identity?.projectName ?? projectRow?.identity?.name ?? null;
  return {
    id: row.id,
    cpoNumber: row.cpoNumber,
    internalReference: row.internalReference ?? null,
    projectId: row.projectId ?? null,
    projectName,
    clientId: row.clientId,
    clientName: clientRow?.companyName ?? clientRow?.name ?? null,
    linkedProposalId: row.linkedProposalId ?? null,
    linkedProposalVersion: row.linkedProposalVersion ?? null,
    amount: row.amount != null ? Number(row.amount) : 0,
    currency: row.currency ?? 'IDR',
    ppnIncluded: row.ppnIncluded ?? true,
    issuedDate: row.issuedDate ?? null,
    receivedDate: row.receivedDate ?? null,
    validUntil: row.validUntil ?? null,
    description: row.description ?? null,
    paymentTerms: row.paymentTerms ?? null,
    status: row.status ?? 'RECEIVED',
    attachmentUrl: row.attachmentUrl ?? null,
    attachmentName: row.attachmentName ?? null,
    verifiedBy: row.verifiedBy ?? null,
    verifiedAt: row.verifiedAt?.toISOString?.() ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt?.toISOString?.() ?? null,
    createdBy: row.createdBy ?? null,
  };
}

function resolveId(idParam) {
  if (!idParam) return null;
  const n = parseInt(String(idParam), 10);
  return isNaN(n) ? null : n;
}

export const getClientPurchaseOrders = async (req, res) => {
  try {
    const projectId = req.query.projectId ? resolveId(req.query.projectId) : undefined;
    const clientId = req.query.clientId ? resolveId(req.query.clientId) : undefined;
    const status = req.query.status;
    const search = (req.query.search || '').trim();

    const conditions = [];
    if (projectId != null) conditions.push(eq(clientPurchaseOrders.projectId, projectId));
    if (clientId != null) conditions.push(eq(clientPurchaseOrders.clientId, clientId));
    if (status && CPO_STATUSES.includes(status)) {
      conditions.push(eq(clientPurchaseOrders.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        cpo: clientPurchaseOrders,
        client: clients,
        project: projects,
      })
      .from(clientPurchaseOrders)
      .leftJoin(clients, eq(clientPurchaseOrders.clientId, clients.id))
      .leftJoin(projects, eq(clientPurchaseOrders.projectId, projects.id))
      .where(whereClause)
      .orderBy(desc(clientPurchaseOrders.createdAt));

    let result = rows.map((r) => toDocSchema(r.cpo, r.client, r.project));

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (r) =>
          (r.cpoNumber ?? '').toLowerCase().includes(s) ||
          (r.internalReference ?? '').toLowerCase().includes(s) ||
          (r.clientName ?? '').toLowerCase().includes(s)
      );
    }

    res.json(result);
  } catch (error) {
    console.error('[getClientPurchaseOrders]', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getClientPurchaseOrderById = async (req, res) => {
  try {
    const id = resolveId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'CPO not found', code: 'NOT_FOUND' });

    const [row] = await db
      .select({
        cpo: clientPurchaseOrders,
        client: clients,
        project: projects,
      })
      .from(clientPurchaseOrders)
      .leftJoin(clients, eq(clientPurchaseOrders.clientId, clients.id))
      .leftJoin(projects, eq(clientPurchaseOrders.projectId, projects.id))
      .where(eq(clientPurchaseOrders.id, id));

    if (!row) return res.status(404).json({ message: 'CPO not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(row.cpo, row.client, row.project));
  } catch (error) {
    console.error('[getClientPurchaseOrderById]', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createClientPurchaseOrder = async (req, res) => {
  try {
    const {
      cpoNumber,
      internalReference,
      projectId,
      clientId,
      linkedProposalId,
      linkedProposalVersion,
      amount,
      currency,
      ppnIncluded,
      issuedDate,
      receivedDate,
      validUntil,
      description,
      paymentTerms,
      status,
      attachmentUrl,
      attachmentName,
      notes,
    } = req.body;

    if (!cpoNumber || !clientId) {
      return res.status(400).json({
        message: 'cpoNumber and clientId are required',
        code: 'VALIDATION_ERROR',
        errors: [
          { field: 'cpoNumber', message: !cpoNumber ? 'CPO number is required' : null },
          { field: 'clientId', message: !clientId ? 'Client is required' : null },
        ].filter((e) => e.message),
      });
    }

    const employeeId = req.user?.employeeId ?? req.user?.id ?? null;

    const [row] = await db
      .insert(clientPurchaseOrders)
      .values({
        cpoNumber: String(cpoNumber).trim(),
        internalReference: internalReference?.trim() || null,
        projectId: projectId != null ? Number(projectId) : null,
        clientId: Number(clientId),
        linkedProposalId: linkedProposalId != null ? Number(linkedProposalId) : null,
        linkedProposalVersion: linkedProposalVersion?.trim() || null,
        amount: amount != null ? Number(amount) : 0,
        currency: currency ?? 'IDR',
        ppnIncluded: ppnIncluded !== false,
        issuedDate: issuedDate || null,
        receivedDate: receivedDate || null,
        validUntil: validUntil || null,
        description: description?.trim() || null,
        paymentTerms: paymentTerms?.trim() || null,
        status: status && CPO_STATUSES.includes(status) ? status : 'RECEIVED',
        attachmentUrl: attachmentUrl?.trim() || null,
        attachmentName: attachmentName?.trim() || null,
        notes: notes?.trim() || null,
        createdBy: employeeId,
      })
      .returning();

    const [full] = await db
      .select({
        cpo: clientPurchaseOrders,
        client: clients,
        project: projects,
      })
      .from(clientPurchaseOrders)
      .leftJoin(clients, eq(clientPurchaseOrders.clientId, clients.id))
      .leftJoin(projects, eq(clientPurchaseOrders.projectId, projects.id))
      .where(eq(clientPurchaseOrders.id, row.id));

    res.status(201).json(toDocSchema(full.cpo, full.client, full.project));
  } catch (error) {
    console.error('[createClientPurchaseOrder]', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const updateClientPurchaseOrder = async (req, res) => {
  try {
    const id = resolveId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'CPO not found', code: 'NOT_FOUND' });

    const [existing] = await db.select().from(clientPurchaseOrders).where(eq(clientPurchaseOrders.id, id));
    if (!existing) return res.status(404).json({ message: 'CPO not found', code: 'NOT_FOUND' });

    const {
      cpoNumber,
      internalReference,
      projectId,
      clientId,
      linkedProposalId,
      linkedProposalVersion,
      amount,
      currency,
      ppnIncluded,
      issuedDate,
      receivedDate,
      validUntil,
      description,
      paymentTerms,
      status,
      attachmentUrl,
      attachmentName,
      notes,
    } = req.body;

    const updates = {};
    if (cpoNumber !== undefined) updates.cpoNumber = String(cpoNumber).trim();
    if (internalReference !== undefined) updates.internalReference = internalReference?.trim() || null;
    if (projectId !== undefined) updates.projectId = projectId != null ? Number(projectId) : null;
    if (clientId !== undefined) updates.clientId = Number(clientId);
    if (linkedProposalId !== undefined) updates.linkedProposalId = linkedProposalId != null ? Number(linkedProposalId) : null;
    if (linkedProposalVersion !== undefined) updates.linkedProposalVersion = linkedProposalVersion?.trim() || null;
    if (amount !== undefined) updates.amount = Number(amount);
    if (currency !== undefined) updates.currency = currency ?? 'IDR';
    if (ppnIncluded !== undefined) updates.ppnIncluded = ppnIncluded !== false;
    if (issuedDate !== undefined) updates.issuedDate = issuedDate || null;
    if (receivedDate !== undefined) updates.receivedDate = receivedDate || null;
    if (validUntil !== undefined) updates.validUntil = validUntil || null;
    if (description !== undefined) updates.description = description?.trim() || null;
    if (paymentTerms !== undefined) updates.paymentTerms = paymentTerms?.trim() || null;
    if (status !== undefined && CPO_STATUSES.includes(status)) updates.status = status;
    if (attachmentUrl !== undefined) updates.attachmentUrl = attachmentUrl?.trim() || null;
    if (attachmentName !== undefined) updates.attachmentName = attachmentName?.trim() || null;
    if (notes !== undefined) updates.notes = notes?.trim() || null;

    const [row] = await db
      .update(clientPurchaseOrders)
      .set(updates)
      .where(eq(clientPurchaseOrders.id, id))
      .returning();

    const [full] = await db
      .select({
        cpo: clientPurchaseOrders,
        client: clients,
        project: projects,
      })
      .from(clientPurchaseOrders)
      .leftJoin(clients, eq(clientPurchaseOrders.clientId, clients.id))
      .leftJoin(projects, eq(clientPurchaseOrders.projectId, projects.id))
      .where(eq(clientPurchaseOrders.id, id));

    res.json(toDocSchema(full.cpo, full.client, full.project));
  } catch (error) {
    console.error('[updateClientPurchaseOrder]', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const verifyClientPurchaseOrder = async (req, res) => {
  try {
    const id = resolveId(req.params.id);
    if (id == null) return res.status(404).json({ message: 'CPO not found', code: 'NOT_FOUND' });

    const [existing] = await db.select().from(clientPurchaseOrders).where(eq(clientPurchaseOrders.id, id));
    if (!existing) return res.status(404).json({ message: 'CPO not found', code: 'NOT_FOUND' });

    const employeeId = req.user?.employeeId ?? req.user?.id ?? null;

    const [row] = await db
      .update(clientPurchaseOrders)
      .set({
        status: 'VERIFIED',
        verifiedBy: employeeId,
        verifiedAt: new Date(),
      })
      .where(eq(clientPurchaseOrders.id, id))
      .returning();

    const [full] = await db
      .select({
        cpo: clientPurchaseOrders,
        client: clients,
        project: projects,
      })
      .from(clientPurchaseOrders)
      .leftJoin(clients, eq(clientPurchaseOrders.clientId, clients.id))
      .leftJoin(projects, eq(clientPurchaseOrders.projectId, projects.id))
      .where(eq(clientPurchaseOrders.id, id));

    res.json(toDocSchema(full.cpo, full.client, full.project));
  } catch (error) {
    console.error('[verifyClientPurchaseOrder]', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
