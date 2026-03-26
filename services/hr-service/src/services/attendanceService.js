import { db } from '../../../shared/db/index.js';
import { attendance, employees } from '../../../shared/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const logAttendance = async (data) => {
    // Handle field name variations (snake_case and camelCase)
    const employeeId = data.employeeId || data.employee_id;
    const date = data.date;
    const status = data.status;
    const checkIn = data.checkIn || data.check_in || data.checkInTime || data.check_in_time;
    const checkOut = data.checkOut || data.check_out || data.checkOutTime || data.check_out_time;

    // Validate required fields
    if (!employeeId) throw new Error('employeeId is required');
    if (!date) throw new Error('date is required');
    if (!status) throw new Error('status is required');

    // Calculate working hours if checkOut is present
    let workingHours = '0';
    if (checkIn && checkOut) {
        const start = new Date(`1970-01-01T${checkIn}:00Z`);
        const end = new Date(`1970-01-01T${checkOut}:00Z`);
        const diff = (end - start) / (1000 * 60 * 60);
        workingHours = diff.toFixed(2);
    }

    // Use proper Drizzle ORM insert
    return await db.insert(attendance).values({
        employeeId: typeof employeeId === 'string' && employeeId.startsWith('EMP-') ? parseInt(employeeId.slice(4), 10) : parseInt(employeeId, 10),
        date: new Date(date),
        status,
        checkIn,
        checkOut,
        workingHours
    }).returning();
};

export const getAttendanceByEmployee = async (employeeId, startDate, endDate) => {
    return await db.select()
        .from(attendance)
        .where(and(
            eq(attendance.employeeId, employeeId),
            // Add date range filter if provided
        ));
};
