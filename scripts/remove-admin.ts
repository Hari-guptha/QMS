import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function removeAdmin() {
  const prisma = new PrismaClient();

  try {
    // Find the masteradmin user
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'masteradmin' },
          { email: 'masteradmin@qms.com' }
        ]
      },
      include: {
        tickets: true,
        agentCategories: true,
      }
    });

    if (!admin) {
      console.log('⚠️  Masteradmin user not found!');
      console.log('   No user with username "masteradmin" or email "masteradmin@qms.com" exists.');
      return;
    }

    console.log('📋 Found masteradmin user:');
    console.log(`   - ID: ${admin.id}`);
    console.log(`   - Username: ${admin.username}`);
    console.log(`   - Email: ${admin.email}`);
    console.log(`   - Role: ${admin.role}`);
    console.log(`   - Tickets: ${admin.tickets.length}`);
    console.log(`   - Agent-Category Assignments: ${admin.agentCategories.length}\n`);

    // Delete tickets associated with this user (if any)
    if (admin.tickets.length > 0) {
      console.log('🗑️  Deleting tickets...');
      const deletedTickets = await prisma.ticket.deleteMany({
        where: { agentId: admin.id },
      });
      console.log(`   ✓ Deleted ${deletedTickets.count} tickets`);
    }

    // Agent-category assignments will be deleted automatically due to CASCADE
    // But we can show what will be deleted
    if (admin.agentCategories.length > 0) {
      console.log(`🔗 ${admin.agentCategories.length} agent-category assignments will be deleted (CASCADE)\n`);
    }

    // Delete the user
    console.log('👤 Deleting masteradmin user...');
    await prisma.user.delete({
      where: { id: admin.id },
    });

    console.log('\n✅ Masteradmin user deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting masteradmin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const confirm = process.argv.includes('--confirm');
  
  if (!confirm) {
    console.log('⚠️  WARNING: This will delete the masteradmin user!');
    console.log('   Run with --confirm flag to proceed.\n');
    console.log('   Example: npm run remove-admin -- --confirm');
    process.exit(0);
  }

  await removeAdmin();
}

main()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

