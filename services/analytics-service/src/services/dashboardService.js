import { db } from '../../../shared/db/index.js';
import { sql, eq } from 'drizzle-orm';
import {
  invoices,
  employees,
  workOrders,
  products,
  projects,
  purchaseOrders,
  proposalPenawaran,
  basts,
  taxTypes,
} from '../../../shared/db/schema.js';

const safeCount = async (table, where) => {
  try {
    const rows = where ? await db.select().from(table).where(where) : await db.select().from(table);
    return rows;
  } catch {
    return [];
  }
};

export const getCompleteDashboard = async () => {
  try {
    const [
      projectsRows,
      invoicesRows,
      posRows,
      proposalsRows,
      bastsRows,
      employeesRows,
      taxTypesRows,
    ] = await Promise.all([
      safeCount(projects),
      safeCount(invoices),
      safeCount(purchaseOrders),
      safeCount(proposalPenawaran),
      safeCount(basts),
      safeCount(employees),
      safeCount(taxTypes, eq(taxTypes.isActive, true)),
    ]);

    const projectStats = {
      total: projectsRows.length,
      onProgress: projectsRows.filter((p) => (p.identity?.status ?? '') === 'on_progress').length,
      completed: projectsRows.filter((p) => (p.identity?.status ?? '') === 'completed').length,
      cancelled: projectsRows.filter((p) => (p.identity?.status ?? '') === 'cancelled').length,
    };

    const totalRevenue = invoicesRows.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);

    const proposalStats = {
      total: proposalsRows.length,
      draft: proposalsRows.filter((p) => (p.status ?? '') === 'draft').length,
      sent: proposalsRows.filter((p) => (p.status ?? '') === 'sent').length,
      accepted: proposalsRows.filter((p) => (p.status ?? '') === 'accepted').length,
      rejected: proposalsRows.filter((p) => (p.status ?? '') === 'rejected').length,
    };

    const recentActivities = [
      ...invoicesRows.slice(0, 5).map((inv) => ({
        id: `inv-INV-${inv.id}`,
        type: 'Invoice Created',
        details: `${inv.number} for client`,
        timestamp: inv.createdAt?.toISOString?.() ?? new Date().toISOString(),
        entityType: 'invoice',
      })),
      ...posRows.slice(0, 3).map((po) => ({
        id: `po-PO-${po.id}`,
        type: 'PO Added',
        details: `${po.number} - ${po.supplierName}`,
        timestamp: po.createdAt?.toISOString?.() ?? new Date().toISOString(),
        entityType: 'purchase_order',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    const activeProjects = projectsRows
      .filter((p) => (p.identity?.status ?? '') === 'on_progress')
      .slice(0, 5)
      .map((p) => ({
        id: `PRJ-${p.id}`,
        identity: p.identity ?? {},
        finance: p.finance ?? {},
      }));

    const revenueByProject = projectsRows.map((p) => ({
      projectId: `PRJ-${p.id}`,
      projectName: p.identity?.namaProject ?? p.identity?.projectId ?? '-',
      income: parseFloat(p.finance?.income ?? 0),
    }));

    return {
      metrics: {
        projects: projectStats,
        invoices: { count: invoicesRows.length, totalRevenue },
        purchaseOrders: { count: posRows.length },
        proposals: proposalStats,
        basts: { count: bastsRows.length },
        employees: { count: employeesRows.length },
        taxTypes: { count: taxTypesRows.length },
      },
      recentActivities,
      activeProjects,
      revenueByProject,
    };
  } catch (error) {
    console.error('Dashboard service error:', error);
    throw error;
  }
};
