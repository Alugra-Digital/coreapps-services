import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { createComment, getComments } from '../controllers/commentController.js';

const router = express.Router();

router.post('/', authenticate, createComment);
router.get('/:docType/:docId', authenticate, getComments);

export default router;
