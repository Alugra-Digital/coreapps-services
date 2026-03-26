import { db } from '../../../shared/db/index.js';
import {
  assetDepreciations,
  assets,
  accountingPeriods,
  journalEntries,
  journalEntryLines,
  accounts,
} from '../../../shared/db/schema.js';
import { eq, and, isNull, asc, sql } from 'drizzle-orm';
import * as bukuBesarService from './bukuBesarService.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const resolveAccountId = async (code, name, type = 'EXPENSE') => {
  const [acc] = await db.select().from(accounts).where(eq(accounts.code, code));
  if (acc) return acc.id;
  const [newAcc] = await db.insert(accounts).values({ code, name, type }).returning();
  return newAcc.id;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export const getByPeriod = async (periodId) => {
  const rows = await db.select({
    depreciation: assetDepreciations,
    assetName: assets.name,
    assetCode: assets.assetCode,
    coaDepreciationExpense: assets.coaDepreciationExpenseAccount,
    coaAccumulatedDepreciation: assets.coaAccumulatedDepreciationAccount,
  })
    .from(assetDepreciations)
    .leftJoin(assets, eq(assetDepreciations.assetId, assets.id))
    .where(eq(assetDepreciations.periodId, periodId))
    .orderBy(asc(assetDepreciations.id));

  return rows.map(r => ({
    ...r.depreciation,
    assetName: r.assetName,
    assetCode: r.assetCode,
    coaDepreciationExpense: r.coaDepreciationExpense,
    coaAccumulatedDepreciation: r.coaAccumulatedDepreciation,
  }));
};

// ── Batch Generation ──────────────────────────────────────────────────────────

export const generateForPeriod = async (periodId) => {
  const [period] = await db.select().from(accountingPeriods).where(eq(accountingPeriods.id, periodId));
  if (!period) throw new Error('Accounting period not found');
  if (period.status !== 'OPEN') throw new Error('Cannot generate depreciation in a non-open period');

  // Get all active assets with useful_life_months defined
  const activeAssets = await db.select().from(assets)
    .where(and(
      eq(assets.status, 'ACTIVE'),
      isNull(assets.deletedAt),
      sql`${assets.usefulLifeMonths} IS NOT NULL AND ${assets.usefulLifeMonths} > 0`
    ));

  if (activeAssets.length === 0) {
    return { generated: 0, skipped: 0, posted: 0, message: 'No active assets with useful life defined' };
  }

  // Get existing depreciations for this period to avoid duplicates
  const existing = await db.select({ assetId: assetDepreciations.assetId })
    .from(assetDepreciations)
    .where(eq(assetDepreciations.periodId, periodId));
  const existingAssetIds = new Set(existing.map(r => r.assetId));

  let generated = 0;
  let skipped = 0;

  const periodDate = new Date(period.year, period.month, 0); // Day 0 of next month = last day of current month

  for (const asset of activeAssets) {
    if (existingAssetIds.has(asset.id)) {
      skipped++;
      continue;
    }

    // Skip if fully depreciated
    const currentNBV = Number(asset.valueAfterDepreciation ?? asset.purchaseAmount);
    const salvage = Number(asset.salvageValue ?? 0);
    if (currentNBV <= salvage) {
      skipped++;
      continue;
    }

    // SLM: (purchaseAmount - salvageValue) / usefulLifeMonths
    const monthlyDepreciation = Math.min(
      (Number(asset.purchaseAmount) - salvage) / Number(asset.usefulLifeMonths),
      currentNBV - salvage
    );

    const description = `Penyusutan aset ${asset.assetCode ?? asset.name} — ${period.year}/${String(period.month).padStart(2, '0')}`;

    await db.insert(assetDepreciations).values({
      assetId: asset.id,
      periodId,
      month: period.month,
      year: period.year,
      date: periodDate,
      amount: String(monthlyDepreciation.toFixed(2)),
      description,
      status: 'DRAFT',
    });

    // Update asset running values
    const newTotalDepreciation = Number(asset.totalDepreciation ?? 0) + monthlyDepreciation;
    const newNBV = currentNBV - monthlyDepreciation;
    await db.update(assets)
      .set({
        totalDepreciation: String(newTotalDepreciation.toFixed(2)),
        valueAfterDepreciation: String(newNBV.toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(assets.id, asset.id));

    generated++;
  }

  return {
    generated,
    skipped,
    posted: 0,
    message: `Generated ${generated} depreciation records, skipped ${skipped}`,
  };
};

// ── Generate and Post (Auto-posting) ────────────────────────────────────────

/**
 * Generate depreciation records AND immediately post them as journal entries
 * This is the auto-generation feature that eliminates manual posting step
 */
export const generateAndPostForPeriod = async (periodId) => {
  const [period] = await db.select().from(accountingPeriods).where(eq(accountingPeriods.id, periodId));
  if (!period) throw new Error('Accounting period not found');
  if (period.status !== 'OPEN') throw new Error('Cannot generate depreciation in a non-open period');

  // Get all active assets with useful_life_months defined
  const activeAssets = await db.select().from(assets)
    .where(and(
      eq(assets.status, 'ACTIVE'),
      isNull(assets.deletedAt),
      sql`${assets.usefulLifeMonths} IS NOT NULL AND ${assets.usefulLifeMonths} > 0`
    ));

  if (activeAssets.length === 0) {
    return { generated: 0, skipped: 0, posted: 0, message: 'No active assets with useful life defined' };
  }

  // Get existing depreciations for this period to avoid duplicates
  const existing = await db.select({ assetId: assetDepreciations.assetId })
    .from(assetDepreciations)
    .where(eq(assetDepreciations.periodId, periodId));
  const existingAssetIds = new Set(existing.map(r => r.assetId));

  let generated = 0;
  let skipped = 0;
  let posted = 0;

  const periodDate = new Date(period.year, period.month, 0); // Day 0 of next month = last day of current month

  // Generate and immediately post each depreciation
  for (const asset of activeAssets) {
    if (existingAssetIds.has(asset.id)) {
      skipped++;
      continue;
    }

    // Skip if fully depreciated
    const currentNBV = Number(asset.valueAfterDepreciation ?? asset.purchaseAmount);
    const salvage = Number(asset.salvageValue ?? 0);
    if (currentNBV <= salvage) {
      skipped++;
      continue;
    }

    // Skip if asset doesn't have COA accounts defined for depreciation
    if (!asset.coaDepreciationExpenseAccount || !asset.coaAccumulatedDepreciationAccount) {
      skipped++;
      continue;
    }

    // SLM: (purchaseAmount - salvageValue) / usefulLifeMonths
    const monthlyDepreciation = Math.min(
      (Number(asset.purchaseAmount) - salvage) / Number(asset.usefulLifeMonths),
      currentNBV - salvage
    );

    const description = `Penyusutan aset ${asset.assetCode ?? asset.name} — ${period.year}/${String(period.month).padStart(2, '0')}`;

    // Create depreciation record
    const [depreciation] = await db.insert(assetDepreciations).values({
      assetId: asset.id,
      periodId,
      month: period.month,
      year: period.year,
      date: periodDate,
      amount: String(monthlyDepreciation.toFixed(2)),
      description,
      status: 'DRAFT',
    }).returning();

    // Post to Buku Besar
    try {
      await bukuBesarService.postFromDepreciation(
        depreciation,
        asset.coaDepreciationExpenseAccount,
        `Beban Penyusutan - ${asset.name}`,
        asset.coaAccumulatedDepreciationAccount,
        `Akumulasi Penyusutan - ${asset.name}`,
        periodId
      );
      await db.update(assetDepreciations)
        .set({ status: 'POSTED' })
        .where(eq(assetDepreciations.id, depreciation.id));

      // Update asset running values — only on successful post
      const newTotalDepreciation = Number(asset.totalDepreciation ?? 0) + monthlyDepreciation;
      const newNBV = currentNBV - monthlyDepreciation;
      await db.update(assets)
        .set({
          totalDepreciation: String(newTotalDepreciation.toFixed(2)),
          valueAfterDepreciation: String(newNBV.toFixed(2)),
          updatedAt: new Date(),
        })
        .where(eq(assets.id, asset.id));

      generated++;
      posted++;
    } catch (postErr) {
      console.error(`Failed to post depreciation for asset ${asset.assetCode}:`, postErr.message);
    }
  }

  return {
    generated,
    skipped,
    posted,
    message: `Generated and posted ${posted} depreciation journal entries, skipped ${skipped}`,
  };
};

// ── Post All ──────────────────────────────────────────────────────────────────

export const postAll = async (periodId) => {
  const depreciationList = await getByPeriod(periodId);
  const draftItems = depreciationList.filter(d => d.status === 'DRAFT');
  if (draftItems.length === 0) {
    return { posted: 0, message: 'No DRAFT depreciation records to post' };
  }

  let posted = 0;

  for (const item of draftItems) {
    if (!item.coaDepreciationExpense || !item.coaAccumulatedDepreciation) continue;

    const debitAccountId = await resolveAccountId(
      item.coaDepreciationExpense,
      `Beban Penyusutan - ${item.assetName ?? ''}`,
      'EXPENSE'
    );
    const creditAccountId = await resolveAccountId(
      item.coaAccumulatedDepreciation,
      `Akumulasi Penyusutan - ${item.assetName ?? ''}`,
      'ASSET'
    );

    const reference = `${item.journalCode ?? 'JPD'}/${item.assetCode ?? item.assetId}`;

    const [je] = await db.insert(journalEntries).values({
      date: new Date(item.date),
      description: item.description ?? `Penyusutan ${item.assetName}`,
      reference,
      status: 'POSTED',
      totalDebit: String(item.amount),
      totalCredit: String(item.amount),
      postedAt: new Date(),
    }).returning();

    await db.insert(journalEntryLines).values([
      {
        journalEntryId: je.id,
        accountId: debitAccountId,
        debit: String(item.amount),
        credit: '0',
        description: `Beban penyusutan ${item.assetName}`,
        reference,
      },
      {
        journalEntryId: je.id,
        accountId: creditAccountId,
        debit: '0',
        credit: String(item.amount),
        description: `Akumulasi penyusutan ${item.assetName}`,
        reference,
      },
    ]);

    await db.update(assetDepreciations)
      .set({ status: 'POSTED', journalEntryId: je.id })
      .where(eq(assetDepreciations.id, item.id));

    posted++;
  }

  return { posted, message: `Posted ${posted} depreciation records` };
};

// ── Remove ────────────────────────────────────────────────────────────────────

export const remove = async (id) => {
  const [item] = await db.select().from(assetDepreciations).where(eq(assetDepreciations.id, id));
  if (!item) throw new Error('Depreciation record not found');
  if (item.status !== 'DRAFT') throw new Error('Only DRAFT records can be deleted');

  // Reverse the asset value changes
  const [asset] = await db.select().from(assets).where(eq(assets.id, item.assetId));
  if (asset) {
    const restoredNBV = Number(asset.valueAfterDepreciation) + Number(item.amount);
    const restoredTotal = Math.max(0, Number(asset.totalDepreciation) - Number(item.amount));
    await db.update(assets)
      .set({
        valueAfterDepreciation: String(restoredNBV.toFixed(2)),
        totalDepreciation: String(restoredTotal.toFixed(2)),
        updatedAt: new Date(),
      })
      .where(eq(assets.id, item.assetId));
  }

  await db.delete(assetDepreciations).where(eq(assetDepreciations.id, id));
};
