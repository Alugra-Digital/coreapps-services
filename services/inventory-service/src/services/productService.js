import { db } from '../../../shared/db/index.js';
import { products } from '../../../shared/db/schema.js';
import { eq, ilike, or } from 'drizzle-orm';

export const createProduct = async (data) => {
  const [product] = await db.insert(products).values(data).returning();
  return product;
};

export const updateProduct = async (id, data) => {
  const [product] = await db.update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return product;
};

export const getProducts = async (search = '') => {
  let query = db.select().from(products);
  
  if (search) {
    query = query.where(or(
      ilike(products.name, `%${search}%`),
      ilike(products.sku, `%${search}%`)
    ));
  }
  
  return await query;
};

export const getProductById = async (id) => {
  const [product] = await db.select().from(products).where(eq(products.id, id));
  return product;
};

export const deleteProduct = async (id) => {
  await db.delete(products).where(eq(products.id, id));
};
