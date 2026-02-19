import express from 'express';
import * as reportsController from '../controllers/reportsController.js';

const router = express.Router();

// Report Templates
router.post('/templates', reportsController.createTemplate);
router.get('/templates', reportsController.getTemplates);
router.get('/templates/:id', reportsController.getTemplateById);
router.put('/templates/:id', reportsController.updateTemplate);
router.delete('/templates/:id', reportsController.deleteTemplate);

// Report Generation
router.post('/generate', reportsController.generateReport);
router.get('/:id', reportsController.getReport);

// Report Scheduling
router.post('/schedule', reportsController.createSchedule);
router.get('/schedules', reportsController.getSchedules);
router.delete('/schedules/:id', reportsController.deleteSchedule);

// Report Export
router.get('/export/:id', reportsController.exportReport);

export default router;
