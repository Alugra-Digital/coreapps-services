import { db } from './index.js';
import {
    leaveTypes,
    warehouses,
    products,
    leaveAllocations,
    employees
} from './schema.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

async function seed() {
    try {
        console.log('🌱 Starting database seeding...\n');

        // 1. Leave Types
        console.log('📋 Seeding leave types...');
        const leaveTypeData = [
            { name: 'Annual Leave', maxDaysPerYear: 12, carryForward: true, isPaid: true, createdAt: new Date() },
            { name: 'Sick Leave', maxDaysPerYear: 12, carryForward: false, isPaid: true, createdAt: new Date() },
            { name: 'Emergency Leave', maxDaysPerYear: 3, carryForward: false, isPaid: true, createdAt: new Date() },
            { name: 'Maternity Leave', maxDaysPerYear: 90, carryForward: false, isPaid: true, createdAt: new Date() },
            { name: 'Paternity Leave', maxDaysPerYear: 2, carryForward: false, isPaid: true, createdAt: new Date() }
        ];

        const seededLeaveTypes = await db.insert(leaveTypes)
            .values(leaveTypeData)
            .onConflictDoNothing()
            .returning();

        console.log(`✅ Seeded ${seededLeaveTypes.length} leave types`);

        // 2. Warehouses
        console.log('\n🏭 Seeding warehouses...');
        const warehouseData = [
            { name: 'Main Warehouse', location: 'Jakarta', isActive: true, createdAt: new Date() },
            { name: 'Production Warehouse', location: 'Bekasi', isActive: true, createdAt: new Date() },
            { name: 'Distribution Center', location: 'Tangerang', isActive: true, createdAt: new Date() }
        ];

        const seededWarehouses = await db.insert(warehouses)
            .values(warehouseData)
            .onConflictDoNothing()
            .returning();

        console.log(`✅ Seeded ${seededWarehouses.length} warehouses`);

        // 3. Products for BOM Testing
        console.log('\n📦 Seeding products...');
        const productData = [
            {
                name: 'Steel Sheet',
                sku: 'RAW-001',
                category: 'RAW_MATERIAL',
                unitPrice: '50000',
                description: 'Steel sheet for manufacturing',
                stockQuantity: '1000',
                reorderLevel: '100',
                createdAt: new Date()
            },
            {
                name: 'Aluminum Bar',
                sku: 'RAW-002',
                category: 'RAW_MATERIAL',
                unitPrice: '75000',
                description: 'Aluminum bar for manufacturing',
                stockQuantity: '500',
                reorderLevel: '50',
                createdAt: new Date()
            },
            {
                name: 'Cabinet Unit',
                sku: 'FG-001',
                category: 'FINISHED_GOODS',
                unitPrice: '500000',
                description: 'Finished cabinet unit',
                stockQuantity: '100',
                reorderLevel: '10',
                createdAt: new Date()
            },
            {
                name: 'Office Desk',
                sku: 'FG-002',
                category: 'FINISHED_GOODS',
                unitPrice: '750000',
                description: 'Finished office desk',
                stockQuantity: '50',
                reorderLevel: '5',
                createdAt: new Date()
            }
        ];

        const seededProducts = await db.insert(products)
            .values(productData)
            .onConflictDoNothing()
            .returning();

        console.log(`✅ Seeded ${seededProducts.length} products`);

        // 4. Leave Allocations for existing employees
        console.log('\n👥 Creating leave allocations for employees...');
        const allEmployees = await db.select().from(employees);
        const currentYear = new Date().getFullYear();

        let allocationCount = 0;

        // Get all leave types (including ones that might have existed before)
        const allLeaveTypes = await db.select().from(leaveTypes);

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
                    allocationCount++;
                } catch (error) {
                    // Skip if allocation already exists
                    if (!error.message.includes('duplicate')) {
                        console.warn(`Warning: Could not create allocation for employee ${employee.id}, leave type ${leaveType.id}`);
                    }
                }
            }
        }

        console.log(`✅ Created ${allocationCount} leave allocations for ${allEmployees.length} employees`);

        console.log('\n✨ Database seeding completed successfully!\n');
        console.log('Summary:');
        console.log(`  - Leave Types: ${seededLeaveTypes.length}`);
        console.log(`  - Warehouses: ${seededWarehouses.length}`);
        console.log(`  - Products: ${seededProducts.length}`);
        console.log(`  - Leave Allocations: ${allocationCount}`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Run seeding
seed();
