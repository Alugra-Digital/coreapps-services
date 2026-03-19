import * as service from '../services/neracaSaldoService.js';
import { z } from 'zod';

const generateSchema = z.object({
  periodId: z.number().int().positive(),
});

export const getNeracaSaldo = async (req, res) => {
  try {
    const { periodId } = req.query;
    if (!periodId) {
      return res.status(400).json({ message: 'periodId query param required', code: 'VALIDATION_ERROR' });
    }

    const entries = await service.generateNeracaSaldo(Number(periodId));

    res.json({ periodId: Number(periodId), entries });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};
