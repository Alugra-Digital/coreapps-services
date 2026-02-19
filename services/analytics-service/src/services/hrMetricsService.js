import { db } from '../../../shared/db/index.js';
import { sql } from 'drizzle-orm';

export const getHRMetrics = async () => {
    try {
        // Employee metrics
        const employeeResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_employees,
        COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END) as inactive_employees
      FROM employees
      WHERE deleted_at IS NULL
    `);

        // Attendance metrics (current month)
        const attendanceResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'ON_LEAVE' THEN 1 END) as on_leave_count
      FROM attendance
      WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

        // Leave metrics
        const leaveResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN total_days ELSE 0 END), 0) as total_days_taken
      FROM leave_applications
      WHERE EXTRACT(YEAR FROM from_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

        // Payroll metrics (current month)
        const payrollResult = await db.execute(sql`
      SELECT 
        COUNT(*) as salary_slips_count,
        COALESCE(SUM(net_pay), 0) as total_payroll
      FROM salary_slips
      WHERE period_year = EXTRACT(YEAR FROM CURRENT_DATE)
        AND period_month = EXTRACT(MONTH FROM CURRENT_DATE)
    `);

        const emp = employeeResult.rows[0] || {};
        const att = attendanceResult.rows[0] || {};
        const leave = leaveResult.rows[0] || {};
        const payroll = payrollResult.rows[0] || {};

        const attendanceRate = att.total_records > 0
            ? ((att.present_count / att.total_records) * 100).toFixed(2)
            : 0;

        return {
            employees: {
                total: parseInt(emp.total_employees || 0),
                active: parseInt(emp.active_employees || 0),
                inactive: parseInt(emp.inactive_employees || 0)
            },
            attendance: {
                totalRecords: parseInt(att.total_records || 0),
                presentCount: parseInt(att.present_count || 0),
                absentCount: parseInt(att.absent_count || 0),
                onLeaveCount: parseInt(att.on_leave_count || 0),
                attendanceRate: parseFloat(attendanceRate)
            },
            leave: {
                totalApplications: parseInt(leave.total_applications || 0),
                approvedCount: parseInt(leave.approved_count || 0),
                pendingCount: parseInt(leave.pending_count || 0),
                totalDaysTaken: parseInt(leave.total_days_taken || 0)
            },
            payroll: {
                salarySlipsCount: parseInt(payroll.salary_slips_count || 0),
                totalPayroll: parseFloat(payroll.total_payroll || 0)
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('HR metrics error:', error);
        throw error;
    }
};
