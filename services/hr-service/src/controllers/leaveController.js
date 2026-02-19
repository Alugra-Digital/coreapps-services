import * as leaveService from '../services/leaveService.js';

export const applyLeave = async (req, res) => {
    try {
        const application = await leaveService.applyLeave(req.body);
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
        const balance = await leaveService.getLeaveBalance(parseInt(employeeId));
        res.json(balance);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
