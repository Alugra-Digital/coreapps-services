import * as dashboardService from '../services/dashboardService.js';
import * as revenueService from '../services/revenueService.js';
import * as hrMetricsService from '../services/hrMetricsService.js';
import * as inventoryMetricsService from '../services/inventoryMetricsService.js';
import * as manufacturingMetricsService from '../services/manufacturingMetricsService.js';
import * as salesService from '../services/salesService.js';
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

export const getSales = async (req, res, next) => {
    try {
        const salesData = await salesService.getSalesData();
        res.json(successResponse(salesData, 'Sales data retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

/** GET /sales/employees - per employee ranking (CoreApps 2.0) */
export const getSalesByEmployees = async (req, res, next) => {
    try {
        const data = await salesService.getSalesByEmployees();
        res.json(successResponse(data, 'Sales by employees retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

/** GET /sales/employees/:id - individual stats (CoreApps 2.0) */
export const getSalesByEmployeeId = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid employee ID' } });
        }
        const data = await salesService.getSalesByEmployeeId(id);
        if (!data) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
        }
        res.json(successResponse(data, 'Employee sales stats retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

/** GET /sales/funnel - conversion funnel (CoreApps 2.0) */
export const getSalesFunnel = async (req, res, next) => {
    try {
        const data = await salesService.getSalesFunnel();
        res.json(successResponse(data, 'Sales funnel retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

/** GET /sales/targets - quarterly targets (CoreApps 2.0) */
export const getSalesTargets = async (req, res, next) => {
    try {
        const data = await salesService.getSalesTargets();
        res.json(successResponse(data, 'Sales targets retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

/** PUT /sales/targets/:quarter - set target (CoreApps 2.0). Param format: 2024-Q1 */
export const setSalesTarget = async (req, res, next) => {
    try {
        const quarterParam = req.params.quarter || '';
        const match = quarterParam.match(/^(\d{4})-Q([1-4])$/i);
        if (!match) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid quarter format. Use YYYY-Qn (e.g. 2024-Q1)' },
            });
        }
        const year = parseInt(match[1], 10);
        const quarter = parseInt(match[2], 10);
        const targetAmount = Number(req.body?.targetAmount ?? req.body?.target ?? 0);
        if (targetAmount < 0 || !Number.isFinite(targetAmount)) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'targetAmount must be a non-negative number' },
            });
        }
        const setBy = req.user?.id ?? req.user?.employeeId ?? null;
        const data = await salesService.setSalesTarget(year, quarter, targetAmount, setBy);
        res.json(successResponse(data, 'Sales target updated successfully'));
    } catch (error) {
        next(error);
    }
};

export const getReportsData = async (req, res, next) => {
    try {
        const performanceData = [
            { month: 'Jan', revenue: 45000, expenses: 32000 },
            { month: 'Feb', revenue: 52000, expenses: 34000 },
            { month: 'Mar', revenue: 48000, expenses: 31000 },
            { month: 'Apr', revenue: 61000, expenses: 42000 },
            { month: 'May', revenue: 55000, expenses: 38000 },
            { month: 'Jun', revenue: 67000, expenses: 45000 },
        ];
        const expenditureData = [
            { name: 'Salaries', value: 45, color: '#6366f1' },
            { name: 'Infrastructure', value: 25, color: '#10b981' },
            { name: 'Marketing', value: 15, color: '#f59e0b' },
            { name: 'Operational', value: 15, color: '#f43f5e' },
        ];
        const availableReports = [
            { id: 'REP-001', name: 'Q4 Financial Statement', type: 'Financial', date: 'Feb 01, 2024', size: '2.4 MB', status: 'Ready' },
            { id: 'REP-002', name: 'Annual Tax Compliance', type: 'Tax', date: 'Jan 15, 2024', size: '1.8 MB', status: 'Ready' },
            { id: 'REP-003', name: 'Client Yield Analysis', type: 'Operational', date: 'Jan 10, 2024', size: '4.2 MB', status: 'Ready' },
        ];
        res.json(successResponse({
            performanceData,
            expenditureData,
            availableReports,
        }, 'Reports data retrieved successfully'));
    } catch (error) {
        next(error);
    }
};
