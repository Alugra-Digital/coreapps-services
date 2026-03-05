import { db } from '../../../shared/db/index.js';
import { purchaseOrders, clients } from '../../../shared/db/schema.js';
import { eq, desc, ilike } from 'drizzle-orm';

export const generatePurchaseOrderNumber = async () => {
  const date = new Date();
  const prefix = `PO/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/`;
  const [last] = await db.select({ number: purchaseOrders.number })
    .from(purchaseOrders)
    .where(ilike(purchaseOrders.number, `${prefix}%`))
    .orderBy(desc(purchaseOrders.number))
    .limit(1);
  let seq = 1;
  if (last) {
    const parts = last.number.split('/');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }
  return `${prefix}${String(seq).padStart(3, '0')}`;
};

export const getPurchaseOrders = async () => {
  const rows = await db.select({
    po: purchaseOrders,
    client: clients,
  })
    .from(purchaseOrders)
    .leftJoin(clients, eq(purchaseOrders.clientId, clients.id))
    .orderBy(desc(purchaseOrders.createdAt));
  return rows.map((r) => ({ ...r.po, _client: r.client }));
};

const PO_INSERT_FIELDS = ['number', 'supplierName', 'clientId', 'projectId', 'date', 'items', 'subtotal', 'tax', 'grandTotal', 'status'];

export const createPurchaseOrder = async (data) => {
  const insertData = {};
  for (const k of PO_INSERT_FIELDS) {
    if (data[k] !== undefined) insertData[k] = data[k];
  }
  const [po] = await db.insert(purchaseOrders).values(insertData).returning();
  if (po?.clientId) {
    const [c] = await db.select().from(clients).where(eq(clients.id, po.clientId));
    return { ...po, _client: c };
  }
  return po;
};

export const getPurchaseOrderById = async (id) => {
  const [row] = await db.select({
    po: purchaseOrders,
    client: clients,
  })
    .from(purchaseOrders)
    .leftJoin(clients, eq(purchaseOrders.clientId, clients.id))
    .where(eq(purchaseOrders.id, id));
  if (!row) return null;
  return { ...row.po, _client: row.client };
};

export const updatePurchaseOrder = async (id, data) => {
  const updateData = { updatedAt: new Date() };
  for (const k of PO_INSERT_FIELDS) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }
  const [po] = await db.update(purchaseOrders).set(updateData).where(eq(purchaseOrders.id, id)).returning();
  if (po?.clientId) {
    const [c] = await db.select().from(clients).where(eq(clients.id, po.clientId));
    return { ...po, _client: c };
  }
  return po;
};

export const deletePurchaseOrder = async (id) => {
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
};
