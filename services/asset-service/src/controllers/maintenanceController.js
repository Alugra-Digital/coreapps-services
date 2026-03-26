import * as maintenanceService from '../services/maintenanceService.js';

export const schedule = async (req, res) => {
    try {
        const { assetId, type, scheduledDate, performedBy, cost } = req.body;
        if (!assetId) return res.status(400).json({ message: 'assetId is required', code: 'VALIDATION_ERROR' });
        if (!type) return res.status(400).json({ message: 'type is required: PREVENTIVE, CORRECTIVE, or BREAKDOWN', code: 'VALIDATION_ERROR' });
        if (!['PREVENTIVE', 'CORRECTIVE', 'BREAKDOWN'].includes(type)) {
            return res.status(400).json({ message: 'type must be PREVENTIVE, CORRECTIVE, or BREAKDOWN', code: 'VALIDATION_ERROR' });
        }
        if (!scheduledDate) return res.status(400).json({ message: 'scheduledDate is required', code: 'VALIDATION_ERROR' });

        const data = {
            assetId: parseInt(assetId),
            type,
            scheduledDate,
            performedBy: performedBy || null,
            cost: cost != null ? String(cost) : '0',
        };
        const [record] = await maintenanceService.scheduleMaintenance(data);
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
