import { db } from './db/index.js';
import { users } from './db/schema.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const seed = async () => {
    try {
        console.log('Starting database seeding...');

        // Check if users already exist
        const existingUsers = await db.select().from(users);
        if (existingUsers.length > 0) {
            console.log('Database already seeded. Skipping...');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        await db.insert(users).values([
            { username: 'admin', password: hashedPassword, role: 'SUPER_ADMIN' },
            { username: 'hr_admin', password: hashedPassword, role: 'HR_ADMIN' },
            { username: 'finance_admin', password: hashedPassword, role: 'FINANCE_ADMIN' },
        ]);

        console.log('✅ Database seeded successfully!');
        console.log('Default users created:');
        console.log('  - admin / admin123 (SUPER_ADMIN)');
        console.log('  - hr_admin / admin123 (HR_ADMIN)');
        console.log('  - finance_admin / admin123 (FINANCE_ADMIN)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seed();
