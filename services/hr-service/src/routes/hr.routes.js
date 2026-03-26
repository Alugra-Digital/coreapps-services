import express from 'express';
import multer from 'multer';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { authorize } from '../../../shared/middleware/rbac.middleware.js';
import { cacheMiddleware } from '../../../shared/middleware/cache.middleware.js';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadEmployeeDocument
} from '../controllers/employeeController.js';
import {
  getPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition
} from '../controllers/positionController.js';
import {
  applyLeave,
  approveLeave,
  getBalance as getLeaveBalance,
  getLeaveApplications
} from '../controllers/leaveController.js';
import {
  logAttendance,
  getAttendance
} from '../controllers/attendanceController.js';
import {
  applyLoan,
  getEmployeeLoans,
  getAllLoans
} from '../controllers/loanController.js';
import {
  createShift,
  listShifts
} from '../controllers/shiftController.js';
import {
  importEmployeesCSV
} from '../controllers/importController.js';
import {
  getSalaryStructures,
  upsertSalaryStructure,
  getSalarySlips,
  createSalarySlip,
  postSalarySlip,
} from '../controllers/payrollController.js';
import { getStats } from '../controllers/statsController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ==================== STATS ====================
router.get('/stats', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), getStats);

// ==================== EMPLOYEES ====================

/**
 * @openapi
 * /api/hr/employees:
 *   get:
 *     tags: [HR]
 *     summary: List all employees
 *     description: Retrieve a paginated list of all employees. HR_ADMIN and SUPER_ADMIN see all fields; FINANCE_ADMIN sees directory only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/employees', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), getEmployees);

/**
 * @openapi
 * /api/hr/employees/import:
 *   post:
 *     tags: [HR]
 *     summary: Import employees from CSV
 *     description: Bulk import employees from a CSV file upload. The CSV must contain columns for nik, name, ktp, department, position, joinDate.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with employee data
 *     responses:
 *       200:
 *         description: Import completed with summary of created/updated/failed records
 *       400:
 *         description: Invalid CSV format
 */
router.post('/employees/import', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), upload.single('file'), importEmployeesCSV);

/**
 * @openapi
 * /api/hr/employees/{nik}:
 *   get:
 *     tags: [HR]
 *     summary: Get employee by NIK
 *     description: Retrieve detailed employee information by their unique NIK (Nomor Induk Karyawan).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: nik
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee NIK (unique identifier)
 *     responses:
 *       200:
 *         description: Employee details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 */
router.get('/employees/:id', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), getEmployeeById);

/**
 * @openapi
 * /api/hr/employees:
 *   post:
 *     tags: [HR]
 *     summary: Create a new employee
 *     description: Register a new employee in the HR system. Requires HR_ADMIN or SUPER_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Employee with this NIK already exists
 */
router.post('/employees', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), createEmployee);
router.put('/employees/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), updateEmployee);
router.patch('/employees/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), updateEmployee);
router.delete('/employees/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), deleteEmployee);
router.post('/employees/:id/documents', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), upload.single('file'), uploadEmployeeDocument);

// ==================== POSITIONS ====================
router.get('/positions', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), getPositions);
router.get('/positions/:id', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), getPositionById);
router.post('/positions', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), createPosition);
router.put('/positions/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), updatePosition);
router.delete('/positions/:id', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), deletePosition);

// ==================== PAYROLL ====================

/**
 * @openapi
 * /api/hr/payroll/salary-structures:
 *   get:
 *     tags: [HR]
 *     summary: List salary structures
 *     description: Retrieve salary structures for all employees. Accessible by HR_ADMIN, FINANCE_ADMIN, and SUPER_ADMIN.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of salary structures with base salary, allowances, and deductions
 */
router.get('/payroll/salary-structures', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), getSalaryStructures);
router.put('/payroll/salary-structures/:employeeId', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), upsertSalaryStructure);
router.get('/payroll/salary-slips', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), getSalarySlips);
router.post('/payroll/salary-slips', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), createSalarySlip);
router.post('/payroll/salary-slips/:id/post', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), postSalarySlip);

// ==================== LEAVE MANAGEMENT ====================
router.get('/leave', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), getLeaveApplications);

/**
 * @openapi
 * /api/hr/leave/apply:
 *   post:
 *     tags: [HR]
 *     summary: Apply for leave
 *     description: Submit a leave application for an employee. Deducts from available leave balance upon approval.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeaveApplication'
 *     responses:
 *       201:
 *         description: Leave application submitted
 *       400:
 *         description: Insufficient leave balance or validation error
 */
router.get('/leave/balance/:employeeId', authenticate, getLeaveBalance);
router.post('/leave/apply', authenticate, applyLeave);
router.post('/leave/applications/:id/approve', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), approveLeave);

// ==================== ATTENDANCE ====================
router.get('/attendance/:employeeId', authenticate, getAttendance);
router.post('/attendance/log', authenticate, logAttendance);

// ==================== EMPLOYEE LOANS ====================
router.get('/loans', authenticate, authorize(['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN']), getAllLoans);
router.get('/loans/:employeeId', authenticate, getEmployeeLoans);
router.post('/loans/apply', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), applyLoan);

// ==================== SHIFTS ====================
router.get('/shifts', authenticate, listShifts);
router.post('/shifts', authenticate, authorize(['HR_ADMIN', 'SUPER_ADMIN']), createShift);

export default router;
