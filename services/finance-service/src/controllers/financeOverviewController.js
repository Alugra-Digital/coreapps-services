import { db } from '../../../shared/db/index.js';
import { invoices, financeTransactions, accounts } from '../../../shared/db/schema.js';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EXPENSE_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#94a3b8'];

function formatIdr(value) {
  const num = Number(value);
  if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} B`;
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(2)} M`;
  if (num >= 1e3) return `Rp ${(num / 1e3).toFixed(1)} rb`;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

function formatJt(value) {
  const num = Number(value);
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(1)} jt`;
  if (num >= 1e3) return `Rp ${(num / 1e3).toFixed(1)} rb`;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

function parseDate(str) {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export const getFinanceOverview = async (req, res) => {
  try {
    const fromStr = req.query.from || '2024-08-01';
    const toStr = req.query.to || '2024-12-31';
    const fromDate = parseDate(fromStr) || new Date('2024-08-01');
    const toDate = parseDate(toStr) || new Date('2024-12-31');

    const from = fromDate.toISOString().slice(0, 10);
    const to = toDate.toISOString().slice(0, 10);

    const periodDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) || 1;
    const prevToDate = new Date(fromDate);
    prevToDate.setDate(prevToDate.getDate() - 1);
    const prevFromDate = new Date(prevToDate);
    prevFromDate.setDate(prevFromDate.getDate() - periodDays);
    const prevFrom = prevFromDate.toISOString().slice(0, 10);
    const prevTo = prevToDate.toISOString().slice(0, 10);

    const [invoiceResult, prevInvoiceResult, txRows, accountRows, revenueGrowthResult, expenseBreakdownResult] = await Promise.all([
      db.execute(sql`
        SELECT grand_total as "grandTotal", paid_amount as "paidAmount"
        FROM invoices
        WHERE COALESCE(date, created_at) >= ${from}::timestamp
          AND COALESCE(date, created_at) <= ${to}::timestamp
      `),
      db.execute(sql`
        SELECT grand_total as "grandTotal"
        FROM invoices
        WHERE COALESCE(date, created_at) >= ${prevFrom}::timestamp
          AND COALESCE(date, created_at) <= ${prevTo}::timestamp
      `),
      db.select().from(financeTransactions)
        .where(and(
          gte(financeTransactions.date, from),
          lte(financeTransactions.date, to)
        ))
        .orderBy(desc(financeTransactions.date))
        .limit(10),
      db.select().from(accounts)
        .where(and(
          eq(accounts.type, 'ASSET'),
          eq(accounts.isGroup, false)
        )),
      db.execute(sql`
        SELECT
          EXTRACT(MONTH FROM COALESCE(i.date, i.created_at))::int as month_num,
          EXTRACT(YEAR FROM COALESCE(i.date, i.created_at))::int as year_num,
          COALESCE(SUM(i.grand_total), 0)::float as value
        FROM invoices i
        WHERE COALESCE(i.date, i.created_at) >= ${from}
          AND COALESCE(i.date, i.created_at) <= ${to}
        GROUP BY EXTRACT(MONTH FROM COALESCE(i.date, i.created_at)), EXTRACT(YEAR FROM COALESCE(i.date, i.created_at))
        ORDER BY year_num, month_num
        LIMIT 12
      `),
      db.execute(sql`
        SELECT category as name, SUM(amount)::float as total
        FROM finance_transactions
        WHERE type = 'outbound'
          AND date >= ${from}
          AND date <= ${to}
        GROUP BY category
        ORDER BY total DESC
      `),
    ]);

    const invoiceRows = invoiceResult.rows || [];
    const prevInvoiceRows = prevInvoiceResult.rows || [];

    let totalRevenue = 0;
    let totalPaid = 0;
    for (const inv of invoiceRows) {
      totalRevenue += Number(inv.grandTotal || 0);
      totalPaid += Number(inv.paidAmount || 0);
    }

    let prevTotalRevenue = 0;
    for (const inv of prevInvoiceRows) {
      prevTotalRevenue += Number(inv.grandTotal || 0);
    }

    let inboundSum = 0;
    let outboundSum = 0;
    const txRowsInPeriod = txRows;
    for (const tx of txRowsInPeriod) {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'inbound') inboundSum += amt;
      else outboundSum += amt;
    }

    const prevTxResult = await db.execute(sql`
      SELECT type, SUM(amount)::float as total
      FROM finance_transactions
      WHERE date >= ${prevFrom} AND date <= ${prevTo}
      GROUP BY type
    `);
    let prevOutboundSum = 0;
    for (const row of prevTxResult.rows || []) {
      if (row.type === 'outbound') prevOutboundSum = Number(row.total || 0);
    }

    const operationalExpenses = outboundSum || (totalRevenue > 0 ? totalRevenue * 0.29 : 0);
    const prevOperationalExpenses = prevOutboundSum || (prevTotalRevenue > 0 ? prevTotalRevenue * 0.29 : 0);
    const netProfit = totalRevenue - operationalExpenses;
    const prevNetProfit = prevTotalRevenue - prevOperationalExpenses;

    const revenueChange = prevTotalRevenue > 0
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
      : 0;
    const expensesChange = prevOperationalExpenses > 0
      ? ((operationalExpenses - prevOperationalExpenses) / prevOperationalExpenses) * 100
      : 0;
    const profitChange = prevNetProfit !== 0
      ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100
      : 0;

    const metrics = [
      {
        key: 'totalRevenue',
        title: 'Total Revenue',
        value: Math.round(totalRevenue),
        formattedValue: formatIdr(totalRevenue),
        changePercent: Math.round(revenueChange * 10) / 10,
        trend: revenueChange >= 0 ? 'up' : 'down',
      },
      {
        key: 'operationalExpenses',
        title: 'Operational Expenses',
        value: Math.round(operationalExpenses),
        formattedValue: formatIdr(operationalExpenses),
        changePercent: Math.round(expensesChange * 10) / 10,
        trend: expensesChange <= 0 ? 'down' : 'up',
      },
      {
        key: 'netProfit',
        title: 'Net Profit',
        value: Math.round(netProfit),
        formattedValue: formatIdr(netProfit),
        changePercent: Math.round(profitChange * 10) / 10,
        trend: profitChange >= 0 ? 'up' : 'down',
      },
    ];

    const revenueGrowth = (revenueGrowthResult.rows || []).map((row, idx, arr) => ({
      month: MONTH_NAMES[(Number(row.month_num) || 1) - 1] || String(row.month_num),
      value: Math.round(Number(row.value || 0)),
      active: idx === arr.length - 1,
    }));

    const accountBalances = accountRows.map((acc) => ({
      id: acc.id,
      name: acc.name,
      number: `${acc.name} • ${acc.code || ''}`,
      balance: Number(acc.balance || 0),
      formattedBalance: formatIdr(acc.balance || 0),
    }));

    const expenseRows = expenseBreakdownResult.rows || [];
    const totalOutbound = expenseRows.reduce((s, r) => s + Number(r.total || 0), 0);
    const expenseBreakdown = expenseRows.map((row, idx) => ({
      name: row.name || 'Other',
      value: totalOutbound > 0 ? Math.round((Number(row.total || 0) / totalOutbound) * 100) : 0,
      color: EXPENSE_COLORS[idx % EXPENSE_COLORS.length],
    }));

    const recentTransactions = txRowsInPeriod.slice(0, 5).map((tx) => ({
      id: tx.transactionId,
      date: tx.date,
      entity: tx.entity,
      category: tx.category,
      amount: Number(tx.amount),
      formattedAmount: formatJt(tx.amount),
      type: tx.type,
      status: tx.status,
    }));

    res.json({
      success: true,
      message: 'Finance overview fetched successfully',
      data: {
        metrics,
        revenueGrowth,
        accountBalances,
        expenseBreakdown,
        recentTransactions,
      },
      meta: { generatedAt: new Date().toISOString() },
    });
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
