import { db } from '../../../shared/db/index.js';
import { sql } from 'drizzle-orm';

export const generateBalanceSheet = async (asOfDate) => {
    try {
        const targetDate = asOfDate || new Date().toISOString().split('T')[0];

        // Get account balances grouped by type
        const result = await db.execute(sql`
      SELECT 
        a.type,
        a.code,
        a.name,
        COALESCE(a.balance, 0) as balance
      FROM accounts a
      WHERE a.created_at <= ${targetDate}::date
      ORDER BY a.type, a.code
    `);

        const accounts = result.rows || [];

        // Group by account type
        const assets = accounts.filter(a => a.type === 'ASSET');
        const liabilities = accounts.filter(a => a.type === 'LIABILITY');
        const equity = accounts.filter(a => a.type === 'EQUITY');

        const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);
        const totalLiabilities = liabilities.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);
        const totalEquity = equity.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

        return {
            reportName: 'Balance Sheet',
            asOfDate: targetDate,
            assets: {
                accounts: assets.map(a => ({
                    code: a.code,
                    name: a.name,
                    balance: parseFloat(a.balance || 0)
                })),
                total: totalAssets
            },
            liabilities: {
                accounts: liabilities.map(a => ({
                    code: a.code,
                    name: a.name,
                    balance: parseFloat(a.balance || 0)
                })),
                total: totalLiabilities
            },
            equity: {
                accounts: equity.map(a => ({
                    code: a.code,
                    name: a.name,
                    balance: parseFloat(a.balance || 0)
                })),
                total: totalEquity
            },
            totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
            balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
        };
    } catch (error) {
        console.error('Balance sheet generation error:', error);
        throw error;
    }
};

export const generateIncomeStatement = async (startDate, endDate) => {
    try {
        const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        // Get revenue and expense accounts with their activity
        const result = await db.execute(sql`
      SELECT 
        a.type,
        a.code,
        a.name,
        COALESCE(SUM(jel.credit - jel.debit), 0) as net_amount
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
      WHERE a.type IN ('REVENUE', 'EXPENSE')
        AND (je.date IS NULL OR (je.date >= ${start}::date AND je.date <= ${end}::date))
        AND (je.status IS NULL OR je.status = 'POSTED')
      GROUP BY a.id, a.type, a.code, a.name
      ORDER BY a.type, a.code
    `);

        const accounts = result.rows || [];

        const revenue = accounts.filter(a => a.type === 'REVENUE');
        const expenses = accounts.filter(a => a.type === 'EXPENSE');

        const totalRevenue = revenue.reduce((sum, a) => sum + parseFloat(a.net_amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, a) => sum + Math.abs(parseFloat(a.net_amount || 0)), 0);
        const netIncome = totalRevenue - totalExpenses;

        return {
            reportName: 'Income Statement',
            period: { startDate: start, endDate: end },
            revenue: {
                accounts: revenue.map(a => ({
                    code: a.code,
                    name: a.name,
                    amount: parseFloat(a.net_amount || 0)
                })),
                total: totalRevenue
            },
            expenses: {
                accounts: expenses.map(a => ({
                    code: a.code,
                    name: a.name,
                    amount: Math.abs(parseFloat(a.net_amount || 0))
                })),
                total: totalExpenses
            },
            netIncome
        };
    } catch (error) {
        console.error('Income statement generation error:', error);
        throw error;
    }
};

export const generateTrialBalance = async (asOfDate) => {
    try {
        const targetDate = asOfDate || new Date().toISOString().split('T')[0];

        const result = await db.execute(sql`
      SELECT 
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(jel.debit), 0) as total_debit,
        COALESCE(SUM(jel.credit), 0) as total_credit,
        COALESCE(a.balance, 0) as balance
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
      WHERE (je.date IS NULL OR je.date <= ${targetDate}::date)
        AND (je.status IS NULL OR je.status = 'POSTED')
      GROUP BY a.id, a.code, a.name, a.type, a.balance
      ORDER BY a.code
    `);

        const accounts = result.rows || [];

        let totalDebit = 0;
        let totalCredit = 0;

        const trialBalanceAccounts = accounts.map(a => {
            const debit = parseFloat(a.total_debit || 0);
            const credit = parseFloat(a.total_credit || 0);
            const balance = parseFloat(a.balance || 0);

            totalDebit += debit;
            totalCredit += credit;

            return {
                code: a.code,
                name: a.name,
                type: a.type,
                debit,
                credit,
                balance
            };
        });

        return {
            reportName: 'Trial Balance',
            asOfDate: targetDate,
            accounts: trialBalanceAccounts,
            totals: {
                debit: totalDebit,
                credit: totalCredit,
                balanced: Math.abs(totalDebit - totalCredit) < 0.01
            }
        };
    } catch (error) {
        console.error('Trial balance generation error:', error);
        throw error;
    }
};

export const generateGeneralLedger = async (startDate, endDate, accountId) => {
    try {
        const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        let accountFilter = sql``;
        if (accountId) {
            accountFilter = sql`AND a.id = ${accountId}`;
        }

        const result = await db.execute(sql`
      SELECT 
        je.id as entry_id,
        je.date,
        je.description,
        je.reference,
        a.code as account_code,
        a.name as account_name,
        jel.debit,
        jel.credit,
        jel.description as line_description
      FROM journal_entries je
      JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
      JOIN accounts a ON a.id = jel.account_id
      WHERE je.date >= ${start}::date 
        AND je.date <= ${end}::date
        AND je.status = 'POSTED'
        ${accountFilter}
      ORDER BY je.date, je.id, a.code
    `);

        const entries = result.rows || [];

        return {
            reportName: 'General Ledger',
            period: { startDate: start, endDate: end },
            accountId: accountId || 'All',
            entries: entries.map(e => ({
                entryId: e.entry_id,
                date: e.date,
                description: e.description,
                reference: e.reference,
                accountCode: e.account_code,
                accountName: e.account_name,
                debit: parseFloat(e.debit || 0),
                credit: parseFloat(e.credit || 0),
                lineDescription: e.line_description
            })),
            totalEntries: entries.length
        };
    } catch (error) {
        console.error('General ledger generation error:', error);
        throw error;
    }
};

export const generateAgedReceivables = async (asOfDate) => {
    try {
        const targetDate = asOfDate || new Date().toISOString().split('T')[0];

        // This is a simplified version - in production you'd track actual invoices
        const result = await db.execute(sql`
      SELECT 
        i.id,
        i.invoice_number,
        c.name as client_name,
        i.issue_date,
        i.due_date,
        i.grand_total,
        i.status,
        COALESCE(SUM(p.amount), 0) as paid_amount,
        (i.grand_total - COALESCE(SUM(p.amount), 0)) as outstanding,
        (${targetDate}::date - i.due_date::date) as days_overdue
      FROM invoices i
      JOIN clients c ON c.id = i.client_id
      LEFT JOIN payments p ON p.invoice_id = i.id
      WHERE i.status != 'PAID'
        AND i.issue_date <= ${targetDate}::date
      GROUP BY i.id, i.invoice_number, c.name, i.issue_date, i.due_date, i.grand_total, i.status
      ORDER BY days_overdue DESC
    `);

        const receivables = result.rows || [];

        const aging = {
            current: [],
            days_1_30: [],
            days_31_60: [],
            days_61_90: [],
            over_90: []
        };

        receivables.forEach(r => {
            const days = parseInt(r.days_overdue || 0);
            const item = {
                invoiceNumber: r.invoice_number,
                clientName: r.client_name,
                issueDate: r.issue_date,
                dueDate: r.due_date,
                amount: parseFloat(r.grand_total || 0),
                paidAmount: parseFloat(r.paid_amount || 0),
                outstanding: parseFloat(r.outstanding || 0),
                daysOverdue: days
            };

            if (days <= 0) aging.current.push(item);
            else if (days <= 30) aging.days_1_30.push(item);
            else if (days <= 60) aging.days_31_60.push(item);
            else if (days <= 90) aging.days_61_90.push(item);
            else aging.over_90.push(item);
        });

        return {
            reportName: 'Aged Receivables',
            asOfDate: targetDate,
            aging: {
                current: {
                    items: aging.current,
                    total: aging.current.reduce((sum, i) => sum + i.outstanding, 0)
                },
                days_1_30: {
                    items: aging.days_1_30,
                    total: aging.days_1_30.reduce((sum, i) => sum + i.outstanding, 0)
                },
                days_31_60: {
                    items: aging.days_31_60,
                    total: aging.days_31_60.reduce((sum, i) => sum + i.outstanding, 0)
                },
                days_61_90: {
                    items: aging.days_61_90,
                    total: aging.days_61_90.reduce((sum, i) => sum + i.outstanding, 0)
                },
                over_90: {
                    items: aging.over_90,
                    total: aging.over_90.reduce((sum, i) => sum + i.outstanding, 0)
                }
            },
            totalOutstanding: receivables.reduce((sum, r) => sum + parseFloat(r.outstanding || 0), 0)
        };
    } catch (error) {
        console.error('Aged receivables generation error:', error);
        throw error;
    }
};

export const generateAgedPayables = async (asOfDate) => {
    try {
        const targetDate = asOfDate || new Date().toISOString().split('T')[0];

        // This is a simplified version - in production you'd track actual purchase orders/bills
        const result = await db.execute(sql`
      SELECT 
        po.id,
        po.po_number,
        s.name as supplier_name,
        po.order_date,
        po.expected_delivery,
        po.total_amount,
        po.status,
        (${targetDate}::date - po.expected_delivery::date) as days_overdue
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.status IN ('APPROVED', 'SENT')
        AND po.order_date <= ${targetDate}::date
      ORDER BY days_overdue DESC
    `);

        const payables = result.rows || [];

        const aging = {
            current: [],
            days_1_30: [],
            days_31_60: [],
            days_61_90: [],
            over_90: []
        };

        payables.forEach(p => {
            const days = parseInt(p.days_overdue || 0);
            const item = {
                poNumber: p.po_number,
                supplierName: p.supplier_name,
                orderDate: p.order_date,
                expectedDelivery: p.expected_delivery,
                amount: parseFloat(p.total_amount || 0),
                status: p.status,
                daysOverdue: days
            };

            if (days <= 0) aging.current.push(item);
            else if (days <= 30) aging.days_1_30.push(item);
            else if (days <= 60) aging.days_31_60.push(item);
            else if (days <= 90) aging.days_61_90.push(item);
            else aging.over_90.push(item);
        });

        return {
            reportName: 'Aged Payables',
            asOfDate: targetDate,
            aging: {
                current: {
                    items: aging.current,
                    total: aging.current.reduce((sum, i) => sum + i.amount, 0)
                },
                days_1_30: {
                    items: aging.days_1_30,
                    total: aging.days_1_30.reduce((sum, i) => sum + i.amount, 0)
                },
                days_31_60: {
                    items: aging.days_31_60,
                    total: aging.days_31_60.reduce((sum, i) => sum + i.amount, 0)
                },
                days_61_90: {
                    items: aging.days_61_90,
                    total: aging.days_61_90.reduce((sum, i) => sum + i.amount, 0)
                },
                over_90: {
                    items: aging.over_90,
                    total: aging.over_90.reduce((sum, i) => sum + i.amount, 0)
                }
            },
            totalPayables: payables.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0)
        };
    } catch (error) {
        console.error('Aged payables generation error:', error);
        throw error;
    }
};
