import * as assetService from '../services/assetService.js';
import * as depreciationService from '../services/depreciationService.js';

export const createAsset = async (req, res) => {
    try {
        const [asset] = await assetService.createAsset(req.body);
        res.status(201).json(asset);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const listAssets = async (req, res) => {
    try {
        const records = await assetService.getAssets();
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const runDepreciation = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await depreciationService.calculateDepreciation(parseInt(id));
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
