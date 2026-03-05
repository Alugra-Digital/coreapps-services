import { db } from '../../../shared/db/index.js';
import { organizationSettings, salesTargets } from '../../../shared/db/schema.js';
import { sql, eq, and } from 'drizzle-orm';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEAL_CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

const STAGE_MAP = {
  draft: 'Proposal',
  sent: 'Negotiation',
  accepted: 'Closed Won',
};

const PROBABILITY_MAP = {
  draft: 30,
  sent: 66,
  accepted: 100,
};

/**
 * Get sales data from invoices, proposal_penawaran, and finance_transactions.
 */
export const getSalesData = async () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Current quarter boundaries
  const quarterStartMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1;
  const quarterEndMonth = quarterStartMonth + 2;
  const quarterStart = `${currentYear}-${String(quarterStartMonth).padStart(2, '0')}-01`;
  const quarterEnd = new Date(currentYear, quarterEndMonth, 0);
  const quarterEndStr = quarterEnd.toISOString().slice(0, 10);

  // Last 6 months for performance data
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const perfFrom = sixMonthsAgo.toISOString().slice(0, 10);

  const [
    perfResult,
    dealsByCatResult,
    recentProposalsResult,
    quarterRevenueResult,
    paidInvoicesResult,
    invoicesCountResult,
    proposalsCountResult,
    settingsResult,
  ] = await Promise.all([
    db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM COALESCE(date, created_at))::int as month_num,
        EXTRACT(YEAR FROM COALESCE(date, created_at))::int as year_num,
        COALESCE(SUM(grand_total), 0)::float as revenue
      FROM invoices
      WHERE COALESCE(date, created_at) >= ${perfFrom}::timestamp
      GROUP BY EXTRACT(MONTH FROM COALESCE(date, created_at)), EXTRACT(YEAR FROM COALESCE(date, created_at))
      ORDER BY year_num, month_num
      LIMIT 6
    `),
    db.execute(sql`
      SELECT category as name, SUM(amount)::float as total
      FROM finance_transactions
      WHERE type = 'outbound'
        AND date >= ${perfFrom}
      GROUP BY category
      ORDER BY total DESC
    `),
    db.execute(sql`
      SELECT id, client_info, total_estimated_cost, status, created_at
      FROM proposal_penawaran
      WHERE LOWER(COALESCE(status, 'draft')) IN ('draft', 'sent', 'accepted')
      ORDER BY created_at DESC
      LIMIT 5
    `),
    db.execute(sql`
      SELECT COALESCE(SUM(grand_total), 0)::float as total_revenue
      FROM invoices
      WHERE COALESCE(date, created_at) >= ${quarterStart}::timestamp
        AND COALESCE(date, created_at) <= ${quarterEndStr}::timestamp
    `),
    db.execute(sql`
      SELECT COALESCE(AVG(grand_total), 0)::float as avg_deal
      FROM invoices
      WHERE status = 'PAID'
        AND COALESCE(date, created_at) >= ${quarterStart}::timestamp
        AND COALESCE(date, created_at) <= ${quarterEndStr}::timestamp
    `),
    db.execute(sql`
      SELECT COUNT(*)::int as cnt
      FROM invoices
      WHERE COALESCE(date, created_at) >= ${quarterStart}::timestamp
        AND COALESCE(date, created_at) <= ${quarterEndStr}::timestamp
    `),
    db.execute(sql`
      SELECT COUNT(*)::int as cnt
      FROM proposal_penawaran
      WHERE LOWER(COALESCE(status, 'draft')) IN ('draft', 'sent', 'accepted')
        AND created_at >= ${quarterStart}::timestamp
        AND created_at <= ${quarterEndStr}::timestamp
    `),
    db.select({ config: organizationSettings.config })
      .from(organizationSettings)
      .limit(1),
  ]);

  const perfRows = perfResult.rows || [];
  const dealsByCatRows = dealsByCatResult.rows || [];
  const recentProposals = recentProposalsResult.rows || [];
  const quarterRevenue = Number((quarterRevenueResult.rows?.[0]?.total_revenue) ?? 0);
  const avgDealSize = Number((paidInvoicesResult.rows?.[0]?.avg_deal) ?? 0);
  const invoicesCount = Number((invoicesCountResult.rows?.[0]?.cnt) ?? 0);
  const proposalsCount = Number((proposalsCountResult.rows?.[0]?.cnt) ?? 0);

  const config = settingsResult[0]?.config || {};
  const quarterlyTarget = config.quarterly_target != null
    ? Number(config.quarterly_target)
    : null;
  const targetPercent = quarterlyTarget != null && quarterlyTarget > 0
    ? Math.round((quarterRevenue / quarterlyTarget) * 100)
    : null;
  const conversion = proposalsCount > 0
    ? Math.round((invoicesCount / proposalsCount) * 1000) / 10
    : 0;

  const performanceData = perfRows.map((row) => ({
    month: MONTH_NAMES[(Number(row.month_num) || 1) - 1] || String(row.month_num),
    revenue: Math.round(Number(row.revenue || 0)),
    target: quarterlyTarget != null ? Math.round(quarterlyTarget / 3) : null,
  }));

  const totalOutbound = dealsByCatRows.reduce((s, r) => s + Number(r.total || 0), 0);
  const dealsByCategory = dealsByCatRows.map((row, idx) => ({
    name: row.name || 'Other',
    value: totalOutbound > 0 ? Math.round((Number(row.total || 0) / totalOutbound) * 100) : 0,
    color: DEAL_CATEGORY_COLORS[idx % DEAL_CATEGORY_COLORS.length],
  }));

  const recentDeals = recentProposals.map((p) => {
    const clientInfo = typeof p.client_info === 'object' ? p.client_info : {};
    const clientName = clientInfo?.name || clientInfo?.companyName || 'Unknown';
    const amount = Number(p.total_estimated_cost || 0);
    const status = (p.status || 'draft').toLowerCase();
    return {
      id: `D-${p.id}`,
      client: clientName,
      amount,
      stage: STAGE_MAP[status] || 'Proposal',
      probability: PROBABILITY_MAP[status] ?? 30,
    };
  });

  return {
    performanceData,
    dealsByCategory,
    recentDeals,
    totalRevenue: Math.round(quarterRevenue),
    quarterlyTarget,
    targetPercent,
    avgDealSize: Math.round(avgDealSize),
    conversion,
  };
};

/** Get sales for single employee (CoreApps 2.0) */
export const getSalesByEmployeeId = async (employeeId) => {
  const empResult = await db.execute(sql`
    SELECT id, name, department, position FROM employees WHERE id = ${employeeId} AND deleted_at IS NULL
  `);
  const emp = (empResult?.rows ?? [])[0];
  if (!emp) return null;
  const projResult = await db.execute(sql`
    SELECT
      p.id,
      p.identity,
      p.finance,
      (p.identity->>'status') as status
    FROM projects p
    WHERE (p.identity->>'picId') = ${String(employeeId)} OR (p.identity->>'projectManagerId') = ${String(employeeId)}
  `);
  const projects = (projResult?.rows ?? []) || [];
  const totalValue = projects.reduce((sum, p) => {
    const status = p?.status ?? (p?.identity && typeof p.identity === 'object' ? p.identity?.status : null);
    if (['WON', 'ON_PROGRESS', 'READY_TO_CLOSE', 'COMPLETED'].includes(status)) {
      const fin = p?.finance && typeof p.finance === 'object' ? p.finance : {};
      const val = Number(fin?.contractValue ?? fin?.income ?? 0);
      return sum + val;
    }
    return sum;
  }, 0);
  return {
    id: emp.id,
    name: emp.name,
    department: emp.department ?? null,
    position: emp.position ?? null,
    projectCount: projects.length,
    totalValue: Math.round(totalValue),
    projects: projects.map((p) => {
      const fin = p?.finance && typeof p.finance === 'object' ? p.finance : {};
      return {
        id: p.id,
        status: p?.status ?? (p?.identity && typeof p.identity === 'object' ? p.identity?.status : null) ?? null,
        contractValue: Number(fin?.contractValue ?? fin?.income ?? 0),
      };
    }),
  };
};

/** Get sales by employee (CoreApps 2.0) */
export const getSalesByEmployees = async () => {
  const result = await db.execute(sql`
    SELECT
      e.id,
      e.name,
      e.department,
      e.position,
      COUNT(DISTINCT p.id)::int as project_count,
      COALESCE(SUM(
        CASE WHEN (p.identity->>'status') IN ('WON', 'ON_PROGRESS', 'READY_TO_CLOSE', 'COMPLETED') THEN
          COALESCE((p.finance->>'contractValue')::numeric, (p.finance->>'income')::numeric, 0)
        ELSE 0 END
      ), 0)::float as total_value
    FROM employees e
    LEFT JOIN projects p ON (p.identity->>'picId') = e.id::text OR (p.identity->>'projectManagerId') = e.id::text
    WHERE e.deleted_at IS NULL
    GROUP BY e.id, e.name, e.department, e.position
    ORDER BY total_value DESC
  `);
  return (result?.rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    department: r.department ?? null,
    position: r.position ?? null,
    projectCount: Number(r.project_count ?? 0),
    totalValue: Math.round(Number(r.total_value ?? 0)),
  }));
};

/** Get sales funnel (CoreApps 2.0) */
export const getSalesFunnel = async () => {
  const funnelResult = await db.execute(sql`
    SELECT
      COALESCE(identity->>'status', 'PIPELINE') as status,
      COUNT(*)::int as count,
      COALESCE(SUM(COALESCE((finance->>'contractValue')::numeric, (finance->>'income')::numeric, 0)), 0)::float as value
    FROM projects
    WHERE (identity->>'status') IS NOT NULL OR identity IS NOT NULL
    GROUP BY COALESCE(identity->>'status', 'PIPELINE')
  `);
  const rows = funnelResult?.rows ?? [];
  return rows.map((r) => ({
    status: r.status ?? 'PIPELINE',
    count: Number(r.count ?? 0),
    value: Math.round(Number(r.value ?? 0)),
  }));
};

/** Get sales targets (CoreApps 2.0) */
export const getSalesTargets = async () => {
  const rows = await db.select().from(salesTargets).orderBy(salesTargets.year, salesTargets.quarter);
  return rows.map((r) => ({
    id: r.id,
    year: r.year,
    quarter: r.quarter,
    targetAmount: Number(r.targetAmount ?? 0),
    currency: r.currency ?? 'IDR',
    setAt: r.setAt?.toISOString?.() ?? null,
    notes: r.notes ?? null,
  }));
};

/** Set sales target for quarter (CoreApps 2.0) */
export const setSalesTarget = async (year, quarter, targetAmount, setBy) => {
  const existing = await db.select().from(salesTargets).where(
    and(eq(salesTargets.year, year), eq(salesTargets.quarter, quarter))
  ).limit(1);
  const val = { targetAmount: String(targetAmount ?? 0), setBy: setBy ?? null, setAt: new Date() };
  if (existing.length > 0) {
    const [row] = await db.update(salesTargets).set(val).where(eq(salesTargets.id, existing[0].id)).returning();
    return row ? { id: row.id, year: row.year, quarter: row.quarter, targetAmount: Number(row.targetAmount ?? 0) } : null;
  }
  const [row] = await db.insert(salesTargets).values({ year, quarter, ...val }).returning();
  return row ? { id: row.id, year: row.year, quarter: row.quarter, targetAmount: Number(row.targetAmount ?? 0) } : null;
};
