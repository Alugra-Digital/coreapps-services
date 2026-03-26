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

    let result;
    try {
      result = await service.generateNeracaSaldo(Number(periodId));
    } catch (balanceError) {
      // Return imbalance as a warning, not a 500 error
      if (balanceError.message?.includes('Trial balance does not balance')) {
        return res.json({
          periodId: Number(periodId),
          entries: [],
          totalDebit: 0,
          totalCredit: 0,
          balanced: false,
          warning: balanceError.message,
        });
      }
      throw balanceError;
    }

    res.json({
      periodId: Number(periodId),
      entries: result.entries,
      totalDebit: result.totalDebit,
      totalCredit: result.totalCredit,
      balanced: result.balanced,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'INTERNAL_ERROR' });
  }
};
