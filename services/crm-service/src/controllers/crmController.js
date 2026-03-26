import * as crmService from '../services/crmService.js';
import { z } from 'zod';

const statusEnum = ["NEW", "CONTACTED", "QUALIFIED", "LOST", "CONVERTED"];

// Helper function to normalize enum values
const normalizeStatus = (val) => val ? val.toUpperCase() : undefined;

export const leadSchema = z.object({
    name: z.string().min(1),
    company: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    status: z.enum(statusEnum).optional().transform(normalizeStatus),
    source: z.string().optional(),
    notes: z.string().optional(),
});

export const opportunitySchema = z.object({
    name: z.string().min(1),
    leadId: z.number().optional(),
    clientId: z.number().optional(),
    amount: z.number().min(0),
    probability: z.number().min(0).max(100),
    stage: z.enum(['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional().transform(normalizeStatus),
    expectedCloseDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
    notes: z.string().optional(),
});

// ── Lead Handlers ─────────────────────────────────────────────────────────────

export const getLeads = async (req, res) => {
  try {
    const leads = await crmService.getLeads();
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await crmService.getLeadById(Number(id));
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const parsed = leadSchema.parse(req.body);
    const lead = await crmService.createLead(parsed);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = leadSchema.partial().parse(req.body);
    const lead = await crmService.updateLead(Number(id), parsed);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    await crmService.deleteLead(Number(id));
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Opportunity Handlers ──────────────────────────────────────────────────────

export const getOpportunities = async (req, res) => {
  try {
    const opportunities = await crmService.getOpportunities();
    res.json({ success: true, data: opportunities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOpportunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const opp = await crmService.getOpportunityById(Number(id));
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found' });
    res.json({ success: true, data: opp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOpportunity = async (req, res) => {
  try {
    const parsed = opportunitySchema.parse(req.body);
    const opp = await crmService.createOpportunity(parsed);
    res.status(201).json({ success: true, data: opp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = opportunitySchema.partial().parse(req.body);
    const opp = await crmService.updateOpportunity(Number(id), parsed);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    res.json({ success: true, data: opp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    await crmService.deleteOpportunity(Number(id));
    res.json({ success: true, message: 'Opportunity deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
