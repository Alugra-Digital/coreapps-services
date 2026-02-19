import { db } from '../../../shared/db/index.js';
import { proposalPenawaran } from '../../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { generateProposalPenawaranPDF } from '../services/pdfService.js';

const resolveId = (id) => {
  const s = String(id || '');
  if (s.startsWith('PP-')) return parseInt(s.slice(3), 10);
  return parseInt(s, 10);
};

const toDocSchema = (row) => {
  if (!row) return null;
  return {
    id: `PP-${row.id}`,
    coverInfo: row.coverInfo ?? {},
    proposalNumber: row.proposalNumber ?? '',
    clientInfo: row.clientInfo ?? {},
    clientBackground: row.clientBackground ?? null,
    offeredSolution: row.offeredSolution ?? null,
    workingMethod: row.workingMethod ?? null,
    timeline: row.timeline ?? null,
    portfolio: row.portfolio ?? null,
    items: row.items ?? [],
    totalEstimatedCost: parseFloat(row.totalEstimatedCost) ?? 0,
    totalEstimatedCostInWords: row.totalEstimatedCostInWords ?? '',
    currency: row.currency ?? 'IDR',
    scopeOfWork: row.scopeOfWork ?? [],
    termsAndConditions: row.termsAndConditions ?? [],
    notes: row.notes ?? null,
    documentApproval: row.documentApproval ?? {},
    status: row.status ?? 'draft',
    createdAt: row.createdAt?.toISOString?.() ?? null,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  };
};

export const getProposals = async (req, res) => {
  try {
    const { search, status, clientId } = req.query;
    let rows = await db.select().from(proposalPenawaran).orderBy(desc(proposalPenawaran.createdAt));
    if (status) {
      rows = rows.filter((r) => r.status === status);
    }
    if (clientId) {
      rows = rows.filter((r) => {
        const ci = r.clientInfo ?? {};
        return String(ci.clientId ?? ci.clientName ?? '') === String(clientId);
      });
    }
    if (search) {
      const s = String(search).toLowerCase();
      rows = rows.filter((r) => {
        const cover = (r.coverInfo ?? {}).jobOffer ?? '';
        const num = r.proposalNumber ?? '';
        const client = (r.clientInfo ?? {}).clientName ?? '';
        return cover.toLowerCase().includes(s) || num.toLowerCase().includes(s) || client.toLowerCase().includes(s);
      });
    }
    res.json(rows.map(toDocSchema));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getProposalById = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid proposal ID', code: 'INVALID_ID' });
    const [row] = await db.select().from(proposalPenawaran).where(eq(proposalPenawaran.id, numId));
    if (!row) return res.status(404).json({ message: 'Proposal not found', code: 'NOT_FOUND' });
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const createProposal = async (req, res) => {
  try {
    const { coverInfo, proposalNumber, clientInfo, items, totalEstimatedCost, totalEstimatedCostInWords, documentApproval } = req.body;
    if (!coverInfo || !proposalNumber || !clientInfo || !items || totalEstimatedCost == null || !totalEstimatedCostInWords || !documentApproval) {
      return res.status(400).json({
        message: 'coverInfo, proposalNumber, clientInfo, items, totalEstimatedCost, totalEstimatedCostInWords, documentApproval are required',
        code: 'VALIDATION_ERROR',
      });
    }
    const [row] = await db.insert(proposalPenawaran).values({
      coverInfo,
      proposalNumber,
      clientInfo,
      clientBackground: req.body.clientBackground,
      offeredSolution: req.body.offeredSolution,
      workingMethod: req.body.workingMethod,
      timeline: req.body.timeline,
      portfolio: req.body.portfolio,
      items,
      totalEstimatedCost: String(totalEstimatedCost),
      totalEstimatedCostInWords,
      currency: req.body.currency ?? 'IDR',
      scopeOfWork: req.body.scopeOfWork ?? [],
      termsAndConditions: req.body.termsAndConditions ?? [],
      notes: req.body.notes,
      documentApproval,
      status: req.body.status ?? 'draft',
    }).returning();
    res.status(201).json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const updateProposal = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid proposal ID', code: 'INVALID_ID' });
    const [existing] = await db.select().from(proposalPenawaran).where(eq(proposalPenawaran.id, numId));
    if (!existing) return res.status(404).json({ message: 'Proposal not found', code: 'NOT_FOUND' });
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData.id;
    delete updateData.createdAt;
    if (updateData.totalEstimatedCost != null) updateData.totalEstimatedCost = String(updateData.totalEstimatedCost);
    const [row] = await db.update(proposalPenawaran).set(updateData).where(eq(proposalPenawaran.id, numId)).returning();
    res.json(toDocSchema(row));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const deleteProposal = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid proposal ID', code: 'INVALID_ID' });
    const [existing] = await db.select().from(proposalPenawaran).where(eq(proposalPenawaran.id, numId));
    if (!existing) return res.status(404).json({ message: 'Proposal not found', code: 'NOT_FOUND' });
    await db.delete(proposalPenawaran).where(eq(proposalPenawaran.id, numId));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const downloadProposalPDF = async (req, res) => {
  try {
    const numId = resolveId(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ message: 'Invalid proposal ID', code: 'INVALID_ID' });
    const [row] = await db.select().from(proposalPenawaran).where(eq(proposalPenawaran.id, numId));
    if (!row) return res.status(404).json({ message: 'Proposal not found', code: 'NOT_FOUND' });
    const pdfBytes = await generateProposalPenawaranPDF(toDocSchema(row));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="PP-${row.id}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};
