import express from 'express';
import * as dashboardController from '../controllers/dashboardCustomizationController.js';

const router = express.Router();

// Dashboard Widgets
router.post('/widgets', dashboardController.createWidget);
router.get('/widgets', dashboardController.getWidgets);
router.put('/widgets/:id', dashboardController.updateWidget);
router.delete('/widgets/:id', dashboardController.deleteWidget);

// Dashboard Layout
router.put('/layout', dashboardController.saveLayout);
router.get('/layout', dashboardController.getLayout);

// Custom KPIs
router.post('/kpis', dashboardController.createKpi);
router.get('/kpis', dashboardController.getKpis);
router.put('/kpis/:id', dashboardController.updateKpi);
router.delete('/kpis/:id', dashboardController.deleteKpi);

export default router;
