import { db } from '../../../shared/db/index.js';
import { shifts, employees } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

export const createShift = async (data) => {
    return await db.insert(shifts).values(data).returning();
};

export const getShifts = async () => {
    return await db.select().from(shifts);
};

export const updateShift = async (id, data) => {
    return await db.update(shifts)
        .set({ ...data })
        .where(eq(shifts.id, id))
        .returning();
};
