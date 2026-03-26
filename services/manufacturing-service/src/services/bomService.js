import { db } from '../../../shared/db/index.js';
import { boms, bomItems, products } from '../../../shared/db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';

export const getBOMs = async () => {
    return await db.select().from(boms).orderBy(desc(boms.id));
};

export const createBOM = async (data) => {
    // Handle field name variation: components or items
    const items = data.components || data.items || [];

    if (!Array.isArray(items)) {
        throw new Error('components/items must be an array');
    }

    const { itemId, name } = data;

    if (!itemId) throw new Error('itemId is required');
    if (!name) throw new Error('name is required');

    return await db.transaction(async (tx) => {
        // Calculate total cost from items
        let totalCost = 0;
        const itemProductIds = items.map(i => i.itemId);

        // Fetch all products in one query for better performance
        const productsList = itemProductIds.length > 0
            ? await tx.select().from(products).where(sql`${products.id} IN (${itemProductIds.join(',')})`)
            : [];

        const productsMap = new Map(productsList.map(p => [p.id, p]));

        for (const item of items) {
            const product = productsMap.get(item.itemId);
            const itemCost = (product ? parseFloat(product.cost) : 0) * parseFloat(item.quantity);
            totalCost += itemCost;
        }

        const [bom] = await tx.insert(boms).values({
            itemId,
            name,
            totalCost
        }).returning();

        const itemsWithBOMId = items.map(item => ({
            bomId: bom.id,
            itemId: item.itemId,
            quantity: item.quantity
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
