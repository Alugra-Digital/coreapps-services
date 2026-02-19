import * as dashboardService from '../services/dashboardService.js';
import * as revenueService from '../services/revenueService.js';
import * as hrMetricsService from '../services/hrMetricsService.js';
import * as inventoryMetricsService from '../services/inventoryMetricsService.js';
import * as manufacturingMetricsService from '../services/manufacturingMetricsService.js';
import { successResponse } from '../../../shared/utils/response.js';

export const getDashboard = async (req, res, next) => {
    try {
        const dashboard = await dashboardService.getCompleteDashboard();
        res.json(dashboard);
    } catch (error) {
        next(error);
    }
};

export const getRevenueAnalytics = async (req, res, next) => {
    try {
        const { period = 'monthly', year, month } = req.query;
        const analytics = await revenueService.getRevenueAnalytics(period, year, month);
        res.json(successResponse(analytics, 'Revenue analytics retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

export const getHRMetrics = async (req, res, next) => {
    try {
        const metrics = await hrMetricsService.getHRMetrics();
        res.json(successResponse(metrics, 'HR metrics retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

export const getInventoryMetrics = async (req, res, next) => {
    try {
        const metrics = await inventoryMetricsService.getInventoryMetrics();
        res.json(successResponse(metrics, 'Inventory metrics retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

export const getManufacturingMetrics = async (req, res, next) => {
    try {
        const metrics = await manufacturingMetricsService.getManufacturingMetrics();
        res.json(successResponse(metrics, 'Manufacturing metrics retrieved successfully'));
    } catch (error) {
        next(error);
    }
};
