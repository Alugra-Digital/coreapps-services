import { faker } from '@faker-js/faker';

export function generateChartOfAccounts() {
  const accounts = [
    // ASSETS
    { code: '1000', name: 'Assets', type: 'ASSET', isGroup: true, parentCode: null },
    { code: '1100', name: 'Current Assets', type: 'ASSET', isGroup: true, parentCode: '1000' },
    { code: '1101', name: 'Cash on Hand', type: 'ASSET', isGroup: false, parentCode: '1100' },
    { code: '1102', name: 'Bank Account', type: 'ASSET', isGroup: false, parentCode: '1100' },
    { code: '1103', name: 'Petty Cash', type: 'ASSET', isGroup: false, parentCode: '1100' },
    { code: '1200', name: 'Accounts Receivable', type: 'ASSET', isGroup: true, parentCode: '1000' },
    { code: '1201', name: 'Trade Receivables', type: 'ASSET', isGroup: false, parentCode: '1200' },
    { code: '1202', name: 'Allowance for Doubtful Accounts', type: 'ASSET', isGroup: false, parentCode: '1200' },
    { code: '1300', name: 'Inventory', type: 'ASSET', isGroup: true, parentCode: '1000' },
    { code: '1301', name: 'Raw Materials', type: 'ASSET', isGroup: false, parentCode: '1300' },
    { code: '1302', name: 'Work in Progress', type: 'ASSET', isGroup: false, parentCode: '1300' },
    { code: '1303', name: 'Finished Goods', type: 'ASSET', isGroup: false, parentCode: '1300' },
    { code: '1400', name: 'Fixed Assets', type: 'ASSET', isGroup: true, parentCode: '1000' },
    { code: '1401', name: 'Land', type: 'ASSET', isGroup: false, parentCode: '1400' },
    { code: '1402', name: 'Buildings', type: 'ASSET', isGroup: false, parentCode: '1400' },
    { code: '1403', name: 'Machinery & Equipment', type: 'ASSET', isGroup: false, parentCode: '1400' },
    { code: '1404', name: 'Vehicles', type: 'ASSET', isGroup: false, parentCode: '1400' },
    { code: '1405', name: 'Accumulated Depreciation', type: 'ASSET', isGroup: false, parentCode: '1400' },
    
    // LIABILITIES
    { code: '2000', name: 'Liabilities', type: 'LIABILITY', isGroup: true, parentCode: null },
    { code: '2100', name: 'Current Liabilities', type: 'LIABILITY', isGroup: true, parentCode: '2000' },
    { code: '2101', name: 'Accounts Payable', type: 'LIABILITY', isGroup: false, parentCode: '2100' },
    { code: '2102', name: 'Short-term Loans', type: 'LIABILITY', isGroup: false, parentCode: '2100' },
    { code: '2103', name: 'Accrued Expenses', type: 'LIABILITY', isGroup: false, parentCode: '2100' },
    { code: '2104', name: 'Tax Payable', type: 'LIABILITY', isGroup: false, parentCode: '2100' },
    { code: '2200', name: 'Long-term Liabilities', type: 'LIABILITY', isGroup: true, parentCode: '2000' },
    { code: '2201', name: 'Long-term Loans', type: 'LIABILITY', isGroup: false, parentCode: '2200' },
    { code: '2202', name: 'Bonds Payable', type: 'LIABILITY', isGroup: false, parentCode: '2200' },
    
    // EQUITY
    { code: '3000', name: 'Equity', type: 'EQUITY', isGroup: true, parentCode: null },
    { code: '3100', name: 'Share Capital', type: 'EQUITY', isGroup: false, parentCode: '3000' },
    { code: '3200', name: 'Retained Earnings', type: 'EQUITY', isGroup: false, parentCode: '3000' },
    { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', isGroup: false, parentCode: '3000' },
    
    // REVENUE
    { code: '4000', name: 'Revenue', type: 'REVENUE', isGroup: true, parentCode: null },
    { code: '4100', name: 'Sales Revenue', type: 'REVENUE', isGroup: false, parentCode: '4000' },
    { code: '4200', name: 'Service Revenue', type: 'REVENUE', isGroup: false, parentCode: '4000' },
    { code: '4300', name: 'Other Income', type: 'REVENUE', isGroup: false, parentCode: '4000' },
    
    // EXPENSES
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', isGroup: true, parentCode: null },
    { code: '5100', name: 'Direct Materials', type: 'EXPENSE', isGroup: false, parentCode: '5000' },
    { code: '5200', name: 'Direct Labor', type: 'EXPENSE', isGroup: false, parentCode: '5000' },
    { code: '5300', name: 'Manufacturing Overhead', type: 'EXPENSE', isGroup: false, parentCode: '5000' },
    
    { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', isGroup: true, parentCode: null },
    { code: '6100', name: 'Salaries & Wages', type: 'EXPENSE', isGroup: false, parentCode: '6000' },
    { code: '6200', name: 'Rent Expense', type: 'EXPENSE', isGroup: false, parentCode: '6000' },
    { code: '6300', name: 'Utilities', type: 'EXPENSE', isGroup: false, parentCode: '6000' },
    { code: '6400', name: 'Insurance', type: 'EXPENSE', isGroup: false, parentCode: '6000' },
    { code: '6500', name: 'Depreciation Expense', type: 'EXPENSE', isGroup: false, parentCode: '6000' },
    { code: '6600', name: 'Marketing & Advertising', type: 'EXPENSE', isGroup: false, parentCode: '6000' },
    { code: '6700', name: 'Travel & Entertainment', type: 'EXPENSE', isGroup: false, parentCode: '6000' },
    { code: '6800', name: 'Office Supplies', type: 'EXPENSE', isGroup: false, parentCode: '6000' },
    { code: '6900', name: 'Professional Fees', type: 'EXPENSE', isGroup: false, parentCode: '6000' }
  ];
  
  return accounts.map(acc => ({
    ...acc,
    balance: acc.isGroup ? 0 : faker.number.float({ min: 0, max: 10000000000, precision: 0.01 }),
    description: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    createdAt: faker.date.past({ years: 2 }),
    updatedAt: faker.date.recent({ days: 30 })
  }));
}

export function generateJournalEntries(accounts, count = 5000) {
  const entryTypes = [
    { type: 'Sales', debitAccounts: ['1102', '1201'], creditAccounts: ['4100'], },
    { type: 'Purchase', debitAccounts: ['1301', '5100'], creditAccounts: ['1102', '2101'] },
    { type: 'Salary Payment', debitAccounts: ['6100'], creditAccounts: ['1102'] },
    { type: 'Rent Payment', debitAccounts: ['6200'], creditAccounts: ['1102'] },
    { type: 'Depreciation', debitAccounts: ['6500'], creditAccounts: ['1405'] },
    { type: 'Loan Payment', debitAccounts: ['2102'], creditAccounts: ['1102'] }
  ];
  
  const accountsMap = {};
  accounts.forEach(acc => {
    accountsMap[acc.code] = acc;
  });
  
  return Array.from({ length: count }, (_, i) => {
    const entryTemplate = faker.helpers.arrayElement(entryTypes);
    const entryDate = faker.date.past({ years: 1 });
    
    const debitAccount = faker.helpers.arrayElement(entryTemplate.debitAccounts);
    const creditAccount = faker.helpers.arrayElement(entryTemplate.creditAccounts);
    
    const amount = faker.number.float({ min: 100000, max: 50000000, precision: 0.01 });
    
    const lines = [
      {
        accountCode: debitAccount,
        accountName: accountsMap[debitAccount]?.name || 'Unknown',
        debit: amount,
        credit: 0,
        description: `${entryTemplate.type} - Debit`
      },
      {
        accountCode: creditAccount,
        accountName: accountsMap[creditAccount]?.name || 'Unknown',
        debit: 0,
        credit: amount,
        description: `${entryTemplate.type} - Credit`
      }
    ];
    
    const status = faker.helpers.weightedArrayElement([
      { weight: 0.85, value: 'POSTED' },
      { weight: 0.10, value: 'DRAFT' },
      { weight: 0.05, value: 'CANCELLED' }
    ]);
    
    return {
      entryNumber: `JE-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      date: entryDate,
      description: entryTemplate.type,
      reference: `REF-${faker.string.alphanumeric(8).toUpperCase()}`,
      status,
      totalDebit: amount,
      totalCredit: amount,
      lines,
      postedAt: status === 'POSTED' ? entryDate : null,
      createdAt: entryDate,
      updatedAt: faker.date.between({ from: entryDate, to: new Date() })
    };
  });
}

export function generateBudgets(accounts, count = 50) {
  const fiscalYear = new Date().getFullYear();
  const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE' && !a.isGroup);
  
  return Array.from({ length: Math.min(count, expenseAccounts.length) }, (_, i) => {
    const account = expenseAccounts[i];
    const annualBudget = faker.number.int({ min: 10000000, max: 500000000 });
    
    return {
      accountCode: account.code,
      accountName: account.name,
      fiscalYear,
      period: 'Annual',
      budgetAmount: annualBudget,
      actualAmount: faker.number.float({ min: annualBudget * 0.7, max: annualBudget * 1.1, precision: 0.01 }),
      variance: 0, // Calculate based on actual vs budget
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
      createdAt: new Date(fiscalYear, 0, 1)
    };
  });
}
