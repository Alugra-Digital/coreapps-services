import * as crmService from '../services/crmService.js';
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

const opportunitySchema = z.object({
  name: z.string().min(1),
  leadId: z.number().optional(),
  clientId: z.number().optional(),
  amount: z.number().min(0),
  probability: z.number().min(0).max(100),
  stage: z.enum(['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
  expectedCloseDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
  notes: z.string().optional(),
});

// Leads
export const getLeads = async (req, res) => {
  try {
    const leads = await crmService.getLeads();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createLead = async (req, res) => {
  try {
    const data = leadSchema.parse(req.body);
    const lead = await crmService.createLead(data);
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const updateLead = async (req, res) => {
  try {
    const data = leadSchema.partial().parse(req.body);
    const lead = await crmService.updateLead(parseInt(req.params.id), data);
    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const deleteLead = async (req, res) => {
  try {
    await crmService.deleteLead(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

// Opportunities
export const getOpportunities = async (req, res) => {
  try {
    const opps = await crmService.getOpportunities();
    res.json(opps);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createOpportunity = async (req, res) => {
  try {
    const data = opportunitySchema.parse(req.body);
    const opp = await crmService.createOpportunity(data);
    res.status(201).json(opp);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const updateOpportunity = async (req, res) => {
  try {
    const data = opportunitySchema.partial().parse(req.body);
    const opp = await crmService.updateOpportunity(parseInt(req.params.id), data);
    res.json(opp);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const deleteOpportunity = async (req, res) => {
  try {
    await crmService.deleteOpportunity(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
