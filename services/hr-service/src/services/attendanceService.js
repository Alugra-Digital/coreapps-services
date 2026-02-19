import { db } from '../../../shared/db/index.js';
import { attendance, employees } from '../../../shared/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const logAttendance = async (data) => {
    const { employeeId, date, status, checkIn, checkOut } = data;

    // Calculate working hours if checkOut is present
    let workingHours = '0';
    if (checkIn && checkOut) {
        const start = new Date(`1970-01-01T${checkIn}:00Z`);
        const end = new Date(`1970-01-01T${checkOut}:00Z`);
        const diff = (end - start) / (1000 * 60 * 60);
        workingHours = diff.toFixed(2);
    }

    return await db.insert(attendance).values({
        employeeId,
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
