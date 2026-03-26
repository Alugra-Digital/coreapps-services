import { db } from '../../../shared/db/index.js';
import { employeeLoans, employees } from '../../../shared/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

export const getAllLoans = async () => {
    return await db.select().from(employeeLoans).orderBy(desc(employeeLoans.id));
};

export const applyLoan = async (data) => {
    const { employeeId, loanAmount, repaymentPeriods } = data;
    // Calculate repayment amount as number (not string)
    const numLoanAmount = parseFloat(loanAmount) || 0;
    const numRepaymentPeriods = parseInt(repaymentPeriods) || 1;
    const repaymentAmount = numRepaymentPeriods > 0 ? numLoanAmount / numRepaymentPeriods : 0;

    // Use proper Drizzle ORM insert instead of SQL template
    return await db.insert(employeeLoans).values({
        employeeId: typeof employeeId === 'string' && employeeId.startsWith('EMP-') ? parseInt(employeeId.slice(4), 10) : parseInt(employeeId, 10),
        loanAmount: numLoanAmount,
        repaymentPeriods: numRepaymentPeriods,
        repaymentAmount,
        remainingAmount: numLoanAmount,
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
