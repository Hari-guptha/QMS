import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

async function removeSimulatorData() {
  const prisma = new PrismaClient();

  try {
    console.log('🧹 Starting simulator data removal...\n');

    const metadataPath = path.join(__dirname, 'simulator-metadata.json');

    // Check if metadata file exists
    if (!fs.existsSync(metadataPath)) {
      console.log('⚠️  No simulator-metadata.json found.');
      console.log('   Attempting to remove data by identifying simulator entries...\n');
      
      // Fallback: Remove by identifying simulator data patterns
      await removeByPattern(prisma);
      return;
    }

    // Read metadata
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const { createdData } = metadata;

    console.log('📋 Found simulator metadata:');
    console.log(`   - Created: ${metadata.createdAt}`);
    console.log(`   - Agents: ${createdData.agentIds.length}`);
    console.log(`   - Categories: ${createdData.categoryIds.length}`);
    console.log(`   - Tickets: ${createdData.ticketIds.length}`);
    console.log(`   - Agent-Category Assignments: ${createdData.agentCategoryIds.length}\n`);

    // Step 1: Delete Tickets
    console.log('🗑️  Deleting tickets...');
    if (createdData.ticketIds.length > 0) {
      const deletedTickets = await prisma.ticket.deleteMany({
        where: { id: { in: createdData.ticketIds } },
      });
      console.log(`   ✓ Deleted ${deletedTickets.count} tickets`);
    }

    // Step 2: Delete Agent-Category Assignments
    console.log('🔗 Removing agent-category assignments...');
    if (createdData.agentCategoryIds.length > 0) {
      const deletedAssignments = await prisma.agentCategory.deleteMany({
        where: { id: { in: createdData.agentCategoryIds } },
      });
      console.log(`   ✓ Deleted ${deletedAssignments.count} agent-category assignments`);
    }

    // Step 3: Delete Categories
    console.log('📋 Deleting categories...');
    if (createdData.categoryIds.length > 0) {
      const deletedCategories = await prisma.category.deleteMany({
        where: { id: { in: createdData.categoryIds } },
      });
      console.log(`   ✓ Deleted ${deletedCategories.count} categories`);
    }

    // Step 4: Delete Agents
    console.log('👤 Deleting agents...');
    if (createdData.agentIds.length > 0) {
      const deletedAgents = await prisma.user.deleteMany({
        where: { id: { in: createdData.agentIds } },
      });
      console.log(`   ✓ Deleted ${deletedAgents.count} agents`);
    }

    // Step 5: Delete metadata file
    fs.unlinkSync(metadataPath);
    console.log('\n   ✓ Removed metadata file');

    console.log('\n✅ Simulator data removal completed!');

  } catch (error) {
    console.error('❌ Error removing simulator data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function removeByPattern(prisma: PrismaClient) {
  try {
    console.log('🔍 Searching for simulator data by patterns...\n');

    // Find agents by email pattern
    console.log('👤 Finding simulator agents...');
    const simulatorAgents = await prisma.user.findMany({
      where: {
        email: { contains: 'qms-simulator.com' },
        role: 'agent',
      },
    });
    console.log(`   Found ${simulatorAgents.length} simulator agents`);

    if (simulatorAgents.length > 0) {
      const agentIds = simulatorAgents.map(a => a.id);

      // Delete tickets for these agents
      console.log('🗑️  Deleting tickets...');
      const deletedTickets = await prisma.ticket.deleteMany({
        where: { agentId: { in: agentIds } },
      });
      console.log(`   ✓ Deleted ${deletedTickets.count} tickets`);

      // Delete agent-category assignments
      console.log('🔗 Removing agent-category assignments...');
      const deletedAssignments = await prisma.agentCategory.deleteMany({
        where: { agentId: { in: agentIds } },
      });
      console.log(`   ✓ Deleted ${deletedAssignments.count} agent-category assignments`);

      // Delete agents
      console.log('👤 Deleting agents...');
      const deletedAgents = await prisma.user.deleteMany({
        where: { id: { in: agentIds } },
      });
      console.log(`   ✓ Deleted ${deletedAgents.count} agents`);
    }

    // Find categories by name pattern (service names)
    console.log('\n📋 Finding simulator categories...');
    const serviceNames = [
      'Customer Service', 'Technical Support', 'Billing Inquiry', 'Account Management',
      'Product Information', 'Complaint Resolution', 'Order Processing', 'Returns & Refunds',
      'General Inquiry', 'VIP Services'
    ];

    const simulatorCategories = await prisma.category.findMany({
      where: {
        name: { in: serviceNames },
      },
    });
    console.log(`   Found ${simulatorCategories.length} simulator categories`);

    if (simulatorCategories.length > 0) {
      const categoryIds = simulatorCategories.map(c => c.id);

      // Delete any remaining tickets
      const remainingTickets = await prisma.ticket.deleteMany({
        where: { categoryId: { in: categoryIds } },
      });
      if (remainingTickets.count > 0) {
        console.log(`   ✓ Deleted ${remainingTickets.count} additional tickets`);
      }

      // Delete any remaining agent-category assignments
      const remainingAssignments = await prisma.agentCategory.deleteMany({
        where: { categoryId: { in: categoryIds } },
      });
      if (remainingAssignments.count > 0) {
        console.log(`   ✓ Deleted ${remainingAssignments.count} additional agent-category assignments`);
      }

      // Delete categories
      console.log('📋 Deleting categories...');
      const deletedCategories = await prisma.category.deleteMany({
        where: { id: { in: categoryIds } },
      });
      console.log(`   ✓ Deleted ${deletedCategories.count} categories`);
    }

    console.log('\n✅ Simulator data removal completed!');

  } catch (error) {
    console.error('❌ Error removing simulator data by pattern:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const confirm = process.argv.includes('--confirm');
  
  if (!confirm) {
    console.log('⚠️  WARNING: This will delete all simulator data!');
    console.log('   Run with --confirm flag to proceed.\n');
    console.log('   Example: npm run remove-simulator-data -- --confirm');
    process.exit(0);
  }

  await removeSimulatorData();
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

