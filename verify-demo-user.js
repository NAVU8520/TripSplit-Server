import prisma from './src/prisma.js';

async function verifyDemoUser() {
    const user = await prisma.user.findUnique({
        where: { email: 'demouser@example.com' },
    });

    if (user) {
        await prisma.user.update({
            where: { email: 'demouser@example.com' },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });
        console.log(`✅ Verified user: ${user.email}`);
        console.log(`   Customer ID: ${user.customerId}`);
        console.log(`   Name: ${user.name}`);
    } else {
        console.log('❌ User not found');
    }

    await prisma.$disconnect();
}

verifyDemoUser();
