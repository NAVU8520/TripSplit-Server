import prisma from './prisma.js';
async function verifyDemoUser() {
    const email = 'navneethrocks8@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (user) {
        await prisma.user.update({
            where: { email },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });
        console.log(`✅ Verified user: ${user.email}`);
        console.log(`   Customer ID: ${user.customerId}`);
        console.log(`   Name: ${user.name}`);
    }
    else {
        console.log('❌ User not found');
    }
    await prisma.$disconnect();
}
verifyDemoUser();
//# sourceMappingURL=verify-demo-user.js.map