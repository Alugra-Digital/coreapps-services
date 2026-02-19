import { db } from '../../../shared/db/index.js';
import { accounts, journalEntries, journalEntryLines } from '../../../shared/db/schema.js';
import { eq, sql } from 'drizzle-orm';

/**
 * Apply journal entry lines to account balances
 * This function updates the account balances based on journal entry lines
 * @param {Array} journalLines - Array of journal entry lines with accountId, debit, and credit
 * @returns {Promise<void>}
 */
export const applyJournalLinesToAccountBalances = async (journalLines) => {
    return await db.transaction(async (tx) => {
        for (const line of journalLines) {
            const { accountId, debit, credit } = line;

            // Update account balance
            // Debit increases asset/expense accounts, Credit increases liability/revenue accounts
            const balanceChange = parseFloat(debit || 0) - parseFloat(credit || 0);

            await tx.update(accounts)
                .set({
                    balance: sql`${accounts.balance} + ${balanceChange}`,
                    updatedAt: new Date()
                })
                .where(eq(accounts.id, accountId));
        }
    });
};

/**
 * Create a journal entry with lines
 * @param {Object} entryData - Journal entry data
 * @param {Array} lines - Array of journal entry lines
 * @returns {Promise<Object>} - Created journal entry with lines
 */
export const createJournalEntry = async (entryData, lines) => {
    return await db.transaction(async (tx) => {
        // Create journal entry
        const [entry] = await tx.insert(journalEntries).values(entryData).returning();

        // Create journal entry lines
        const linesWithEntryId = lines.map(line => ({
            ...line,
            journalEntryId: entry.id
        }));

        const createdLines = await tx.insert(journalEntryLines).values(linesWithEntryId).returning();

        // Apply to account balances
        await applyJournalLinesToAccountBalances(createdLines);

        return { entry, lines: createdLines };
    });
};
