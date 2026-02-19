import { db } from '../../../shared/db/index.js';
import { boms, bomItems, products } from '../../../shared/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const createBOM = async (data) => {
    const { itemId, name, items } = data;

    return await db.transaction(async (tx) => {
        // Calculate total cost from items
        let totalCost = 0;
        for (const item of items) {
            const [product] = await tx.select().from(products).where(eq(products.id, item.itemId));
            const itemCost = (product ? parseFloat(product.cost) : 0) * parseFloat(item.quantity);
            totalCost += itemCost;
        }

        const [bom] = await tx.insert(boms).values({
            itemId,
            name,
            totalCost: totalCost.toString()
        }).returning();

        const itemsWithBOMId = items.map(item => ({
            bomId: bom.id,
            itemId: item.itemId,
            quantity: item.quantity.toString()
        }));

        await tx.insert(bomItems).values(itemsWithBOMId);

        return bom;
    });
};

export const getBOMTree = async (bomId) => {
    const [bom] = await db.select().from(boms).where(eq(boms.id, bomId));
    if (!bom) throw new Error('BOM not found');

    const items = await db.select({
        id: bomItems.id,
        quantity: bomItems.quantity,
        scrapRate: bomItems.scrapRate,
        cost: bomItems.cost,
        product: {
            id: products.id,
            name: products.name,
            sku: products.sku,
            unit: products.unit
        }
    })
        .from(bomItems)
        .leftJoin(products, eq(bomItems.itemId, products.id))
        .where(eq(bomItems.bomId, bomId));

    return { ...bom, items };
};
