import { db } from './services/shared/db/index.js';
import { accountingPeriods } from './services/shared/db/schema.js';
async function run() {
  const periods = await db.select().from(accountingPeriods);
  console.log(JSON.stringify(periods, null, 2));
  process.exit(0);
}
run();
