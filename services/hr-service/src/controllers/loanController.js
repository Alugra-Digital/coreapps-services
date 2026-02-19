import * as loanService from '../services/loanService.js';

export const applyLoan = async (req, res) => {
    try {
        const record = await loanService.applyLoan(req.body);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getEmployeeLoans = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const history = await loanService.getActiveLoans(parseInt(employeeId));
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
