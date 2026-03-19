import * as reportService from '../services/reportService.js';

export const getBalanceSheet = async (req, res) => {
    try {
        const { asOfDate } = req.query;
        const report = await reportService.generateBalanceSheet(asOfDate);
        res.json(report);
    } catch (error) {
        console.error('Balance sheet error:', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getIncomeStatement = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.generateIncomeStatement(startDate, endDate);
        res.json(report);
    } catch (error) {
        console.error('Income statement error:', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getTrialBalance = async (req, res) => {
    try {
        const { asOfDate, periodId, startDate, endDate } = req.query;
        const report = await reportService.generateTrialBalance({ asOfDate, periodId, startDate, endDate });
        res.json(report);
    } catch (error) {
        console.error('Trial balance error:', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getGeneralLedger = async (req, res) => {
    try {
        const { startDate, endDate, accountId, periodId, sourceModule } = req.query;
        const report = await reportService.generateGeneralLedger({ startDate, endDate, accountId, periodId, sourceModule });
        res.json(report);
    } catch (error) {
        console.error('General ledger error:', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getAgedReceivables = async (req, res) => {
    try {
        const { asOfDate } = req.query;
        const report = await reportService.generateAgedReceivables(asOfDate);
        res.json(report);
    } catch (error) {
        console.error('Aged receivables error:', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};

export const getAgedPayables = async (req, res) => {
    try {
        const { asOfDate } = req.query;
        const report = await reportService.generateAgedPayables(asOfDate);
        res.json(report);
    } catch (error) {
        console.error('Aged payables error:', error);
        res.status(500).json({ message: error.message, code: 'ERROR' });
    }
};
