import type { Request, Response } from 'express';
import prisma from '../prisma.js';

// Admin endpoint to manually verify a user by email
export const manualVerify = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.emailVerified) {
            return res.json({ message: 'User already verified', email });
        }

        // Verify the user
        await prisma.user.update({
            where: { email },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });

        res.json({
            message: 'User verified successfully!',
            email,
            name: user.name
        });
    } catch (error) {
        console.error('Manual verification error:', error);
        res.status(500).json({ error: 'Failed to verify user' });
    }
};
