import { WorkflowEngine } from '../services/WorkflowEngine.js';
import * as activityService from '../services/activityService.js';
import { db } from '../../../shared/db/index.js';
import { workflowDefinitions, workflowSteps, workflowStates, workflowTransitions } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

const engine = new WorkflowEngine();

export const createWorkflowDefinition = async (req, res) => {
  try {
    const { name, resourceType, description, steps } = req.body;

    // steps: [{ name: 'Manager Approval', approverRole: 'HR_ADMIN', stepOrder: 1 }]

    const [def] = await db.insert(workflowDefinitions).values({
      name, resourceType, description
    }).returning();

    if (steps && steps.length > 0) {
      const stepsWithId = steps.map(s => ({
        ...s,
        workflowId: def.id
      }));
      await db.insert(workflowSteps).values(stepsWithId);
    }

    res.status(201).json(def);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const getWorkflowDefinitions = async (req, res) => {
  try {
    const defs = await db.select().from(workflowDefinitions);
    res.json(defs);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const approveInstance = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const result = await engine.executeTransition(parseInt(id), 'Approve', req.user.id, comment);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const rejectInstance = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const result = await engine.executeTransition(parseInt(id), 'Reject', req.user.id, comment);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const executeAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    const result = await engine.executeTransition(parseInt(id), action, req.user.id, comment);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
  }
};

export const getTimeline = async (req, res) => {
  try {
    const { docType, docId } = req.params;
    const timeline = await activityService.getActivityTimeline(docType, parseInt(docId));
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
