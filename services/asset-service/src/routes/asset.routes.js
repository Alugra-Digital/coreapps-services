import express from 'express';
import { createAsset, listAssets, runDepreciation } from '../controllers/assetController.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, listAssets);
router.post('/', authenticate, createAsset);
router.post('/:id/depreciate', authenticate, runDepreciation);

export default router;
