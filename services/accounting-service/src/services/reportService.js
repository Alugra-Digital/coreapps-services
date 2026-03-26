
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

export const generateTrialBalance = async (params) => {
    try {
        const { periodId, asOfDate, startDate, endDate } = params || {};
        let start = startDate;
        let end = endDate || asOfDate;

        if (periodId) {
            const periodResult = await db.execute(sql`
                SELECT year, month FROM accounting_periods WHERE id = ${periodId}
            `);
            const period = periodResult.rows[0];
            if (period) {
                start = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
                end = new Date(period.year, period.month, 0).toISOString().split('T')[0]; // last day of month
            }
        } else if (!end) {
            end = new Date().toISOString().split('T')[0];
        }

        // Fetch Accounts Structure
        const accountsResult = await db.execute(sql`
            SELECT id, code, name, type, is_group, parent_account_id
            FROM accounts
            ORDER BY code
        `);
        const accounts = accountsResult.rows || [];

        // Fetch Opening Balances (before start date if start date exists)
        let obCondition = sql`1=0`; // No OB if no start date
        if (start) {
            obCondition = sql`je.date < ${start}::date AND je.status = 'POSTED'`;
        } else {
            // if no start, opening balance is 0
        }

        // Fetch Period Mutations
        let mutationCondition = sql`je.date <= ${end}::date AND je.status = 'POSTED'`;
        if (start) {
            mutationCondition = sql`je.date >= ${start}::date AND je.date <= ${end}::date AND je.status = 'POSTED'`;
        }

        const obQuery = await db.execute(sql`
            SELECT jel.account_id, SUM(jel.debit) as debit, SUM(jel.credit) as credit
            FROM journal_entry_lines jel
            JOIN journal_entries je ON je.id = jel.journal_entry_id
            WHERE ${obCondition}
            GROUP BY jel.account_id
        `);

        const mutQuery = await db.execute(sql`
            SELECT jel.account_id, SUM(jel.debit) as debit, SUM(jel.credit) as credit
            FROM journal_entry_lines jel
            JOIN journal_entries je ON je.id = jel.journal_entry_id
            WHERE ${mutationCondition}
            GROUP BY jel.account_id
        `);

        const obData = (obQuery.rows || []).reduce((acc, row) => ({ ...acc, [row.account_id]: row }), {});
        const mutData = (mutQuery.rows || []).reduce((acc, row) => ({ ...acc, [row.account_id]: row }), {});

        let totalDebit = 0;
        let totalCredit = 0;

        const trialBalanceAccounts = accounts.map(a => {
            const ob = obData[a.id] || { debit: 0, credit: 0 };
            const mut = mutData[a.id] || { debit: 0, credit: 0 };

            let openingBalance = 0;
            let debit = parseFloat(mut.debit || 0);
            let credit = parseFloat(mut.credit || 0);

            if (['ASSET', 'EXPENSE'].includes(a.type)) {
                openingBalance = parseFloat(ob.debit || 0) - parseFloat(ob.credit || 0);
            } else {
                openingBalance = parseFloat(ob.credit || 0) - parseFloat(ob.debit || 0);
            }

            let closingBalance = 0;
            if (['ASSET', 'EXPENSE'].includes(a.type)) {
                closingBalance = openingBalance + debit - credit;
            } else {
                closingBalance = openingBalance + credit - debit;
            }

            if (!a.is_group) {
                totalDebit += debit;
                totalCredit += credit;
            }

            return {
                id: a.id,
                code: a.code,
                name: a.name,
                type: a.type,
                isGroup: a.is_group || false,
                parentAccountId: a.parent_account_id,
                openingBalance,
                debit,
                credit,
                closingBalance
            };
        });

        // Rollup
        const childrenMap = {};
        accounts.forEach(a => {
            if (a.parent_account_id) {
                if (!childrenMap[a.parent_account_id]) childrenMap[a.parent_account_id] = [];
                childrenMap[a.parent_account_id].push(a.id);
            }
        });

        const accountMap = trialBalanceAccounts.reduce((acc, a) => {
            acc[a.id] = a;
            return acc;
        }, {});

        const rollup = (id) => {
            const node = accountMap[id];
            if (!node.isGroup) {
                return { ob: node.openingBalance, db: node.debit, cr: node.credit, cb: node.closingBalance };
            }
            const children = childrenMap[id] || [];
            let sumOb = 0, sumDb = 0, sumCr = 0, sumCb = 0;
            for (const childId of children) {
                const childVals = rollup(childId);
                sumOb += childVals.ob;
                sumDb += childVals.db;
                sumCr += childVals.cr;
                sumCb += childVals.cb;
            }
            node.openingBalance = sumOb;
            node.debit = sumDb;
            node.credit = sumCr;
            node.closingBalance = sumCb;
            return { ob: sumOb, db: sumDb, cr: sumCr, cb: sumCb };
        };

        accounts.filter(a => !a.parent_account_id).forEach(a => rollup(a.id));

        return {
            reportName: 'Trial Balance',
            asOfDate: end,
            startDate: start,
            endDate: end,
            accounts: Object.values(accountMap).sort((a,b) => a.code.localeCompare(b.code)),
            totals: {
                openingBalance: trialBalanceAccounts.filter(a => !a.isGroup).reduce((sum, a) => sum + a.openingBalance, 0),
                debit: totalDebit,
                credit: totalCredit,
                closingBalance: trialBalanceAccounts.filter(a => !a.isGroup).reduce((sum, a) => sum + (['ASSET','EXPENSE'].includes(a.type) ? a.closingBalance : -a.closingBalance), 0),
                balanced: Math.abs(totalDebit - totalCredit) < 0.01
            }
        };
    } catch (error) {
        console.error('Trial balance generation error:', error);
        throw error;
    }
};

export const generateGeneralLedger = async (params) => {
    try {
        const { startDate, endDate, accountId, periodId, sourceModule } = params || {};
        let start = startDate;
        let end = endDate;

        if (periodId) {
            const periodResult = await db.execute(sql`
                SELECT year, month FROM accounting_periods WHERE id = ${periodId}
            `);
            const period = periodResult.rows[0];
            if (period) {
                start = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
                end = new Date(period.year, period.month, 0).toISOString().split('T')[0];
            }
        } else {
            start = start || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
            end = end || new Date().toISOString().split('T')[0];
        }

        let filters = [sql`je.status = 'POSTED'`];
        if (start) filters.push(sql`je.date >= ${start}::date`);
        if (end) filters.push(sql`je.date <= ${end}::date`);
        if (accountId) filters.push(sql`jel.account_id = ${accountId}`);
        if (sourceModule) {
            if (sourceModule === 'KAS_KECIL') filters.push(sql`je.reference LIKE 'VKK%'`);
            else if (sourceModule === 'KAS_BANK') filters.push(sql`je.reference LIKE 'VKB%'`);
            else if (sourceModule === 'JURNAL_MEMORIAL') filters.push(sql`je.reference LIKE 'JM%'`);
        }

        const whereClause = sql.join(filters, sql` AND `);

        const result = await db.execute(sql`
      SELECT 
        je.id as entry_id,
        je.date,
        je.description,
        je.reference,
        a.type as account_type,
        a.code as account_code,
        a.name as account_name,
        jel.debit,
        jel.credit,
        jel.description as line_description
      FROM journal_entries je
      JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
      JOIN accounts a ON a.id = jel.account_id
      WHERE ${whereClause}
      ORDER BY a.code, je.date, je.id
    `);

        const entries = result.rows || [];

        let openingBalanceFilters = [sql`je.status = 'POSTED'`];
        if (start) openingBalanceFilters.push(sql`je.date < ${start}::date`);
        if (accountId) openingBalanceFilters.push(sql`jel.account_id = ${accountId}`);

        const obWhereClause = sql.join(openingBalanceFilters, sql` AND `);

        const obResult = await db.execute(sql`
        SELECT 
            a.code as account_code,
            a.type as account_type,
            COALESCE(SUM(jel.debit), 0) as total_debit,
            COALESCE(SUM(jel.credit), 0) as total_credit
        FROM journal_entries je
        JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
        JOIN accounts a ON a.id = jel.account_id
        WHERE ${obWhereClause}
        GROUP BY a.code, a.type
        `);
        
        const accountBalances = {};
        (obResult.rows || []).forEach(row => {
            const debit = parseFloat(row.total_debit || 0);
            const credit = parseFloat(row.total_credit || 0);
            if (['ASSET', 'EXPENSE'].includes(row.account_type)) {
                accountBalances[row.account_code] = debit - credit;
            } else {
                accountBalances[row.account_code] = credit - debit;
            }
        });

        const enrichedEntries = entries.map(e => {
            if (accountBalances[e.account_code] === undefined) {
                accountBalances[e.account_code] = 0;
            }
            const debit = parseFloat(e.debit || 0);
            const credit = parseFloat(e.credit || 0);
            if (['ASSET', 'EXPENSE'].includes(e.account_type)) {
                accountBalances[e.account_code] += (debit - credit);
            } else {
                accountBalances[e.account_code] += (credit - debit);
            }
            return {
                entryId: e.entry_id,
                date: e.date,
                description: e.description,
                reference: e.reference,
                accountCode: e.account_code,
                accountName: e.account_name,
                debit: debit,
                credit: credit,
                runningBalance: accountBalances[e.account_code],
                lineDescription: e.line_description
            };
        });

        return {
            reportName: 'General Ledger',
            period: { startDate: start, endDate: end },
            accountId: accountId || 'All',
            entries: enrichedEntries,
            totalEntries: entries.length,
            openingBalances: accountBalances
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
        i.number as invoice_number,
        c.name as client_name,
        i.date as issue_date,
        i.due_date,
        i.grand_total,
        i.status,
        COALESCE(i.paid_amount, 0) as paid_amount,
        (i.grand_total - COALESCE(i.paid_amount, 0)) as outstanding,
        (${targetDate}::date - i.due_date::date) as days_overdue
      FROM invoices i
      JOIN clients c ON c.id = i.client_id
      WHERE i.status != 'PAID'
        AND i.date <= ${targetDate}::date
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
        po.number as po_number,
        po.supplier_name,
        po.date as order_date,
        po.grand_total as total_amount,
        po.status,
        (${targetDate}::date - po.date::date) as days_overdue
      FROM purchase_orders po
      WHERE po.status IN ('APPROVED', 'SENT')
        AND po.date <= ${targetDate}::date
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
