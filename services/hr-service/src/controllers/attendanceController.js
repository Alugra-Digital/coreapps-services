import * as attendanceService from '../services/attendanceService.js';

export const logAttendance = async (req, res) => {
    try {
        const record = await attendanceService.logAttendance(req.body);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getAttendance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const history = await attendanceService.getAttendanceByEmployee(parseInt(employeeId));
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
