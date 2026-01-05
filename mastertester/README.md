# Master Tester - Simulator Data Generator

This folder contains scripts to generate realistic test data for the Queue Management System (QMS) to simulate the entire product with all use cases.

## Overview

The simulator creates comprehensive test data including:
- **20 Agents** with encrypted personal information
- **10 Services/Categories** with descriptions and wait times
- **Agent-Service Assignments** (realistic distribution: each agent handles 1-3 categories, each category has 2-5 agents)
- **100 Tickets** across multiple dates (last 30 days) with various statuses:
  - 40% Completed
  - 20% Pending
  - 15% Serving
  - 10% Called
  - 10% No Show
  - 5% Hold

## Features

✅ **Realistic Data Distribution**
- Tickets spread across the last 30 days
- Realistic timestamps for ticket lifecycle (created → called → serving → completed)
- Proper token number generation per category per day
- Realistic service times (5-45 minutes)

✅ **Complete Ticket Lifecycle**
- Tickets with proper status transitions
- Realistic timestamps for each status change
- Position in queue properly set
- Notes added to completed and no-show tickets

✅ **Encrypted Data**
- All sensitive data (names, phones, emails) properly encrypted
- Uses the same encryption service as the main application

✅ **Analytics Ready**
- Data distributed across multiple dates for time-series analysis
- Various ticket statuses for completion rate calculations
- Agent performance metrics can be calculated
- Category statistics available

## Usage

### Add Simulator Data

To create all the simulator data:

```bash
npm run add-simulator-data
```

This will:
1. Create 20 agents with credentials (username: `agent1` to `agent20`, password: `agent123`)
2. Create 10 service categories
3. Assign agents to services
4. Create 100 tickets with realistic statuses and timestamps
5. Save metadata to `simulator-metadata.json` for easy cleanup

### Remove Simulator Data

To remove all simulator data:

```bash
npm run remove-simulator-data -- --confirm
```

**⚠️ Important:** The `--confirm` flag is required to prevent accidental deletion.

The removal script will:
1. Read the metadata file to identify all created records
2. Delete tickets, agent-category assignments, categories, and agents in the correct order
3. Remove the metadata file

If the metadata file is missing, the script will attempt to identify simulator data by patterns:
- Agents with email domain `qms-simulator.com`
- Categories matching the predefined service names

## Generated Data Details

### Agents
- **Count:** 20
- **Email Pattern:** `agent1@qms-simulator.com` to `agent20@qms-simulator.com`
- **Username:** `agent1` to `agent20`
- **Password:** `agent123` (hashed with bcrypt)
- **Employee IDs:** `QMS-AGT-001` to `QMS-AGT-020`
- **Counter Numbers:** `C1` to `C10` (first 10 agents)

### Services/Categories
1. Customer Service
2. Technical Support
3. Billing Inquiry
4. Account Management
5. Product Information
6. Complaint Resolution
7. Order Processing
8. Returns & Refunds
9. General Inquiry
10. VIP Services

### Tickets
- **Total:** 100 tickets
- **Date Range:** Last 30 days from execution date
- **Time Range:** 9 AM to 5 PM (business hours)
- **Status Distribution:**
  - Completed: 40 tickets
  - Pending: 20 tickets
  - Serving: 15 tickets
  - Called: 10 tickets
  - No Show: 10 tickets
  - Hold: 5 tickets

### Ticket Lifecycle Times
- **Time to Call:** 5-30 minutes after creation
- **Time to Start Serving:** 1-5 minutes after call
- **Service Time:** 5-45 minutes
- **No Show Timeout:** 10-20 minutes after call

## Testing Use Cases

This simulator data covers all major use cases in the QMS:

### Agent Dashboard
- ✅ View assigned queues
- ✅ See tickets in different statuses
- ✅ View ticket history
- ✅ Check position in queue

### Admin Dashboard
- ✅ View all queues across categories
- ✅ Monitor agent performance
- ✅ View analytics and statistics
- ✅ Manage categories and agents

### Analytics
- ✅ Completion rates
- ✅ Average service times
- ✅ Abandonment rates
- ✅ Agent performance metrics
- ✅ Category statistics
- ✅ Time-series data for charts

### Calendar View
- ✅ Tickets distributed across multiple dates
- ✅ Historical data for past 30 days
- ✅ Different statuses for filtering

### Public Display
- ✅ Queue status across categories
- ✅ Agent-specific queues
- ✅ Token numbers and positions

## Files

- `add-simulator-data.ts` - Script to create all simulator data
- `remove-simulator-data.ts` - Script to remove all simulator data
- `simulator-metadata.json` - Metadata file created by add script (auto-generated, do not edit)
- `README.md` - This file

## Notes

- The simulator uses the same encryption key from `ENCRYPTION_KEY` environment variable
- All data is properly encrypted as per the application's security requirements
- Token numbers are generated correctly per category per day
- Position in queue is properly maintained
- The script handles database transactions properly

## Troubleshooting

### Error: "ENCRYPTION_KEY not set"
- The script will use a default key (not secure for production)
- Set `ENCRYPTION_KEY` in your `.env` file for production-like testing

### Error: "Category not found or inactive"
- Ensure categories are created before tickets
- Check that categories are marked as active

### Error: "No active agents available for this category"
- The script assigns agents to categories automatically
- If this error occurs, check the agent-category assignments

### Metadata file missing
- If `simulator-metadata.json` is deleted, the removal script will use pattern matching
- This is less precise but should still work for cleanup

## Safety

- The removal script requires `--confirm` flag to prevent accidental deletion
- Metadata is stored locally in the `mastertester` folder
- All operations are logged to console for transparency
- The scripts use proper database transactions where applicable

