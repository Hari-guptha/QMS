import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';

// Load environment variables
config();

const configService = new ConfigService();

async function updateTicketStatusEnum() {
  const connection = await createConnection({
    host: configService.get('DB_HOST', 'localhost'),
    port: parseInt(configService.get('DB_PORT', '3306')),
    user: configService.get('DB_USERNAME', 'root'),
    password: configService.get('DB_PASSWORD', ''),
    database: configService.get('DB_DATABASE', 'qms_db'),
    multipleStatements: true,
  });

  try {
    console.log('🔄 Updating ticket status enum to include HOLD...\n');

    // Check current enum values
    const [columns] = await connection.query<any[]>(
      `SHOW COLUMNS FROM tickets WHERE Field = 'status'`
    );

    if (columns.length === 0) {
      console.error('❌ Status column not found in tickets table');
      return;
    }

    const columnInfo = columns[0];
    console.log('Current status column definition:', columnInfo.Type);

    // Check if 'hold' already exists
    if (columnInfo.Type.includes("'hold'")) {
      console.log('✅ HOLD status already exists in enum');
      return;
    }

    // Update the enum to include 'hold'
    // MySQL requires recreating the column with the new enum values
    console.log('📝 Altering status column to include HOLD...');

    await connection.query(`
      ALTER TABLE tickets 
      MODIFY COLUMN status ENUM(
        'pending',
        'called',
        'serving',
        'completed',
        'no_show',
        'hold',
        'cancelled'
      ) NOT NULL DEFAULT 'pending'
    `);

    console.log('✅ Successfully updated ticket status enum to include HOLD');
    console.log('\n📋 New enum values:');
    console.log('   - pending');
    console.log('   - called');
    console.log('   - serving');
    console.log('   - completed');
    console.log('   - no_show');
    console.log('   - hold (NEW)');
    console.log('   - cancelled');

  } catch (error: any) {
    console.error('❌ Error updating enum:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('ℹ️  HOLD status may already exist');
    }
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the update
updateTicketStatusEnum()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

