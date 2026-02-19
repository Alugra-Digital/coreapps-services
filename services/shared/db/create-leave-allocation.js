import { db } from './index.js';
import { leaveAllocations, employees, leaveTypes } from './schema.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

async function createLeaveAllocation() {
    try {
        console.log('Creating leave allocation for employee ID 1...');

        const currentYear = new Date().getFullYear();

        // Get all leave types
        const allLeaveTypes = await db.select().from(leaveTypes);

        for (const leaveType of allLeaveTypes) {
            try {
                await db.insert(leaveAllocations)
                    .values({
                        employeeId: 1,
                        leaveTypeId: leaveType.id,
                        fiscalYear: currentYear,
                        totalDays: leaveType.maxDaysPerYear,
                        usedDays: 0,
                        createdAt: new Date()
                    })
                    .onConflictDoNothing();
                console.log(`✅ Created allocation for leave type: ${leaveType.name}`);
            } catch (error) {
                console.log(`⚠️  Allocation already exists for ${leaveType.name}`);
            }
        }

        console.log('\n✨ Leave allocations created successfully!');
    } catch (error) {
        console.error('❌ Failed:', error.message);
    } finally {
        process.exit(0);
    }
}

createLeaveAllocation();
