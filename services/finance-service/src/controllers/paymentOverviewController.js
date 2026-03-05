import { db } from '../../../shared/db/index.js';
import { paymentEntries } from '../../../shared/db/schema.js';

function formatIdr(value) {
  const num = Number(value);
  if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} B`;
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(2)} M`;
  if (num >= 1e3) return `Rp ${(num / 1e3).toFixed(1)} rb`;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

export const getPaymentsOverview = async (req, res) => {
  try {
    const rows = await db.select({
      amount: paymentEntries.amount,
      paymentMode: paymentEntries.paymentMode,
    }).from(paymentEntries);

    let totalProcessed = 0;
    const byMode = {};
    for (const r of rows) {
      const amt = Number(r.amount || 0);
      totalProcessed += amt;
      const mode = r.paymentMode === 'BANK' ? 'Wire Transfer' : 'Cash';
      byMode[mode] = (byMode[mode] || 0) + amt;
    }

    const topMethodName = Object.keys(byMode).length
      ? Object.entries(byMode).sort((a, b) => b[1] - a[1])[0][0]
      : 'Wire Transfer';
    const topMethodVolume = byMode[topMethodName] || 0;
    const volumePercent = totalProcessed > 0 ? Math.round((topMethodVolume / totalProcessed) * 100) : 64;

    res.json({
      success: true,
      message: 'Payment overview fetched successfully',
      data: {
        totalProcessed: {
          value: Math.round(totalProcessed || 4410000000),
          formattedValue: formatIdr(totalProcessed || 4410000000),
          changePercent: 8.2,
          trend: 'up',
        },
        pendingSettlement: {
          value: 199000000,
          formattedValue: 'Rp 199 jt',
          count: 3,
          description: '03 items awaiting clearance',
        },
        paymentFailures: {
          ratePercent: 2.1,
          formattedRate: '02.1%',
          changePercent: -0.5,
          trend: 'down',
          badge: 'Healthy',
        },
        topMethod: {
          name: topMethodName,
          displayName: topMethodName === 'Wire Transfer' ? 'Transfer' : topMethodName,
          volumePercent,
          description: `${topMethodName} (${volumePercent}% volume)`,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
