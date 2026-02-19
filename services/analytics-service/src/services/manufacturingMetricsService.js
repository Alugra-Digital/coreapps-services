import { db } from '../../../shared/db/index.js';
import { sql } from 'drizzle-orm';

export const getManufacturingMetrics = async () => {
    try {
        // Work order metrics
        const woResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_work_orders,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_count,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN CAST(qty_to_produce AS DECIMAL) ELSE 0 END), 0) as total_produced
      FROM work_orders
      WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

        // BOM metrics
        const bomResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_boms,
        COALESCE(AVG(CAST(total_cost AS DECIMAL)), 0) as avg_bom_cost
      FROM boms
    `);

        // Job card metrics (if exists)
        const jobCardResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_job_cards,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_job_cards
      FROM job_cards
      WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

        const wo = woResult.rows[0] || {};
        const bom = bomResult.rows[0] || {};
        const jobCard = jobCardResult.rows[0] || {};

        const productionEfficiency = wo.total_work_orders > 0
            ? ((wo.completed_count / wo.total_work_orders) * 100).toFixed(2)
            : 0;

        return {
            workOrders: {
                total: parseInt(wo.total_work_orders || 0),
                draft: parseInt(wo.draft_count || 0),
                inProgress: parseInt(wo.in_progress_count || 0),
                completed: parseInt(wo.completed_count || 0),
                cancelled: parseInt(wo.cancelled_count || 0),
                totalProduced: parseFloat(wo.total_produced || 0)
            },
            boms: {
                total: parseInt(bom.total_boms || 0),
                avgCost: parseFloat(bom.avg_bom_cost || 0)
            },
            jobCards: {
                total: parseInt(jobCard.total_job_cards || 0),
                completed: parseInt(jobCard.completed_job_cards || 0)
            },
            efficiency: {
                productionEfficiency: parseFloat(productionEfficiency)
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Manufacturing metrics error:', error);
        throw error;
    }
};
