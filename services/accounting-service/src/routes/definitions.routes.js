import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { authorize } from '../../../shared/middleware/rbac.middleware.js';
import {
  createWorkflowDefinition,
  getWorkflowDefinitions
} from '../controllers/workflowController.js';

const router = express.Router();

// Workflow Definitions (accessible at /api/accounting/definitions)
router.post('/', authenticate, authorize(['SUPER_ADMIN']), createWorkflowDefinition);
router.get('/', authenticate, getWorkflowDefinitions);

export default router;
