import { db } from '../../../shared/db/index.js';
import { workOrders, boms, bomItems, stockLedger, products } from '../../../shared/db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';

export const getWorkOrders = async (filters = {}) => {
    let query = db.select().from(workOrders);
    
    if (filters.status) {
        query = query.where(eq(workOrders.status, filters.status));
    }
    
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;
    
    const data = await query
        .orderBy(desc(workOrders.createdAt))
        .limit(limit)
        .offset(offset);
    
    const [{ count }] = await db
        .select({ count: sql`count(*)::int` })
        .from(workOrders);
    
    return {
        data,
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    };
};

export const createWorkOrder = async (data) => {
    return await db.insert(workOrders).values(data).returning();
};

export const startWorkOrder = async (woId) => {
    return await db.update(workOrders)
        .set({ status: 'IN_PROGRESS', actualStartDate: new Date() })
        .where(eq(workOrders.id, woId))
        .returning();
};

export const completeWorkOrder = async (woId) => {
    return await db.transaction(async (tx) => {
        const [wo] = await tx.select().from(workOrders).where(eq(workOrders.id, woId));
        if (!wo) throw new Error('Work Order not found');

        // 1. Deduct raw materials (Backflush)
        const items = await tx.select().from(bomItems).where(eq(bomItems.bomId, wo.bomId));
        for (const item of items) {
            const qtyToDeduct = parseFloat(item.quantity) * parseFloat(wo.qtyToProduce);

            await tx.insert(stockLedger).values({
                productId: item.itemId,
                warehouseId: wo.warehouseId,
                qtyChange: (-qtyToDeduct).toString(),
                voucherType: 'WORK_ORDER_RAW_MATERIAL',
                voucherNo: wo.woNumber
            });

            // Update product stock
            await tx.update(products)
                .set({ stockQuantity: sql`${products.stockQuantity} - ${qtyToDeduct}` })
                .where(eq(products.id, item.itemId));
        }

        // 2. Add finished goods
        await tx.insert(stockLedger).values({
            productId: wo.itemId,
            warehouseId: wo.warehouseId,
            qtyChange: wo.qtyToProduce,
            voucherType: 'WORK_ORDER_FINISHED_GOOD',
            voucherNo: wo.woNumber
        });

        await tx.update(products)
            .set({ stockQuantity: sql`${products.stockQuantity} + ${wo.qtyToProduce}` })
            .where(eq(products.id, wo.itemId));

        // 3. Update WO status
        return await tx.update(workOrders)
            .set({ status: 'COMPLETED', actualFinishDate: new Date() })
            .where(eq(workOrders.id, woId))
            .returning();
    });
};
