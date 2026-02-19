import { db } from '../../../shared/db/index.js';
import { assets, assetMaintenances } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

export const scheduleMaintenance = async (data) => {
    return await db.insert(assetMaintenances).values({
        ...data,
        scheduledDate: new Date(data.scheduledDate),
    }).returning();
};

export const completeMaintenance = async (id, cost, completionDate) => {
    return await db.update(assetMaintenances)
        .set({
            cost: cost.toString(),
            completionDate: new Date(completionDate),
            updatedAt: new Date() // Note: schema might not have updatedAt for maintenance, check if needed
        })
        .where(eq(assetMaintenances.id, id))
        .returning();
};

export const getMaintenanceHistory = async (assetId) => {
    return await db.select().from(assetMaintenances).where(eq(assetMaintenances.assetId, assetId));
};
