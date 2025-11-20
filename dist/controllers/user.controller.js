import prisma from '../prisma.js';
export const getUserByCustomerId = async (req, res) => {
    const { customerId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { customerId: customerId },
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
    }
    catch (error) {
        console.error('Get user by customer ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=user.controller.js.map