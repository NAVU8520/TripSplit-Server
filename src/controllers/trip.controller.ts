import type { Request, Response } from 'express';
import prisma from '../prisma.js';

// Helper function to calculate balances
function calculateBalances(trip: any) {
    const balances: Record<string, number> = {};

    // Initialize balances for all participants
    trip.participants.forEach((p: any) => {
        balances[p.userId] = 0;
    });

    // Calculate balances based on expenses
    trip.expenses.forEach((expense: any) => {
        // Payer gets credited
        balances[expense.payerId] = (balances[expense.payerId] || 0) + expense.amount;

        // Each split participant gets debited
        expense.splits.forEach((split: any) => {
            const participant = trip.participants.find((p: any) => p.id === split.participantId);
            if (participant) {
                balances[participant.userId] = (balances[participant.userId] || 0) - split.amount;
            }
        });
    });

    // Convert balances to settlements (who owes whom)
    const settlements: Array<{
        from: any;
        to: any;
        amount: number;
    }> = [];

    const userBalances = Object.entries(balances).map(([userId, balance]) => {
        const participant = trip.participants.find((p: any) => p.userId === userId);
        return {
            userId,
            user: participant?.user,
            balance
        };
    });

    // Separate debtors and creditors
    const debtors = userBalances.filter(ub => ub.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = userBalances.filter(ub => ub.balance > 0).sort((a, b) => b.balance - a.balance);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i]!;
        const creditor = creditors[j]!;
        const amount = Math.min(-debtor.balance, creditor.balance);

        if (amount > 0.01) { // Ignore very small amounts due to floating point
            settlements.push({
                from: debtor.user,
                to: creditor.user,
                amount: Math.round(amount * 100) / 100
            });
        }

        debtor.balance += amount;
        creditor.balance -= amount;

        if (Math.abs(debtor.balance) < 0.01) i++;
        if (Math.abs(creditor.balance) < 0.01) j++;
    }

    return { balances: userBalances, settlements };
}


export const createTrip = async (req: Request, res: Response) => {
    const { name, baseCurrency, creatorId } = req.body;

    if (!name || !baseCurrency || !creatorId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const trip = await prisma.trip.create({
            data: {
                name,
                baseCurrency,
                creatorId,
                participants: {
                    create: {
                        userId: creatorId,
                    },
                },
            },
            include: {
                participants: true,
            },
        });

        res.json(trip);
    } catch (error) {
        console.error('Create trip error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTrips = async (req: Request, res: Response) => {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const trips = await prisma.trip.findMany({
            where: {
                participants: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                creator: true,
                participants: {
                    include: {
                        user: true
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(trips);
    } catch (error) {
        console.error('Get trips error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTrip = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Trip ID is required' });
    }

    try {
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: true
                    }
                },
                expenses: {
                    include: {
                        payer: true,
                        splits: true
                    },
                    orderBy: {
                        date: 'desc'
                    }
                }
            },
        });

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Calculate balances and settlements
        const { balances, settlements } = calculateBalances(trip);

        res.json({
            ...trip,
            balances,
            settlements
        });
    } catch (error) {
        console.error('Get trip error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addParticipant = async (req: Request, res: Response) => {
    const { id: tripId } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }

    try {
        // Check if trip exists
        const trip = await prisma.trip.findUnique({
            where: { id: tripId as string },
        });

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Find user by customer ID
        const user = await prisma.user.findUnique({
            where: { customerId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found with this customer ID' });
        }

        // Check if user is already a participant
        const existingParticipant = await prisma.participant.findFirst({
            where: {
                tripId: tripId as string,
                userId: user.id,
            },
        });

        if (existingParticipant) {
            return res.status(400).json({ error: 'User is already a participant' });
        }

        // Add participant
        await prisma.participant.create({
            data: {
                tripId: tripId as string,
                userId: user.id,
            },
        });

        // Return updated trip with participants
        const updatedTrip = await prisma.trip.findUnique({
            where: { id: tripId as string },
            include: {
                creator: true,
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        res.json(updatedTrip);
    } catch (error) {
        console.error('Add participant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
