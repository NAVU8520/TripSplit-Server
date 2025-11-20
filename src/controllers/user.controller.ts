import type { Response } from 'express';
import prisma from '../prisma.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const getUserByCustomerId = async (req: AuthRequest, res: Response) => {
    const { customerId } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { customerId: customerId as string },
            select: {
                id: true,
                customerId: true,
                email: true,
                name: true,
                avatar: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user by customer ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
