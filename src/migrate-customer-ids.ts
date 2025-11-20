import { migrateExistingUsers } from './utils/customerIdGenerator.js';

// Run migration
migrateExistingUsers()
    .then(() => {
        console.log('✅ Customer ID migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
