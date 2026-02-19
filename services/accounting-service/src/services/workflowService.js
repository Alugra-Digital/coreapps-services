import { db } from '../../../shared/db/index.js';
import { 
  workflowDefinitions, 
  workflowSteps, 
  workflowInstances, 
  workflowLogs,
  users 
} from '../../../shared/db/schema.js';
import { eq, and, asc } from 'drizzle-orm';

export const initiateWorkflow = async (workflowName, resourceId, resourceType, userId) => {
  const [definition] = await db.select()
    .from(workflowDefinitions)
    .where(and(
      eq(workflowDefinitions.name, workflowName),
      eq(workflowDefinitions.resourceType, resourceType)
    ));

  if (!definition) throw new Error('Workflow definition not found');

  const steps = await db.select()
    .from(workflowSteps)
    .where(eq(workflowSteps.workflowId, definition.id))
    .orderBy(asc(workflowSteps.stepOrder));

  if (steps.length === 0) throw new Error('Workflow has no steps');

  const firstStep = steps[0];

  const [instance] = await db.insert(workflowInstances).values({
    workflowId: definition.id,
    resourceId,
    currentStepId: firstStep.id,
    status: 'PENDING',
    requesterId: userId,
  }).returning();

  await db.insert(workflowLogs).values({
    instanceId: instance.id,
    userId,
    action: 'INITIATE',
    comment: 'Workflow initiated',
  });

  return instance;
};

export const approveWorkflowStep = async (instanceId, userId, comment) => {
  const [instance] = await db.select().from(workflowInstances).where(eq(workflowInstances.id, instanceId));
  if (!instance) throw new Error('Instance not found');

  if (instance.status !== 'PENDING') throw new Error('Workflow is not pending');

  const [currentStep] = await db.select().from(workflowSteps).where(eq(workflowSteps.id, instance.currentStepId));
  
  // Verify user role
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (user.role !== currentStep.approverRole && user.role !== 'SUPER_ADMIN') {
    throw new Error('Insufficient permissions to approve this step');
  }

  // Log approval
  await db.insert(workflowLogs).values({
    instanceId,
    stepId: currentStep.id,
    userId,
    action: 'APPROVE',
    comment,
  });

  // Find next step
  const [nextStep] = await db.select()
    .from(workflowSteps)
    .where(and(
      eq(workflowSteps.workflowId, instance.workflowId),
      eq(workflowSteps.stepOrder, currentStep.stepOrder + 1)
    ));

  if (nextStep) {
    await db.update(workflowInstances)
      .set({ currentStepId: nextStep.id, updatedAt: new Date() })
      .where(eq(workflowInstances.id, instanceId));
    return { status: 'PENDING', nextStep };
  } else {
    // Workflow complete
    await db.update(workflowInstances)
      .set({ currentStepId: null, status: 'APPROVED', updatedAt: new Date() })
      .where(eq(workflowInstances.id, instanceId));
    return { status: 'APPROVED' };
  }
};

export const rejectWorkflowStep = async (instanceId, userId, comment) => {
  const [instance] = await db.select().from(workflowInstances).where(eq(workflowInstances.id, instanceId));
  if (!instance) throw new Error('Instance not found');

  if (instance.status !== 'PENDING') throw new Error('Workflow is not pending');
  
  // Ideally verify role here too, but rejection might be allowed by requester? 
  // For now, enforce approver role.
  const [currentStep] = await db.select().from(workflowSteps).where(eq(workflowSteps.id, instance.currentStepId));
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (user.role !== currentStep.approverRole && user.role !== 'SUPER_ADMIN') {
     throw new Error('Insufficient permissions to reject this step');
  }

  await db.insert(workflowLogs).values({
    instanceId,
    stepId: instance.currentStepId,
    userId,
    action: 'REJECT',
    comment,
  });

  await db.update(workflowInstances)
    .set({ status: 'REJECTED', updatedAt: new Date() })
    .where(eq(workflowInstances.id, instanceId));

  return { status: 'REJECTED' };
};

export const getWorkflowHistory = async (instanceId) => {
  return await db.select({
      action: workflowLogs.action,
      comment: workflowLogs.comment,
      timestamp: workflowLogs.timestamp,
      username: users.username,
      role: users.role,
      stepName: workflowSteps.name
  })
  .from(workflowLogs)
  .leftJoin(users, eq(workflowLogs.userId, users.id))
  .leftJoin(workflowSteps, eq(workflowLogs.stepId, workflowSteps.id))
  .where(eq(workflowLogs.instanceId, instanceId))
  .orderBy(asc(workflowLogs.timestamp));
};
