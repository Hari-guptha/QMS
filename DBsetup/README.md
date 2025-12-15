# Database Setup Script

This folder contains scripts for setting up the QMS database, including creating the database, all tables, and initial admin user.

## Prerequisites

1. MySQL server must be installed and running
2. Environment variables must be configured in `.env` file:
   - `DB_HOST` (default: localhost)
   - `DB_PORT` (default: 3306)
   - `DB_USERNAME` (default: root)
   - `DB_PASSWORD` (default: empty)
   - `DB_DATABASE` (default: qms_db)
   - `ENCRYPTION_KEY` (optional, but recommended for production)

## Usage

### Quick Setup

Run the setup script using npm:

```bash
npm run setup:db
```

### Manual Execution

Alternatively, you can run the script directly with ts-node:

```bash
npx ts-node -r tsconfig-paths/register DBsetup/setup-database.ts
```

## What the Script Does

1. **Creates the Database**: Creates the MySQL database if it doesn't exist
2. **Creates All Tables**: Uses TypeORM synchronize to create all tables and schemas:
   - `users` - User accounts (Admin, Agent, Customer)
   - `categories` - Service categories
   - `agent_categories` - Many-to-many relationship between agents and categories
   - `tickets` - Queue tickets
3. **Creates Admin User**: Creates a default admin user with:
   - **Username/Email**: `masteradmin`
   - **Password**: `admin`
   - **Role**: Admin
   - **Status**: Active

## Default Admin Credentials

After running the setup script, you can log in with:

- **Username/Email**: `masteradmin`
- **Password**: `admin`

⚠️ **Important**: Change the default password immediately after first login!

## Troubleshooting

### Connection Refused Error

If you see `ECONNREFUSED` errors:
1. Ensure MySQL server is running
2. Check that the host and port in `.env` are correct
3. Verify MySQL credentials are correct

### Database Already Exists

The script will not fail if the database already exists. It will:
- Skip database creation
- Update tables if schema changed
- Update admin user if it exists

### Encryption Key Warning

If you see a warning about `ENCRYPTION_KEY`:
- For development: The script will use a default key (not secure)
- For production: Set `ENCRYPTION_KEY` in your `.env` file with a secure random string

## Schema Details

The script creates the following database schema:

### Users Table
- Stores user accounts (Admin, Agent, Customer)
- Encrypted fields: `firstName`, `lastName`, `phone`
- Unencrypted: `email` (for login)

### Categories Table
- Service categories for queue management
- Fields: `name`, `description`, `isActive`, `estimatedWaitTime`

### Agent Categories Table
- Links agents to categories they can handle
- Many-to-many relationship

### Tickets Table
- Queue tickets with status tracking
- Encrypted fields: `customerName`, `customerPhone`, `customerEmail`, `formData`
- Tracks ticket lifecycle: pending → called → serving → completed

## Notes

- The script uses TypeORM `synchronize: true` to create/update tables
- In production, consider using migrations instead of synchronize
- The admin user will be updated if it already exists (password and role reset)
