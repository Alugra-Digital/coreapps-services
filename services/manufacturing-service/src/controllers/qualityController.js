import * as qualityService from '../services/qualityService.js';

export const createInspection = async (req, res) => {
    try {
        const [qi] = await qualityService.createInspection(req.body);
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
