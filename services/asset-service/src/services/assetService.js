import { db } from '../../../shared/db/index.js';
import { assets, assetTypes, accountingPeriods, assetDepreciations } from '../../../shared/db/schema.js';
import { eq, isNull, and, sql } from 'drizzle-orm';

const activeRows = () => isNull(assets.deletedAt);

const generateAssetCode = async () => {
    const year = new Date().getFullYear();
    const prefix = `AST-${year}-`;
    const [row] = await db.select({ count: sql`COUNT(*)` })
        .from(assets)
        .where(sql`${assets.assetCode} LIKE ${prefix + '%'}`);
    const seq = (Number(row?.count ?? 0)) + 1;
    return `${prefix}${String(seq).padStart(3, '0')}`;
};

export const createAsset = async (data) => {
    // Extract fields explicitly to avoid DB column mismatch from spreading undefined values
    const {
        assetCode,
        assetTypeCode,
        name,
        category,
        purchaseDate,
        purchaseAmount,
        salvageValue,
        usefulLifeMonths,
        ownerId,
        location,
        department,
        vendor,
        specification,
        description,
        attachmentUrl,
        depreciationMethod,
        coaAssetAccount,
        coaDepreciationExpenseAccount,
        coaAccumulatedDepreciationAccount
    } = data;

    const generatedAssetCode = assetCode || (await generateAssetCode());
    const numPurchaseAmount = Number(purchaseAmount) || 0;
    const numSalvageValue = Number(salvageValue) || 0;
    const numUsefulLifeMonths = parseInt(usefulLifeMonths) || 60;

    const [asset] = await db.insert(assets).values({
        assetCode: generatedAssetCode,
        assetTypeCode: assetTypeCode || null,
        name: name || 'Untitled Asset',
        category: category || 'ELECTRONICS',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        purchaseAmount: String(numPurchaseAmount),
        salvageValue: String(numSalvageValue),
        usefulLifeMonths: numUsefulLifeMonths,
        ownerId: ownerId ? parseInt(ownerId) : null,
        location,
        department,
        vendor,
        specification,
        description,
        attachmentUrl,
        depreciationMethod: depreciationMethod || 'SLM',
        coaAssetAccount,
        coaDepreciationExpenseAccount,
        coaAccumulatedDepreciationAccount,
        valueAfterDepreciation: String(numPurchaseAmount),
        status: 'ACTIVE'
    }).returning();

    // Auto-generate depreciation draft for open periods
    const openPeriods = await getOpenPeriods();
    if (openPeriods.length > 0 && numUsefulLifeMonths > 0) {
        const monthlyDepreciation = (numPurchaseAmount - numSalvageValue) / numUsefulLifeMonths;

        const depreciationRecords = openPeriods.map(period => {
            // End of month date for period
            const periodDate = new Date(period.year, period.month, 0);
            return {
                assetId: asset.id,
                periodId: period.id,
                date: periodDate,
                amount: String(monthlyDepreciation),
                description: `Penyusutan ${period.month}/${period.year}`,
                status: 'DRAFT'
            };
        });

        await db.insert(assetDepreciations).values(depreciationRecords);
    }

    return asset;
};

export const getAssetTypes = async () => {
    return db.select().from(assetTypes);
};

export const checkAssetCode = async (code) => {
    const [row] = await db.select({ count: sql`COUNT(*)` })
        .from(assets)
        .where(eq(assets.assetCode, code));
    return Number(row?.count ?? 0) > 0;
};

export const getNextAssetCode = async (typeCode, month, year) => {
    const prefix = `ALG-${typeCode}${String(month).padStart(2, '0')}${String(year).slice(-2)}`;
    const [row] = await db.select({ count: sql`COUNT(*)` })
        .from(assets)
        .where(sql`${assets.assetCode} LIKE ${prefix + '%'}`);
    const seq = (Number(row?.count ?? 0)) + 1;
    return `${prefix}${String(seq).padStart(3, '0')}`;
};

export const getOpenPeriods = async () => {
    return db.select()
        .from(accountingPeriods)
        .where(eq(accountingPeriods.status, 'OPEN'))
        .orderBy(accountingPeriods.year, accountingPeriods.month);
};

export const getAssets = async () => {
    return db.select().from(assets).where(activeRows());
};

export const getAssetById = async (id) => {
    const [asset] = await db.select().from(assets)
        .where(and(eq(assets.id, id), activeRows()));
    return asset ?? null;
};

export const updateAsset = async (id, data) => {
    const [updated] = await db.update(assets)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(assets.id, id), activeRows()))
        .returning();
    return updated ?? null;
};

export const deleteAsset = async (id) => {
    const existing = await getAssetById(id);
    if (!existing) throw new Error('Asset not found');
    await db.update(assets)
        .set({ deletedAt: new Date(), status: 'SCRAPPED' })
        .where(eq(assets.id, id));
};
