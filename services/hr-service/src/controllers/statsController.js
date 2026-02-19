import { db } from '../../../shared/db/index.js';
import { sql } from 'drizzle-orm';
import { successResponse } from '../../../shared/utils/response.js';

export const getStats = async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

    // Total employees, active employees, new hires (excluding soft-deleted)
    const empResult = await db.execute(sql`
      SELECT
        COUNT(*)::int as total_employees,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::int as active_employees,
        COUNT(CASE WHEN tmk >= ${oneMonthAgoStr}::date THEN 1 END)::int as new_hires
      FROM employees
      WHERE deleted_at IS NULL
    `);

    const emp = empResult.rows[0] || { total_employees: 0, active_employees: 0, new_hires: 0 };

    // On leave: distinct employees with APPROVED leave where current date is between from_date and to_date
    const leaveResult = await db.execute(sql`
      SELECT COUNT(DISTINCT employee_id)::int as on_leave
      FROM leave_applications
      WHERE status = 'APPROVED'
        AND CURRENT_DATE >= (from_date)::date
        AND CURRENT_DATE <= (to_date)::date
    `);

    const onLeave = leaveResult.rows[0]?.on_leave ?? 0;

    const stats = {
      totalEmployees: Number(emp.total_employees) || 0,
      activeEmployees: Number(emp.active_employees) || 0,
      onLeave: Number(onLeave),
      newHires: Number(emp.new_hires) || 0,
    };

    res.json(successResponse(stats, 'HR stats retrieved successfully'));
  } catch (error) {
    console.error('HR stats error:', error);
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
