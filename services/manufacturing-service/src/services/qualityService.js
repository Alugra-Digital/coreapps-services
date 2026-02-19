import { db } from '../../../shared/db/index.js';
import { qualityInspections, workOrders } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

export const createInspection = async (data) => {
    return await db.insert(qualityInspections).values(data).returning();
};

export const updateInspectionStatus = async (id, status, findings) => {
    return await db.update(qualityInspections)
        .set({ status, findings, updatedAt: new Date() }) // Note: schema might need updatedAt for QI, let's assume it has it or just update.
        .where(eq(qualityInspections.id, id))
        .returning();
};
