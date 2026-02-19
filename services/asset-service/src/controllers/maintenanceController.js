import * as maintenanceService from '../services/maintenanceService.js';

export const schedule = async (req, res) => {
    try {
        const [record] = await maintenanceService.scheduleMaintenance(req.body);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const complete = async (req, res) => {
    try {
        const { id } = req.params;
        const { cost, completionDate } = req.body;
        const [record] = await maintenanceService.completeMaintenance(parseInt(id), cost, completionDate);
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const history = async (req, res) => {
    try {
        const { assetId } = req.params;
        const history = await maintenanceService.getMaintenanceHistory(parseInt(assetId));
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
