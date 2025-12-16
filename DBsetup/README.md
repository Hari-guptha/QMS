# Database Setup Script

This folder contains scripts for setting up the QMS database, including creating the database, all tables, and initial admin user.

## Prerequisites

1. **Microsoft SQL Server** must be installed and running (SQL Server 2017 or later, SQL Server Express is sufficient for development)
2. **SQL Server Authentication** must be enabled (Mixed Mode authentication)
3. Environment variables must be configured in `.env` file:
   - `DB_HOST` (default: localhost)
   - `DB_PORT` (default: 1433)
   - `DB_USERNAME` (default: sa)
   - `DB_PASSWORD` (default: empty - **must be set**)
   - `DB_DATABASE` (default: qms_db)
   - `DB_ENCRYPT` (default: true)
   - `DB_TRUST_CERT` (default: true)
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

1. **Creates the Database**: Creates the MS SQL Server database (`qms_db`) if it doesn't exist
2. **Initializes Encryption Service**: Sets up encryption for sensitive data fields
3. **Creates All Tables**: Uses TypeORM synchronize to create all tables and schemas:
   - `users` - User accounts (Admin, Agent, Customer)
   - `categories` - Service categories
   - `agent_categories` - Many-to-many relationship between agents and categories
   - `tickets` - Queue tickets
4. **Creates Admin User**: Creates a default admin user with:
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
1. Ensure SQL Server service is running
2. Check that the host and port in `.env` are correct (default port: 1433)
3. Verify SQL Server credentials are correct
4. Ensure SQL Server allows TCP/IP connections (check SQL Server Configuration Manager)
5. Check Windows Firewall settings if connecting remotely

### Authentication Failed Error

If you see authentication/login errors:
1. Verify username and password in `.env` file
2. Ensure SQL Server authentication is enabled (Mixed Mode)
3. Check that the user has CREATE DATABASE privileges
4. For SQL Server Express, ensure you're using the `sa` account or a user with sufficient privileges

### Database Already Exists

The script will not fail if the database already exists. It will:
- Skip database creation
- Update tables if schema changed
- Update admin user if it exists (resets password to `admin`)

### Port Warning

If you see a warning about port 3306 or 5432:
- These are default ports for MySQL and PostgreSQL respectively
- MS SQL Server default port is 1433
- Update your `.env` file with correct MS SQL Server settings:
  ```
  DB_PORT=1433
  DB_USERNAME=sa
  ```

### Encryption Key Warning

If you see a warning about `ENCRYPTION_KEY`:
- For development: The script will use a default key (not secure)
- For production: Set `ENCRYPTION_KEY` in your `.env` file with a secure 64-character hex string
- Generate a key using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### SSL/TLS Certificate Errors

If you see certificate errors:
- For local development: Set `DB_TRUST_CERT=true` in `.env`
- For production: Configure proper SSL certificates and set `DB_ENCRYPT=true`

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
