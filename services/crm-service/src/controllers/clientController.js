import { db } from '../../../shared/db/index.js';
import { clients, auditLogs } from '../../../shared/db/schema.js';
import { eq, ilike, desc } from 'drizzle-orm';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

const logAudit = async (req, actionType, targetId, oldValue, newValue) => {
  await db.insert(auditLogs).values({
    userId: req.user.id,
    actionType,
    targetTable: 'clients',
    targetId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
};

export const getClients = async (req, res) => {
  try {
    const search = req.query.search || '';
    const whereClause = search ? ilike(clients.name, `%${search}%`) : undefined;
    
    const data = await db.select().from(clients).where(whereClause).orderBy(desc(clients.createdAt));
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};

export const createClient = async (req, res) => {
  try {
    const validatedData = clientSchema.parse(req.body);
    const [newClient] = await db.insert(clients).values(validatedData).returning();
    
    await logAudit(req, 'CREATE', newClient.id, null, newClient);
    
    res.status(201).json(newClient);
  } catch (error) {
    res.status(400).json({ message: error.errors || error.message, code: 'VALIDATION_ERROR' });
  }
};

export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = clientSchema.partial().parse(req.body);
    
    const [existing] = await db.select().from(clients).where(eq(clients.id, id));
    if (!existing) return res.status(404).json({ message: 'Client not found', code: 'NOT_FOUND' });
    
    const [updatedClient] = await db.update(clients)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
      
    await logAudit(req, 'UPDATE', updatedClient.id, existing, updatedClient);
    
    res.json(updatedClient);
  } catch (error) {
    res.status(400).json({ message: error.errors || error.message, code: 'VALIDATION_ERROR' });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(clients).where(eq(clients.id, id));
    if (!existing) return res.status(404).json({ message: 'Client not found', code: 'NOT_FOUND' });
    
    await db.delete(clients).where(eq(clients.id, id));
    
    await logAudit(req, 'DELETE', existing.id, existing, null);
    
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
