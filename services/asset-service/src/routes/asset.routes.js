import express from 'express';
import {
    createAsset,
    listAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    runDepreciation,
    getAssetTypes,
    checkAssetCode,
    getNextAssetCode,
    getOpenPeriods
} from '../controllers/assetController.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.get('/types', authenticate, getAssetTypes);
router.get('/check-code/:code', authenticate, checkAssetCode);
router.get('/next-code/:type/:month/:year', authenticate, getNextAssetCode);
router.get('/open-periods', authenticate, getOpenPeriods);

router.get('/', authenticate, listAssets);
router.post('/', authenticate, createAsset);
router.get('/:id', authenticate, getAssetById);
router.put('/:id', authenticate, updateAsset);
router.delete('/:id', authenticate, deleteAsset);
router.post('/:id/depreciate', authenticate, runDepreciation);

export default router;
