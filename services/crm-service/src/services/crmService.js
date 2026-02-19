import { db } from '../../../shared/db/index.js';
import { leads, opportunities, clients } from '../../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';

// Leads
export const getLeads = async () => {
  return await db.select().from(leads).orderBy(desc(leads.createdAt));
};

export const getLeadById = async (id) => {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  return lead;
};

export const createLead = async (data) => {
  const [lead] = await db.insert(leads).values(data).returning();
  return lead;
};

export const updateLead = async (id, data) => {
  const [lead] = await db.update(leads).set(data).where(eq(leads.id, id)).returning();
  return lead;
};

export const deleteLead = async (id) => {
  await db.delete(leads).where(eq(leads.id, id));
};

// Opportunities
export const getOpportunities = async () => {
  return await db.select({
    id: opportunities.id,
    name: opportunities.name,
    amount: opportunities.amount,
    probability: opportunities.probability,
    stage: opportunities.stage,
    expectedCloseDate: opportunities.expectedCloseDate,
    leadName: leads.name,
    clientName: clients.name,
    createdAt: opportunities.createdAt
  })
  .from(opportunities)
  .leftJoin(leads, eq(opportunities.leadId, leads.id))
  .leftJoin(clients, eq(opportunities.clientId, clients.id))
  .orderBy(desc(opportunities.createdAt));
};

export const getOpportunityById = async (id) => {
  const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, id));
  return opp;
};

export const createOpportunity = async (data) => {
  const [opp] = await db.insert(opportunities).values(data).returning();
  return opp;
};

export const updateOpportunity = async (id, data) => {
  const [opp] = await db.update(opportunities).set(data).where(eq(opportunities.id, id)).returning();
  return opp;
};

export const deleteOpportunity = async (id) => {
  await db.delete(opportunities).where(eq(opportunities.id, id));
};
