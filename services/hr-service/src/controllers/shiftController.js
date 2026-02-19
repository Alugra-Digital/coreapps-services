import * as shiftService from '../services/shiftService.js';

export const createShift = async (req, res) => {
    try {
        const record = await shiftService.createShift(req.body);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const listShifts = async (req, res) => {
    try {
        const records = await shiftService.getShifts();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
