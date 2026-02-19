import * as woService from '../services/workOrderService.js';
import { successResponse, paginatedResponse } from '../../../shared/utils/response.js';

export const getWorkOrders = async (req, res) => {
    try {
        const result = await woService.getWorkOrders(req.query);
        res.json(paginatedResponse(result.data, result.pagination));
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const createWorkOrder = async (req, res) => {
    try {
        const [wo] = await woService.createWorkOrder(req.body);
        res.status(201).json(successResponse(wo, 'Work order created successfully'));
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const startWorkOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const [wo] = await woService.startWorkOrder(parseInt(id));
        res.json(successResponse(wo, 'Work order started successfully'));
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const completeWorkOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const [wo] = await woService.completeWorkOrder(parseInt(id));
        res.json(successResponse(wo, 'Work order completed successfully'));
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
