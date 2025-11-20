import prisma from '../prisma.js';
// Generate customer ID: First letter of name + 9-digit number
async function generateCustomerId(name) {
    const firstLetter = (name && name.length > 0) ? name.charAt(0).toUpperCase() : 'U';
    let customerId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    while (!isUnique && attempts < maxAttempts) {
        // Generate 9-digit random number
        const randomNumber = Math.floor(100000000 + Math.random() * 900000000);
        customerId = `${firstLetter}${randomNumber}`;
        // Check if this ID already exists
        const existing = await prisma.user.findUnique({
            where: { customerId },
        });
        if (!existing) {
            isUnique = true;
            return customerId;
        }
        attempts++;
    }
    // Fallback: use timestamp if we couldn't generate unique ID
    const timestamp = Date.now().toString().slice(-9);
    return `${firstLetter}${timestamp}`;
}
// Migration: Generate customer IDs for existing users
async function migrateExistingUsers() {
    const users = await prisma.user.findMany({
        where: {
            customerId: null,
        },
    });
    console.log(`Found ${users.length} users without customer IDs`);
    for (const user of users) {
        const customerId = await generateCustomerId(user.name || user.email);
        await prisma.user.update({
            where: { id: user.id },
            data: { customerId },
        });
        console.log(`Generated customer ID ${customerId} for user ${user.email}`);
    }
    console.log('Migration complete!');
}
export { generateCustomerId, migrateExistingUsers };
//# sourceMappingURL=customerIdGenerator.js.map