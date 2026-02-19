import { db } from '../../../shared/db/index.js';
import {
    workflowDefinitions,
    workflowInstances,
    workflowTransitions,
    workflowStates,
    workflowLogs,
    users
} from '../../../shared/db/schema.js';
import { eq, and } from 'drizzle-orm';
import * as activityService from './activityService.js';

export class WorkflowEngine {
    constructor() {
        this.db = db;
    }

    // Get workflow definition with states and transitions
    async getWorkflow(workflowId) {
        const [definition] = await this.db.select().from(workflowDefinitions).where(eq(workflowDefinitions.id, workflowId));
        if (!definition) throw new Error('Workflow definition not found');

        const states = await this.db.select().from(workflowStates).where(eq(workflowStates.workflowId, workflowId));
        const transitions = await this.db.select().from(workflowTransitions).where(eq(workflowTransitions.workflowId, workflowId));

        return { ...definition, states, transitions };
    }

    // Initialize workflow for a document
    async initiate(workflowId, documentType, documentId, requesterId) {
        const workflow = await this.getWorkflow(workflowId);
        const initialState = workflow.states.find(s => s.isInitial);
        if (!initialState) throw new Error('Initial state not defined for this workflow');

        const [instance] = await this.db.insert(workflowInstances).values({
            workflowId,
            resourceId: documentId, // Assuming numeric ID for now, adjust if UUID used elsewhere
            currentStateId: initialState.id, // We'll need to update schema to use currentStateId or keep name
            status: 'PENDING',
            requesterId: requesterId,
        }).returning();

        // Log activity
        await activityService.logActivity(documentType, documentId, requesterId, 'WORKFLOW_INITIATED',
            `Workflow "${workflow.name}" started`);

        return instance;
    }

    // Execute transition
    async executeTransition(instanceId, actionName, userId, comment = null) {
        const [instance] = await this.db.select().from(workflowInstances).where(eq(workflowInstances.id, instanceId));
        if (!instance) throw new Error('Workflow instance not found');

        const workflow = await this.getWorkflow(instance.workflowId);

        // Find the current state based on name (if we kept name in instance) or ID
        // The current schema uses 'current_step_id'. For the new engine, 
        // we should ideally use 'current_state' name or ID.
        // Let's assume we use 'currentState' as a name in the instance for simplicity 
        // or update the schema to support state machine.

        // For now, let's find the current state from workflow.states
        const currentState = workflow.states.find(s => s.id === instance.currentStepId);

        const transition = workflow.transitions.find(t =>
            t.fromState === currentState.stateName && t.actionName === actionName
        );

        if (!transition) throw new Error(`Invalid action "${actionName}" for state "${currentState.stateName}"`);

        // Validate permissions
        const [user] = await this.db.select().from(users).where(eq(users.id, userId));
        const hasRole = transition.allowedRoles.includes(user.role) || user.role === 'SUPER_ADMIN';
        const hasUser = transition.allowedUsers.includes(userId);

        if (!hasRole && !hasUser) {
            throw new Error('User not authorized for this action');
        }

        // Update instance
        const nextState = workflow.states.find(s => s.stateName === transition.toState);
        const isFinal = nextState.isFinal;

        await this.db.update(workflowInstances)
            .set({
                currentStepId: nextState.id,
                status: isFinal ? 'APPROVED' : 'PENDING', // Basic mapping to statusEnum
                updatedAt: new Date()
            })
            .where(eq(workflowInstances.id, instanceId));

        // Log workflow log
        await this.db.insert(workflowLogs).values({
            instanceId,
            stepId: nextState.id,
            userId,
            action: actionName,
            comment
        });

        // Log activity timeline
        await activityService.logActivity(instance.resourceType || 'DOCUMENT', instance.resourceId, userId,
            actionName.toUpperCase(), comment || `Workflow moved to ${nextState.stateName}`);

        return { success: true, newState: nextState.stateName, isFinal };
    }
}
