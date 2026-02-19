import * as paymentService from '../services/paymentService.js';
import { z } from 'zod';

export const getPayments = async (req, res) => {
    try {
        const payments = await paymentService.getPayments(req.query);
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const payment = await paymentService.getPaymentById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found', code: 'NOT_FOUND' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

const paymentSchema = z.object({
    invoiceId: z.number(),
    amount: z.number().positive(),
    date: z.string().optional(),
    paymentMode: z.enum(['CASH', 'BANK']),
    referenceNo: z.string().optional(),
});

export const createPayment = async (req, res) => {
    try {
        const data = paymentSchema.parse(req.body);
        const payment = await paymentService.createPayment(data);
        res.status(201).json(payment);
    } catch (error) {
        res.status(400).json({ message: error.message, code: 'VALIDATION_ERROR' });
    }
};

export const getPaymentsByInvoice = async (req, res) => {
    try {
        const payments = await paymentService.getPaymentsByInvoice(parseInt(req.params.invoiceId));
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
