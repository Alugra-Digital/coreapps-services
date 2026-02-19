import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { authorize } from '../../../shared/middleware/rbac.middleware.js';
import {
  createWorkflowDefinition,
  getWorkflowDefinitions,
  approveInstance,
  rejectInstance,
  executeAction,
  getTimeline
} from '../controllers/workflowController.js';

const router = express.Router();

router.post('/definitions', authenticate, authorize(['SUPER_ADMIN']), createWorkflowDefinition);
router.get('/definitions', authenticate, getWorkflowDefinitions);

// Instance actions
router.post('/instances/:id/approve', authenticate, approveInstance);
router.post('/instances/:id/reject', authenticate, rejectInstance);
router.post('/instances/:id/action', authenticate, executeAction);
router.get('/timeline/:docType/:docId', authenticate, getTimeline);

export default router;
