import { PostgresDatabaseAdapter } from '@elizaos/adapter-postgres';
import dotenv from 'dotenv';

dotenv.config();

try {
    console.log('🔍 Inspecting PostgreSQL Adapter Structure');
    console.log('═'.repeat(50));
    
    const adapter = new PostgresDatabaseAdapter({
        connectionString: process.env.POSTGRES_URL,
    });
    
    console.log('✅ Adapter created successfully');
    console.log('📊 Adapter properties:');
    console.log('  typeof adapter:', typeof adapter);
    console.log('  adapter keys:', Object.keys(adapter));
    
    // Check common property names
    const possibleProps = ['db', 'client', 'pool', 'connection', 'database'];
    for (const prop of possibleProps) {
        console.log(`  adapter.${prop}:`, typeof adapter[prop], adapter[prop] ? '✅ exists' : '❌ missing');
    }
    
    // Check if it's a function-based interface
    console.log('\n🔧 Checking methods:');
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(adapter));
    console.log('  methods:', methods);
    
    // Check if it has query capability
    if (typeof adapter.query === 'function') {
        console.log('  ✅ adapter.query() method exists');
    }
    
    if (typeof adapter.exec === 'function') {
        console.log('  ✅ adapter.exec() method exists');
    }
    
} catch (error) {
    console.error('❌ Error inspecting adapter:', error.message);
} 