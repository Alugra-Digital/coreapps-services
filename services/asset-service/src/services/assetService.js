import { db } from '../../../shared/db/index.js';
import { assets } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

export const createAsset = async (data) => {
    const { purchaseAmount, purchaseDate, ...rest } = data;
    return await db.insert(assets).values({
        ...rest,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseAmount,
        valueAfterDepreciation: purchaseAmount
    }).returning();
};

export const getAssets = async () => {
    return await db.select().from(assets);
};

export const getAssetById = async (id) => {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
};

export const updateAsset = async (id, data) => {
    return await db.update(assets)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(assets.id, id))
        .returning();
};
