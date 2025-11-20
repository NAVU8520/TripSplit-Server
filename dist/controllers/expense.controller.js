import prisma from '../prisma.js';
export const createExpense = async (req, res) => {
    const { tripId, title, amount, currency, payerId, category, splits, date } = req.body;
    if (!tripId || !title || !amount || !currency || !payerId || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        // Verify trip exists
        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: { participants: true }
        });
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        // Default split: equal split among all participants if not provided
        let expenseSplits = splits;
        if (!expenseSplits) {
            const count = trip.participants.length;
            const share = amount / count;
            expenseSplits = trip.participants.map((p) => ({
                participantId: p.id,
                amount: share
            }));
        }
        const expense = await prisma.expense.create({
            data: {
                tripId,
                title,
                amount: parseFloat(amount),
                currency,
                payerId,
                category,
                date: date ? new Date(date) : new Date(),
                splits: {
                    create: expenseSplits.map((s) => ({
                        participantId: s.participantId,
                        amount: s.amount,
                        percentage: s.percentage
                    }))
                }
            },
            include: {
                splits: true,
                payer: true
            }
        });
        res.json(expense);
    }
    catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getExpenses = async (req, res) => {
    const { tripId } = req.query;
    if (!tripId || typeof tripId !== 'string') {
        return res.status(400).json({ error: 'Trip ID is required' });
    }
    try {
        const expenses = await prisma.expense.findMany({
            where: { tripId },
            include: {
                payer: true,
                splits: {
                    include: {
                        participant: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
        res.json(expenses);
    }
    catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=expense.controller.js.map