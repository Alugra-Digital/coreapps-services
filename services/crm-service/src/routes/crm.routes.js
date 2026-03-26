import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { authorize } from '../../../shared/middleware/rbac.middleware.js';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
} from '../controllers/crmController.js';

const router = express.Router();

// Leads
router.get('/leads', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), getLeads);
router.get('/leads/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), getLeadById);
router.post('/leads', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), createLead);
router.patch('/leads/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), updateLead);
router.delete('/leads/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), deleteLead);

// Opportunities
router.get('/opportunities', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), getOpportunities);
router.get('/opportunities/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), getOpportunityById);
router.post('/opportunities', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), createOpportunity);
router.patch('/opportunities/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), updateOpportunity);
router.delete('/opportunities/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN']), deleteOpportunity);

export default router;
