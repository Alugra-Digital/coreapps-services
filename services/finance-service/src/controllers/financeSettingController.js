import { db } from '../../../shared/db/index.js';
import { financeSettings } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const getAll = async (req, res) => {
  try {
    const settings = await db.select().from(financeSettings);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

export const getByKey = async (req, res) => {
  try {
    const [setting] = await db.select().from(financeSettings).where(eq(financeSettings.key, req.params.key));
    if (!setting) return res.status(404).json({ message: 'Setting not found', code: 'NOT_FOUND' });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};

const upsertSchema = z.object({
  value: z.string().min(1),
  description: z.string().optional(),
});

export const upsert = async (req, res) => {
  try {
    const { value, description } = upsertSchema.parse(req.body);
    const userId = req.user?.id ?? null;
    const [setting] = await db
      .insert(financeSettings)
      .values({ key: req.params.key, value, description, updatedBy: userId })
      .onConflictDoUpdate({
        target: financeSettings.key,
        set: { value, description, updatedAt: new Date(), updatedBy: userId },
      })
      .returning();
    res.json(setting);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', errors: error.errors });
    }
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};
