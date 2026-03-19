/**
 * Migration: add rich-document JSONB columns to purchase_orders table.
 * Run once with: node fix_po_schema.js
 */
import { db } from './services/shared/db/index.js';
import { sql } from 'drizzle-orm';

const migrate = async () => {
    console.log('🔧 Adding rich document columns to purchase_orders...');
    try {
        await db.execute(sql`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS company_info  JSONB`);
        await db.execute(sql`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS order_info    JSONB`);
        await db.execute(sql`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_info   JSONB`);
        await db.execute(sql`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approval      JSONB`);
        await db.execute(sql`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_procedure TEXT`);
        await db.execute(sql`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS other_terms      TEXT`);
        console.log('✅ Migration complete: added company_info, order_info, vendor_info, approval, payment_procedure, other_terms to purchase_orders.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
