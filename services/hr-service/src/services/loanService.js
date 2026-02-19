import { db } from '../../../shared/db/index.js';
import { employeeLoans, employees } from '../../../shared/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const applyLoan = async (data) => {
    const { employeeId, loanAmount, repaymentPeriods } = data;
    const repaymentAmount = (parseFloat(loanAmount) / parseInt(repaymentPeriods)).toFixed(2);

    return await db.insert(employeeLoans).values({
        employeeId,
        loanAmount,
        repaymentPeriods,
        repaymentAmount,
        remainingAmount: loanAmount,
        status: 'DRAFT'
    }).returning();
};

export const getActiveLoans = async (employeeId) => {
    return await db.select()
        .from(employeeLoans)
        .where(and(
            eq(employeeLoans.employeeId, employeeId),
            eq(employeeLoans.status, 'ACTIVE')
        ));
};

export const recordRepayment = async (loanId, amount) => {
    return await db.transaction(async (tx) => {
        const [loan] = await tx.select().from(employeeLoans).where(eq(employeeLoans.id, loanId));
        if (!loan) throw new Error('Loan not found');

        const newRemaining = (parseFloat(loan.remainingAmount) - parseFloat(amount)).toFixed(2);
        const newStatus = parseFloat(newRemaining) <= 0 ? 'CLOSED' : 'ACTIVE';

        return await tx.update(employeeLoans)
            .set({
                remainingAmount: newRemaining,
                status: newStatus,
                updatedAt: new Date()
            })
            .where(eq(employeeLoans.id, loanId))
            .returning();
    });
};
