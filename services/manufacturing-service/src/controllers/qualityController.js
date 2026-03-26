import * as qualityService from '../services/qualityService.js';

export const getInspections = async (req, res) => {
    try {
        const list = await qualityService.getInspections();
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const createInspection = async (req, res) => {
    try {
        const { referenceType, referenceId, itemId, inspectedBy, status, findings } = req.body;
        if (!referenceType) return res.status(400).json({ message: 'referenceType is required (e.g. "Work Order")', code: 'VALIDATION_ERROR' });
        if (!referenceId) return res.status(400).json({ message: 'referenceId is required', code: 'VALIDATION_ERROR' });
        if (!itemId) return res.status(400).json({ message: 'itemId is required', code: 'VALIDATION_ERROR' });

        const data = {
            referenceType,
            referenceId: parseInt(referenceId),
            itemId: parseInt(itemId),
            inspectedBy: inspectedBy ? parseInt(inspectedBy) : null,
            status: status || 'PENDING',
            findings: findings || null,
        };
        const [qi] = await qualityService.createInspection(data);
        res.status(201).json(qi);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, findings } = req.body;
        const [qi] = await qualityService.updateInspectionStatus(parseInt(id), status, findings);
        res.json(qi);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
