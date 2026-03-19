import * as assetService from '../services/assetService.js';
import * as depreciationService from '../services/depreciationService.js';

export const createAsset = async (req, res) => {
    try {
        const asset = await assetService.createAsset(req.body);
        res.status(201).json(asset);
    } catch (error) {
        res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
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

export const getAssetById = async (req, res) => {
    try {
        const asset = await assetService.getAssetById(parseInt(req.params.id));
        if (!asset) return res.status(404).json({ message: 'Asset not found', code: 'NOT_FOUND' });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const asset = await assetService.updateAsset(parseInt(req.params.id), req.body);
        if (!asset) return res.status(404).json({ message: 'Asset not found', code: 'NOT_FOUND' });
        res.json(asset);
    } catch (error) {
        res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        await assetService.deleteAsset(parseInt(req.params.id));
        res.status(204).end();
    } catch (error) {
        res.status(400).json({ message: error.message, code: 'BAD_REQUEST' });
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
export const getAssetTypes = async (req, res) => {
    try {
        const types = await assetService.getAssetTypes();
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const checkAssetCode = async (req, res) => {
    try {
        const { code } = req.params;
        const exists = await assetService.checkAssetCode(code);
        res.json({ exists });
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getNextAssetCode = async (req, res) => {
    try {
        const { type, month, year } = req.params;
        const code = await assetService.getNextAssetCode(type, month, year);
        res.json({ code });
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getOpenPeriods = async (req, res) => {
    try {
        const periods = await assetService.getOpenPeriods();
        res.json(periods);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
