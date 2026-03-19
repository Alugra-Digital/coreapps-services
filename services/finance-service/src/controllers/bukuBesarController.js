import * as bukuBesarService from '../services/bukuBesarService.js';
import * as voucherService from '../services/voucherService.js';
import * as periodService from '../services/accountingPeriodService.js';

/**
 * Get Buku Besar entries
 * Query params: periodId, accountNumber (optional)
 */
export const getList = async (req, res) => {
  try {
    const { periodId, month, year, accountNumber } = req.query;

    let resolvedPeriodId = periodId ? Number(periodId) : null;

    if (!resolvedPeriodId && month && year) {
      const period = await periodService.getPeriodByYearMonth(Number(year), Number(month));
      resolvedPeriodId = period?.id ?? null;
    }

    if (!resolvedPeriodId) {
      return res.status(400).json({
        message: 'periodId or month+year query param required',
        code: 'VALIDATION_ERROR',
      });
    }

    const options = {};
    if (accountNumber) {
      options.accountNumber = accountNumber;
    }

    const [entries, summary] = await Promise.all([
      bukuBesarService.getByPeriod(resolvedPeriodId, options),
      accountNumber ? null : bukuBesarService.getPeriodSummary(resolvedPeriodId),
    ]);

    res.json({
      periodId: resolvedPeriodId,
      accountNumber,
      entries,
      summary,
    });
  } catch (error) {
    console.error('Error getting Buku Besar entries:', error);
    res.status(500).json({
      message: error.message,
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Get Buku Besar entries for a specific account in a period
 */
export const getByAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { periodId, month, year } = req.query;

    let resolvedPeriodId = periodId ? Number(periodId) : null;

    if (!resolvedPeriodId && month && year) {
      const period = await periodService.getPeriodByYearMonth(Number(year), Number(month));
      resolvedPeriodId = period?.id ?? null;
    }

    if (!resolvedPeriodId) {
      return res.status(400).json({
        message: 'periodId or month+year query param required',
        code: 'VALIDATION_ERROR',
      });
    }

    const entries = await bukuBesarService.getByPeriodAndAccount(
      resolvedPeriodId,
      accountNumber
    );

    res.json({
      periodId: resolvedPeriodId,
      accountNumber,
      entries,
    });
  } catch (error) {
    console.error('Error getting Buku Besar entries for account:', error);
    res.status(500).json({
      message: error.message,
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Post a voucher to Buku Besar
 * This can be called manually or is triggered automatically on voucher approval
 */
export const postFromVoucher = async (req, res) => {
  try {
    const voucherId = Number(req.params.voucherId);

    // Get the voucher
    const voucher = await voucherService.getById(voucherId);
    if (!voucher) {
      return res.status(404).json({
        message: 'Voucher not found',
        code: 'NOT_FOUND',
      });
    }

    // Only approved vouchers can be posted to Buku Besar
    if (voucher.status !== 'APPROVED') {
      return res.status(400).json({
        message: 'Only APPROVED vouchers can be posted to Buku Besar',
        code: 'INVALID_STATUS',
      });
    }

    // Post to Buku Besar
    await bukuBesarService.postFromVoucher(voucher);

    res.json({
      message: 'Voucher posted to Buku Besar successfully',
      voucherId,
      voucherNumber: voucher.voucherNumber,
    });
  } catch (error) {
    console.error('Error posting voucher to Buku Besar:', error);
    res.status(500).json({
      message: error.message,
      code: 'INTERNAL_ERROR',
    });
  }
};
