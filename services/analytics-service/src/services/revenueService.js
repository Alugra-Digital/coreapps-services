import { db } from '../../../shared/db/index.js';
import { sql } from 'drizzle-orm';

export const getRevenueAnalytics = async (period = 'monthly', year, month) => {
    try {
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || (new Date().getMonth() + 1);

        let result;
        if (period === 'daily') {
            result = await db.execute(sql`
              SELECT 
                DATE(created_at) as period,
                COUNT(*)::int as invoice_count,
                COALESCE(SUM(grand_total), 0)::float as total_revenue,
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN grand_total ELSE 0 END), 0)::float as paid_revenue,
                COALESCE(SUM(CASE WHEN status != 'PAID' THEN grand_total ELSE 0 END), 0)::float as outstanding_revenue
              FROM invoices
              WHERE EXTRACT(YEAR FROM created_at) = ${currentYear}
                ${month ? sql`AND EXTRACT(MONTH FROM created_at) = ${currentMonth}` : sql``}
              GROUP BY DATE(created_at)
              ORDER BY period DESC
              LIMIT 12
            `);
        } else if (period === 'monthly') {
            result = await db.execute(sql`
              SELECT 
                (EXTRACT(MONTH FROM created_at)::text || ',' || EXTRACT(YEAR FROM created_at)::text) as period,
                COUNT(*)::int as invoice_count,
                COALESCE(SUM(grand_total), 0)::float as total_revenue,
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN grand_total ELSE 0 END), 0)::float as paid_revenue,
                COALESCE(SUM(CASE WHEN status != 'PAID' THEN grand_total ELSE 0 END), 0)::float as outstanding_revenue
              FROM invoices
              WHERE EXTRACT(YEAR FROM created_at) = ${currentYear}
              GROUP BY EXTRACT(MONTH FROM created_at), EXTRACT(YEAR FROM created_at)
              ORDER BY EXTRACT(MONTH FROM created_at) DESC, EXTRACT(YEAR FROM created_at) DESC
              LIMIT 12
            `);
        } else {
            result = await db.execute(sql`
              SELECT 
                EXTRACT(YEAR FROM created_at)::text as period,
                COUNT(*)::int as invoice_count,
                COALESCE(SUM(grand_total), 0)::float as total_revenue,
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN grand_total ELSE 0 END), 0)::float as paid_revenue,
                COALESCE(SUM(CASE WHEN status != 'PAID' THEN grand_total ELSE 0 END), 0)::float as outstanding_revenue
              FROM invoices
              GROUP BY EXTRACT(YEAR FROM created_at)
              ORDER BY period DESC
              LIMIT 12
            `);
        }

        return {
            period,
            year: currentYear,
            month: period === 'daily' ? currentMonth : null,
            data: result.rows.map(row => ({
                period: row.period,
                invoiceCount: parseInt(row.invoice_count || 0),
                totalRevenue: parseFloat(row.total_revenue || 0),
                paidRevenue: parseFloat(row.paid_revenue || 0),
                outstandingRevenue: parseFloat(row.outstanding_revenue || 0)
            }))
        };
    } catch (error) {
        console.error('Revenue analytics error:', error);
        throw error;
    }
};
