import * as loanService from '../services/loanService.js';
import { resolveEmployeeId } from '../utils/employeeMapper.js';

export const getAllLoans = async (req, res) => {
    try {
        const loans = await loanService.getAllLoans();
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const applyLoan = async (req, res) => {
    try {
        const body = { ...req.body };
        if (body.employeeId) {
            const { value } = resolveEmployeeId(String(body.employeeId));
            body.employeeId = value;
        }
        const record = await loanService.applyLoan(body);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getEmployeeLoans = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { value } = resolveEmployeeId(employeeId);
        if (!value) return res.status(400).json({ message: 'Invalid employee ID', code: 'INVALID_ID' });
        const history = await loanService.getActiveLoans(value);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
