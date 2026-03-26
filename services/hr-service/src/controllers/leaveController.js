import * as leaveService from '../services/leaveService.js';
import { resolveEmployeeId } from '../utils/employeeMapper.js';

export const getLeaveApplications = async (req, res) => {
    try {
        const applications = await leaveService.getLeaveApplications();
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const applyLeave = async (req, res) => {
    try {
        const body = { ...req.body };
        if (body.employeeId) {
            const { value } = resolveEmployeeId(String(body.employeeId));
            body.employeeId = value;
        }
        const application = await leaveService.applyLeave(body);
        res.status(201).json(application);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const approveLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await leaveService.approveLeave(parseInt(id), req.user.id);
        res.json(application);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getBalance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { value } = resolveEmployeeId(employeeId);
        if (!value) return res.status(400).json({ message: 'Invalid employee ID', code: 'INVALID_ID' });
        const balance = await leaveService.getLeaveBalance(value);
        res.json(balance);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
