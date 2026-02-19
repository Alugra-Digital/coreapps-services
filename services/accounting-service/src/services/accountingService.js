import { db } from '../../../shared/db/index.js';
import { accounts, journalEntries, journalEntryLines } from '../../../shared/db/schema.js';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';

// Accounts
export const getAccounts = async () => {
  return await db.select().from(accounts).orderBy(accounts.code);
};

export const createAccount = async (data) => {
  const [account] = await db.insert(accounts).values(data).returning();
  return account;
};

export const updateAccount = async (id, data) => {
  const [account] = await db.update(accounts).set(data).where(eq(accounts.id, id)).returning();
  return account;
};

export const deleteAccount = async (id) => {
  await db.delete(accounts).where(eq(accounts.id, id));
};

// Journal Entries
export const getJournalEntries = async () => {
  return await db.select().from(journalEntries).orderBy(desc(journalEntries.date));
};

export const getJournalEntryById = async (id) => {
  const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
  if (!entry) return null;

  const lines = await db.select({
    id: journalEntryLines.id,
    accountId: journalEntryLines.accountId,
    accountName: accounts.name,
    accountCode: accounts.code,
    debit: journalEntryLines.debit,
    credit: journalEntryLines.credit,
    description: journalEntryLines.description,
  })
    .from(journalEntryLines)
    .leftJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
    .where(eq(journalEntryLines.journalEntryId, id));

  return { ...entry, lines };
};

export const createJournalEntry = async (data) => {
  const { lines, ...header } = data;

  // Calculate totals
  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

  // Basic validation: Debits must equal Credits for POSTED entries
  // But we allow DRAFT even if unbalanced.

  return await db.transaction(async (tx) => {
    const [entry] = await tx.insert(journalEntries).values({
      ...header,
      totalDebit,
      totalCredit,
    }).returning();

    if (lines && lines.length > 0) {
      const lineValues = lines.map(line => ({
        journalEntryId: entry.id,
        accountId: line.accountId,
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description,
        reference: line.reference
      }));
      await tx.insert(journalEntryLines).values(lineValues);
    }

    // If status is POSTED, update account balances
    if (entry.status === 'POSTED') {
      await applyJournalLinesToAccountBalances(tx, lines);
    }

    return entry;
  });
};

export const postJournalEntry = async (id) => {
  return await db.transaction(async (tx) => {
    const [entry] = await tx.select().from(journalEntries).where(eq(journalEntries.id, id));
    if (!entry) throw new Error('Journal Entry not found');
    if (entry.status === 'POSTED') throw new Error('Already posted');

    // Check balance
    if (Number(entry.totalDebit) !== Number(entry.totalCredit)) {
      throw new Error('Debits must equal Credits to post');
    }

    const lines = await tx.select().from(journalEntryLines).where(eq(journalEntryLines.journalEntryId, id));

    await applyJournalLinesToAccountBalances(tx, lines);

    const [updatedEntry] = await tx.update(journalEntries)
      .set({ status: 'POSTED', postedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning();

    return updatedEntry;
  });
};

export const applyJournalLinesToAccountBalances = async (tx, lines) => {
  for (const line of lines) {
    const [account] = await tx.select().from(accounts).where(eq(accounts.id, line.accountId));

    let balanceChange = 0;
    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);

    if (['ASSET', 'EXPENSE'].includes(account.type)) {
      balanceChange = debit - credit;
    } else {
      balanceChange = credit - debit;
    }

    await tx.update(accounts)
      .set({ balance: Number(account.balance || 0) + balanceChange })
      .where(eq(accounts.id, line.accountId));
  }
};

export const getTrialBalance = async ({ from, to } = {}) => {
  const filters = [eq(journalEntries.status, 'POSTED')];
  if (from) filters.push(gte(journalEntries.date, from));
  if (to) filters.push(lte(journalEntries.date, to));

  const movements = await db
    .select({
      accountId: journalEntryLines.accountId,
      debit: sql`COALESCE(SUM(${journalEntryLines.debit}), 0)`.mapWith(Number),
      credit: sql`COALESCE(SUM(${journalEntryLines.credit}), 0)`.mapWith(Number),
    })
    .from(journalEntryLines)
    .leftJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(and(...filters))
    .groupBy(journalEntryLines.accountId);

  const movementByAccountId = new Map(movements.map((m) => [m.accountId, m]));

  const accountRows = await db
    .select({
      id: accounts.id,
      code: accounts.code,
      name: accounts.name,
      type: accounts.type,
      balance: accounts.balance,
    })
    .from(accounts)
    .orderBy(asc(accounts.code));

  const rows = accountRows.map((account) => {
    const movement = movementByAccountId.get(account.id);
    const debit = movement?.debit ?? 0;
    const credit = movement?.credit ?? 0;
    return {
      ...account,
      debit,
      credit,
      netMovement: debit - credit,
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.debit += Number(row.debit || 0);
      acc.credit += Number(row.credit || 0);
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  return { rows, totals };
};

export const getGeneralLedger = async ({ accountId, from, to }) => {
  const filters = [eq(journalEntryLines.accountId, accountId), eq(journalEntries.status, 'POSTED')];
  if (from) filters.push(gte(journalEntries.date, from));
  if (to) filters.push(lte(journalEntries.date, to));

  const rows = await db
    .select({
      date: journalEntries.date,
      journalEntryId: journalEntries.id,
      reference: journalEntries.reference,
      entryDescription: journalEntries.description,
      lineDescription: journalEntryLines.description,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
    })
    .from(journalEntryLines)
    .leftJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(and(...filters))
    .orderBy(desc(journalEntries.date), desc(journalEntries.id));

  return rows;
};

export const getProfitAndLoss = async ({ from, to } = {}) => {
  const filters = [eq(journalEntries.status, 'POSTED')];
  if (from) filters.push(gte(journalEntries.date, from));
  if (to) filters.push(lte(journalEntries.date, to));

  const byType = await db
    .select({
      type: accounts.type,
      debit: sql`COALESCE(SUM(${journalEntryLines.debit}), 0)`.mapWith(Number),
      credit: sql`COALESCE(SUM(${journalEntryLines.credit}), 0)`.mapWith(Number),
    })
    .from(journalEntryLines)
    .leftJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .leftJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
    .where(and(...filters))
    .groupBy(accounts.type);

  const revenue = byType
    .filter((r) => String(r.type) === 'REVENUE')
    .reduce((sum, r) => sum + (Number(r.credit) - Number(r.debit)), 0);

  const expense = byType
    .filter((r) => String(r.type) === 'EXPENSE')
    .reduce((sum, r) => sum + (Number(r.debit) - Number(r.credit)), 0);

  return {
    revenue,
    expense,
    netIncome: revenue - expense,
  };
};

// AUTO POSTING LOGIC
export const autoPostInvoice = async (invoiceId) => {
  return await db.transaction(async (tx) => {
    const [invoice] = await tx.select().from(db.schema.invoices).where(eq(db.schema.invoices.id, invoiceId));
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.journalEntryId) throw new Error('Invoice already posted');

    // 1. Get Accounts (Assuming hardcoded codes for now as per plan)
    // 1100: Accounts Receivable (Asset)
    // 4100: Sales Revenue (Revenue)
    // 2100: VAT Out (Liability)

    const [arAccount] = await tx.select().from(accounts).where(eq(accounts.code, '1100'));
    const [salesAccount] = await tx.select().from(accounts).where(eq(accounts.code, '4100'));
    const [taxAccount] = await tx.select().from(accounts).where(eq(accounts.code, '2100'));

    if (!arAccount || !salesAccount || !taxAccount) {
      throw new Error('Required accounts (1100, 4100, 2100) not found in Chart of Accounts');
    }

    const subtotal = Number(invoice.subtotal);
    const ppn = Number(invoice.ppn);
    const grandTotal = Number(invoice.grandTotal);

    // 2. Create Journal Entry
    const [je] = await tx.insert(journalEntries).values({
      date: invoice.date,
      description: `Auto-post: Invoice ${invoice.number}`,
      reference: invoice.number,
      status: 'POSTED',
      totalDebit: grandTotal,
      totalCredit: grandTotal,
      postedAt: new Date()
    }).returning();

    // 3. Create Lines
    const lines = [
      { journalEntryId: je.id, accountId: arAccount.id, debit: grandTotal, credit: 0, description: `Receivable for ${invoice.number}` },
      { journalEntryId: je.id, accountId: salesAccount.id, debit: 0, credit: subtotal, description: `Sales Revenue for ${invoice.number}` },
      { journalEntryId: je.id, accountId: taxAccount.id, debit: 0, credit: ppn, description: `PPN for ${invoice.number}` }
    ];
    await tx.insert(journalEntryLines).values(lines);

    // 4. Update Balances
    await applyJournalLinesToAccountBalances(tx, lines);

    // 5. Link Invoice
    await tx.update(db.schema.invoices)
      .set({ journalEntryId: je.id })
      .where(eq(db.schema.invoices.id, invoiceId));

    return je;
  });
};

export const autoPostPayment = async (paymentId) => {
  return await db.transaction(async (tx) => {
    const [payment] = await tx.select().from(db.schema.paymentEntries).where(eq(db.schema.paymentEntries.id, paymentId));
    if (!payment) throw new Error('Payment not found');
    if (payment.journalEntryId) throw new Error('Payment already posted');

    const [invoice] = await tx.select().from(db.schema.invoices).where(eq(db.schema.invoices.id, payment.invoiceId));

    // 1001: Bank/Cash (Asset)
    // 1100: Accounts Receivable (Asset)
    const [bankAccount] = await tx.select().from(accounts).where(eq(accounts.code, payment.paymentMode === 'BANK' ? '1002' : '1001'));
    const [arAccount] = await tx.select().from(accounts).where(eq(accounts.code, '1100'));

    if (!bankAccount || !arAccount) {
      throw new Error('Required accounts (1100, 1001/1002) not found in Chart of Accounts');
    }

    const amount = Number(payment.amount);

    // 2. Create Journal Entry
    const [je] = await tx.insert(journalEntries).values({
      date: payment.date,
      description: `Auto-post: Payment for ${invoice.number}`,
      reference: payment.referenceNo || invoice.number,
      status: 'POSTED',
      totalDebit: amount,
      totalCredit: amount,
      postedAt: new Date()
    }).returning();

    // 3. Create Lines
    const lines = [
      { journalEntryId: je.id, accountId: bankAccount.id, debit: amount, credit: 0, description: `Collection for ${invoice.number}` },
      { journalEntryId: je.id, accountId: arAccount.id, debit: 0, credit: amount, description: `AR reduction for ${invoice.number}` }
    ];
    await tx.insert(journalEntryLines).values(lines);

    // 4. Update Balances
    await applyJournalLinesToAccountBalances(tx, lines);

    // 5. Link Payment
    await tx.update(db.schema.paymentEntries)
      .set({ journalEntryId: je.id })
      .where(eq(db.schema.paymentEntries.id, paymentId));

    return je;
  });
};
