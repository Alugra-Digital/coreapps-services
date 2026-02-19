import { db } from '../../../shared/db/index.js';
import { sql } from 'drizzle-orm';

export const getInventoryMetrics = async () => {
    try {
        // Stock value and product metrics
        const stockResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(CAST(cost AS DECIMAL) * CAST(stock_quantity AS DECIMAL)), 0) as total_stock_value,
        COUNT(CASE WHEN CAST(stock_quantity AS DECIMAL) < 10 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN CAST(stock_quantity AS DECIMAL) = 0 THEN 1 END) as out_of_stock_count,
        COALESCE(AVG(CAST(stock_quantity AS DECIMAL)), 0) as avg_stock_quantity
      FROM products
    `);

        // Stock movement (current month)
        const movementResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_movements,
        COALESCE(SUM(CASE WHEN CAST(qty_change AS DECIMAL) > 0 THEN CAST(qty_change AS DECIMAL) ELSE 0 END), 0) as total_inbound,
        COALESCE(SUM(CASE WHEN CAST(qty_change AS DECIMAL) < 0 THEN ABS(CAST(qty_change AS DECIMAL)) ELSE 0 END), 0) as total_outbound
      FROM stock_ledger
      WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

        const stock = stockResult.rows[0] || {};
        const movement = movementResult.rows[0] || {};

        return {
            stock: {
                totalProducts: parseInt(stock.total_products || 0),
                totalValue: parseFloat(stock.total_stock_value || 0),
                lowStockCount: parseInt(stock.low_stock_count || 0),
                outOfStockCount: parseInt(stock.out_of_stock_count || 0),
                avgStockQuantity: parseFloat(stock.avg_stock_quantity || 0)
            },
            movement: {
                totalMovements: parseInt(movement.total_movements || 0),
                totalInbound: parseFloat(movement.total_inbound || 0),
                totalOutbound: parseFloat(movement.total_outbound || 0),
                netMovement: parseFloat(movement.total_inbound || 0) - parseFloat(movement.total_outbound || 0)
            },
            alerts: {
                lowStock: parseInt(stock.low_stock_count || 0),
                outOfStock: parseInt(stock.out_of_stock_count || 0)
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Inventory metrics error:', error);
        throw error;
    }
};
