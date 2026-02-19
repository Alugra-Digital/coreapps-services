
import { db } from './services/shared/db/index.js';
import { sql } from 'drizzle-orm';

const fixSchema = async () => {
    console.log('🔧 Fixing database schema...');
    try {
        await db.execute(sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount DECIMAL DEFAULT 0`);
        await db.execute(sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS journal_entry_id INTEGER`);
        console.log('✅ Schema fixed: added paid_amount and journal_entry_id to invoices table.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Schema fix failed:', error);
        process.exit(1);
    }
};

fixSchema();
