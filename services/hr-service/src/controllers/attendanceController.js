import * as attendanceService from '../services/attendanceService.js';
import { resolveEmployeeId } from '../utils/employeeMapper.js';

export const logAttendance = async (req, res) => {
    try {
        const body = { ...req.body };
        if (body.employeeId) {
            const { value } = resolveEmployeeId(String(body.employeeId));
            body.employeeId = value;
        }
        const record = await attendanceService.logAttendance(body);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getAttendance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { value } = resolveEmployeeId(employeeId);
        if (!value) return res.status(400).json({ message: 'Invalid employee ID', code: 'INVALID_ID' });
        const history = await attendanceService.getAttendanceByEmployee(value);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
