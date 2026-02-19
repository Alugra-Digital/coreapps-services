import { db } from '../../../shared/db/index.js';
import { stockLedger, products, warehouses } from '../../../shared/db/schema.js';
import { eq, sql } from 'drizzle-orm';

export const createStockEntry = async (entry) => {
  // entry: { productId, warehouseId, qtyChange, voucherType, voucherNo }
  
  return await db.transaction(async (tx) => {
    // 1. Insert into Ledger
    const [ledgerEntry] = await tx.insert(stockLedger).values(entry).returning();

    // 2. Update Product Stock Quantity (Global)
    // Note: Ideally we should track warehouse-wise stock in a separate 'bin' table for performance,
    // but for now we aggregate from ledger or update product master.
    
    // Let's update the master product stock quantity
    await tx.update(products)
      .set({ 
        stockQuantity: sql`${products.stockQuantity} + ${entry.qtyChange}`,
        updatedAt: new Date()
      })
      .where(eq(products.id, entry.productId));

    return ledgerEntry;
  });
};

export const getStockBalance = async (productId, warehouseId) => {
  let query = db.select({
    balance: sql`SUM(${stockLedger.qtyChange})`.mapWith(Number)
  }).from(stockLedger);

  if (productId) {
    query = query.where(eq(stockLedger.productId, productId));
  }
  
  if (warehouseId) {
    query = query.where(eq(stockLedger.warehouseId, warehouseId));
  }

  const [result] = await query;
  return result?.balance || 0;
};

export const getStockEntries = async () => {
  return await db
    .select({
      id: stockLedger.id,
      date: stockLedger.createdAt,
      voucherType: stockLedger.voucherType,
      voucherNo: stockLedger.voucherNo,
      qtyChange: stockLedger.qtyChange,
      productName: products.name,
      warehouseName: warehouses.name,
    })
    .from(stockLedger)
    .leftJoin(products, eq(stockLedger.productId, products.id))
    .leftJoin(warehouses, eq(stockLedger.warehouseId, warehouses.id))
    .orderBy(sql`${stockLedger.createdAt} DESC`);
};

export const getWarehouses = async () => {
  return await db.select().from(warehouses);
};

export const getWarehouseById = async (id) => {
  const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
  return warehouse;
};

export const createWarehouse = async (data) => {
  const [warehouse] = await db.insert(warehouses).values(data).returning();
  return warehouse;
};

export const updateWarehouse = async (id, data) => {
  const [warehouse] = await db
    .update(warehouses)
    .set(data)
    .where(eq(warehouses.id, id))
    .returning();
  return warehouse;
};
