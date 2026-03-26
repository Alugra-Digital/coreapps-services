import { db } from '../../../shared/db/index.js';
import { leaveTypes, leaveAllocations, leaveApplications, employees } from '../../../shared/db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';

export const getLeaveApplications = async () => {
    return await db.select().from(leaveApplications).orderBy(desc(leaveApplications.id));
};

export const allocateLeave = async (data) => {
    return await db.insert(leaveAllocations).values(data).returning();
};

export const applyLeave = async (data) => {
    const { employeeId, leaveTypeId, fromDate, toDate, totalDays, reason } = data;

    return await db.transaction(async (tx) => {
        // 1. Check balance
        const [allocation] = await tx.select()
            .from(leaveAllocations)
            .where(and(
                eq(leaveAllocations.employeeId, employeeId),
                eq(leaveAllocations.leaveTypeId, leaveTypeId),
                eq(leaveAllocations.fiscalYear, new Date().getFullYear())
            ));

        if (!allocation) throw new Error('No leave allocation found for this year');

        const remaining = parseFloat(allocation.totalDays) - parseFloat(allocation.usedDays);
        if (remaining < parseFloat(totalDays)) throw new Error('Insufficient leave balance');

        // 2. Create application
        const [application] = await tx.insert(leaveApplications).values({
            employeeId,
            leaveTypeId,
            fromDate: new Date(fromDate),
            toDate: new Date(toDate),
            totalDays: totalDays.toString(),
            reason,
            status: 'PENDING'
        }).returning();

        return application;
    });
};

export const approveLeave = async (applicationId, approverId) => {
    return await db.transaction(async (tx) => {
        const [application] = await tx.select().from(leaveApplications).where(eq(leaveApplications.id, applicationId));
        if (!application) throw new Error('Application not found');
        if (application.status !== 'PENDING') throw new Error('Application is already processed');

        // Update used days in allocation
        await tx.update(leaveAllocations)
            .set({
                usedDays: sql`${leaveAllocations.usedDays} + ${application.totalDays}`
            })
            .where(and(
                eq(leaveAllocations.employeeId, application.employeeId),
                eq(leaveAllocations.leaveTypeId, application.leaveTypeId),
                eq(leaveAllocations.fiscalYear, application.fromDate.getFullYear())
            ));

        // Update application status
        return await tx.update(leaveApplications)
            .set({ status: 'APPROVED', approvedBy: approverId, updatedAt: new Date() })
            .where(eq(leaveApplications.id, applicationId))
            .returning();
    });
};

export const getLeaveBalance = async (employeeId) => {
    return await db.select({
        typeName: leaveTypes.name,
        total: leaveAllocations.totalDays,
        used: leaveAllocations.usedDays,
        remaining: sql`${leaveAllocations.totalDays} - ${leaveAllocations.usedDays}`
    })
        .from(leaveAllocations)
        .leftJoin(leaveTypes, eq(leaveAllocations.leaveTypeId, leaveTypes.id))
        .where(eq(leaveAllocations.employeeId, employeeId));
};
