import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTicketStatuses() {
  try {
    console.log('Checking for tickets with status "no_show" or "cancelled"...\n');

    // Check for no_show tickets
    const noShowTickets = await prisma.ticket.findMany({
      where: {
        status: 'no_show',
      },
      select: {
        id: true,
        tokenNumber: true,
        status: true,
        customerName: true,
        createdAt: true,
        noShowAt: true,
      },
      take: 10, // Limit to first 10 for preview
    });

    // Check for cancelled tickets
    const cancelledTickets = await prisma.ticket.findMany({
      where: {
        status: 'cancelled',
      },
      select: {
        id: true,
        tokenNumber: true,
        status: true,
        customerName: true,
        createdAt: true,
      },
      take: 10, // Limit to first 10 for preview
    });

    // Get counts
    const noShowCount = await prisma.ticket.count({
      where: {
        status: 'no_show',
      },
    });

    const cancelledCount = await prisma.ticket.count({
      where: {
        status: 'cancelled',
      },
    });

    console.log('=== RESULTS ===\n');
    console.log(`Total tickets with status "no_show": ${noShowCount}`);
    console.log(`Total tickets with status "cancelled": ${cancelledCount}\n`);

    if (noShowCount > 0) {
      console.log(`\nFirst ${Math.min(10, noShowCount)} "no_show" tickets:`);
      noShowTickets.forEach((ticket, index) => {
        console.log(`${index + 1}. Token: ${ticket.tokenNumber}, Customer: ${ticket.customerName || 'N/A'}, Created: ${ticket.createdAt}, No Show At: ${ticket.noShowAt || 'N/A'}`);
      });
    }

    if (cancelledCount > 0) {
      console.log(`\nFirst ${Math.min(10, cancelledCount)} "cancelled" tickets:`);
      cancelledTickets.forEach((ticket, index) => {
        console.log(`${index + 1}. Token: ${ticket.tokenNumber}, Customer: ${ticket.customerName || 'N/A'}, Created: ${ticket.createdAt}`);
      });
    }

    if (noShowCount === 0 && cancelledCount === 0) {
      console.log('✓ No tickets found with status "no_show" or "cancelled"');
    }

    // Get all status counts for reference
    const allStatusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    console.log('\n=== ALL STATUS COUNTS ===');
    allStatusCounts.forEach((group) => {
      console.log(`${group.status}: ${group._count.id}`);
    });

  } catch (error) {
    console.error('Error checking ticket statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTicketStatuses();

