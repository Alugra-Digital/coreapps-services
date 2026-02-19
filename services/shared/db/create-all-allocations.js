import { db } from './index.js';
import { leaveAllocations, leaveTypes, employees } from './schema.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

async function createAllAllocations() {
    try {
        console.log('Creating leave allocations for all employees...');

        const currentYear = new Date().getFullYear();

        // Get all employees and leave types
        const allEmployees = await db.select().from(employees);
        const allLeaveTypes = await db.select().from(leaveTypes);

        console.log(`Found ${allEmployees.length} employees and ${allLeaveTypes.length} leave types`);

        let created = 0;

        for (const employee of allEmployees) {
            for (const leaveType of allLeaveTypes) {
                try {
                    await db.insert(leaveAllocations)
                        .values({
                            employeeId: employee.id,
                            leaveTypeId: leaveType.id,
                            fiscalYear: currentYear,
                            totalDays: leaveType.maxDaysPerYear,
                            usedDays: 0,
                            createdAt: new Date()
                        })
                        .onConflictDoNothing();
                    created++;
                } catch (error) {
                    // Skip if allocation already exists
                }
            }
        }

        console.log(`✅ Created ${created} leave allocations`);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    } finally {
        process.exit(0);
    }
}

createAllAllocations();
