import { db } from '../../../shared/db/index.js';
import { assets, assetDepreciations } from '../../../shared/db/schema.js';
import { eq, sql } from 'drizzle-orm';

export const calculateDepreciation = async (assetId, usefulLifeYears = 5) => {
    return await db.transaction(async (tx) => {
        const [asset] = await tx.select().from(assets).where(eq(assets.id, assetId));
        if (!asset) throw new Error('Asset not found');

        let depreciationAmount = 0;
        if (asset.depreciationMethod === 'SLM') {
            depreciationAmount = (parseFloat(asset.purchaseAmount) / usefulLifeYears / 12).toFixed(2);
        } else {
            // WDV or Manual logic
            depreciationAmount = (parseFloat(asset.valueAfterDepreciation) * 0.05 / 12).toFixed(2);
        }

        // 1. Record depreciation
        const [depreciation] = await tx.insert(assetDepreciations).values({
            assetId,
            date: new Date(),
            amount: depreciationAmount.toString(),
        }).returning();

        // 2. Update asset values
        await tx.update(assets)
            .set({
                totalDepreciation: sql`${assets.totalDepreciation} + ${depreciationAmount}`,
                valueAfterDepreciation: sql`${assets.valueAfterDepreciation} - ${depreciationAmount}`,
                updatedAt: new Date()
            })
            .where(eq(assets.id, assetId));

        return depreciation;
    });
};
