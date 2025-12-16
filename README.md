# Queue Management System (QMS)

Universal Queue Management System - A completely generic, white-label Queue Management System that works for any business: Banks, Hospitals, Government Offices, Salons, Restaurants, Universities, DMVs, Clinics, etc.

This is a monorepo containing both the backend (NestJS) and frontend (Next.js) applications.

## Technology Stack

### Backend
- **Framework**: Node.js 20 + NestJS 10
- **Database**: Microsoft SQL Server (via TypeORM)
- **Real-Time**: Socket.io
- **Authentication**: JWT + Refresh Tokens
- **SMS**: Twilio
- **Email**: Resend
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-Time**: Socket.io Client
- **UI Components**: Custom components with Framer Motion

## Core Principles

1. **One separate queue per Agent/Counter** (not one big queue)
2. **Customers choose Service Category** → automatically routed to least busy Agent in that category
3. **Agents can only see and control their own queue**
4. **Admin has full visibility and override capability**
5. **Real-time everywhere** (Dashboards, Display Screens, Customer Status)
6. **Ticket printing + SMS + Email virtual tickets**
7. **Public REST API** for 3rd-party systems
8. **Analytics & Reports** available only to Admin
9. **Zero trust** – Agents cannot modify other queues

## Quick Start

For a quick setup, follow these essential steps:

1. **Install Prerequisites**: Node.js 20.x and Microsoft SQL Server
2. **Install Dependencies**: `npm install` (root) and `npm install` (frontend)
3. **Configure Environment**: Create `.env` with database and JWT settings (see [Environment Variables](#environment-variables-reference))
4. **Setup Database**: Run `npm run setup:db` to create database and admin user
5. **Start Backend**: `npm run start:dev` (runs on port 3000)
6. **Start Frontend**: `cd frontend && npm run dev` (runs on port 3001)
7. **Login**: Use `masteradmin` / `admin` (change password immediately!)

For detailed instructions, see the [Installation](#installation) section below.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 20.x (LTS recommended)
- **Microsoft SQL Server** (2017 or later) - SQL Server Express is sufficient for development
- **npm** (comes with Node.js)

## Installation

### Step 1: Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Configure Environment Variables

#### Backend Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration (MS SQL Server)
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=YourSQLServerPassword
DB_DATABASE=qms_db
DB_ENCRYPT=true
DB_TRUST_CERT=true

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# Encryption Key (for sensitive data encryption)
# Generate a secure 64-character hex key for production
ENCRYPTION_KEY=your-generated-64-character-hex-key-or-leave-empty-for-dev-default

# Application
PORT=3000
NODE_ENV=development

# Optional: Redis (for Socket.io scaling in production)
# REDIS_HOST=localhost
# REDIS_PORT=6379

# Optional: Twilio SMS Configuration
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=+1234567890

# Optional: Resend Email Configuration
# RESEND_API_KEY=your-resend-api-key
# RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Important Notes:**
- Replace `YourSQLServerPassword` with your actual SQL Server password
- For production, generate strong secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET` (minimum 32 characters)
- Generate a secure `ENCRYPTION_KEY` for production (64-character hex string)
- For local development with SQL Server Express, you may need to set `DB_TRUST_CERT=true` and `DB_ENCRYPT=false`

#### Frontend Configuration

Create a `frontend/.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Step 3: Database Setup

#### Prerequisites for Database Setup

1. **Ensure SQL Server is running** - Start SQL Server service on your machine
2. **Verify SQL Server Authentication** - Ensure SQL Server is configured for Mixed Mode authentication (SQL Server and Windows Authentication)
3. **Check SQL Server Port** - Default port is 1433. Verify it's open and accessible

#### Running the Database Setup Script

The setup script will:
- Create the database if it doesn't exist
- Create all required tables (Users, Categories, AgentCategories, Tickets)
- Create a default admin user

```bash
# Run the database setup script
npm run setup:db
```

**What the script does:**
1. Connects to SQL Server using credentials from `.env`
2. Creates the `qms_db` database if it doesn't exist
3. Initializes encryption service
4. Creates all database tables using TypeORM
5. Creates default admin user with credentials:
   - **Username/Email**: `masteradmin`
   - **Password**: `admin`

**⚠️ Security Warning**: Change the default admin password immediately after first login!

#### Troubleshooting Database Setup

**Connection Refused Error:**
- Ensure SQL Server service is running
- Check that port 1433 is correct (or your custom port)
- Verify host, username, and password in `.env` file
- Ensure SQL Server allows TCP/IP connections (check SQL Server Configuration Manager)

**Authentication Failed:**
- Verify username and password are correct
- Ensure SQL Server authentication is enabled (Mixed Mode)
- Check that the user has CREATE DATABASE privileges
- For SQL Server Express, ensure you're using the `sa` account or a user with sufficient privileges

**Database Already Exists:**
- The script will not fail if the database exists
- It will update tables if schema has changed
- It will update the admin user if it exists

**Port Warning:**
- If you see a warning about port 3306 or 5432, you may have incorrect database settings
- MS SQL Server default port is 1433
- Update your `.env` file with correct MS SQL Server settings

#### Manual Database Setup (Alternative)

If you prefer to set up the database manually:

1. **Create the database:**
   ```sql
   CREATE DATABASE qms_db;
   ```

2. **Update `.env`** with your database credentials

3. **Run the application** - Tables will be created automatically if `synchronize: true` is enabled (development only)

4. **Create admin user** - Use the script or manually insert:
   ```bash
   npm run setup:db
   ```

## Running the Application

### Backend

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/api`

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Development
npm run dev

# Production
npm run build
npm start
```

The frontend will be available at `http://localhost:3001` (or next available port)

## API Endpoints

### Public Endpoints (No Authentication)

- `POST /queue/check-in` - Customer check-in, create ticket
- `GET /queue/status` - Get public status page
- `GET /queue/ticket/:tokenNumber` - Get ticket by token number
- `GET /categories/public` - Get active categories

### Authentication

- `POST /auth/login` - Login (Agent/Admin)
- `POST /auth/refresh` - Refresh access token

### Agent Endpoints

- `GET /queue/agent/my-queue` - Get my queue
- `POST /queue/agent/call-next` - Call next ticket
- `PATCH /queue/agent/:ticketId/serving` - Mark as serving
- `PATCH /queue/agent/:ticketId/complete` - Mark as completed
- `PATCH /queue/agent/:ticketId/no-show` - Mark as no-show
- `PUT /queue/agent/reorder` - Reorder my queue
- `POST /queue/agent/:ticketId/transfer/:newAgentId` - Transfer ticket

### Admin Endpoints

#### Users Management
- `POST /users` - Create user
- `GET /users` - Get all users
- `GET /users/agents` - Get all agents
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Categories Management
- `POST /categories` - Create category
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category
- `POST /categories/:categoryId/assign-agent/:agentId` - Assign agent to category
- `DELETE /categories/:categoryId/remove-agent/:agentId` - Remove agent from category

#### Queue Management
- `GET /queue/admin/all` - Get all queues
- `GET /queue/admin/ticket/:id` - Get ticket by ID
- `PATCH /queue/admin/:ticketId/override` - Admin override any ticket

#### Analytics
- `GET /analytics/dashboard` - Get dashboard statistics
- `GET /analytics/avg-wait-time` - Average wait time
- `GET /analytics/avg-service-time` - Average service time
- `GET /analytics/peak-hours` - Peak hours heatmap
- `GET /analytics/abandonment-rate` - Abandonment rate
- `GET /analytics/agent-performance` - Agent performance ranking
- `GET /analytics/category-stats` - Category statistics
- `GET /analytics/export/excel` - Export to Excel

## Real-Time Events (Socket.io)

Connect to `ws://localhost:3000/queue` namespace:

### Client Events
- `join-agent-room` - Join agent's room (requires agentId)
- `join-category-room` - Join category room (requires categoryId)
- `join-public-room` - Join public status room

### Server Events
- `ticket:created` - New ticket created
- `ticket:called` - Ticket called
- `ticket:serving` - Ticket being served
- `ticket:completed` - Ticket completed
- `ticket:no-show` - Ticket marked as no-show
- `ticket:transferred` - Ticket transferred
- `queue:updated` - Queue updated
- `status:updated` - Public status updated

## Frontend Features

- **Customer Flow**: Check-in, category selection, token generation, status page
- **Agent Dashboard**: Queue management, call next, mark as serving/completed
- **Admin Panel**: Users, categories, queues, analytics management
- **Real-time Updates**: Socket.io integration for live updates
- **Responsive Design**: Tailwind CSS for modern UI

## Frontend Project Structure

```
frontend/
  app/
    customer/          # Customer flow pages
      check-in/        # Check-in form
      token/[token]    # Token display page
    agent/             # Agent pages
      login/           # Agent login
      dashboard/       # Agent dashboard
    admin/             # Admin pages
      login/           # Admin login
      dashboard/       # Admin dashboard
      users/           # Users management
      categories/      # Categories management
      queues/          # All queues view
      analytics/       # Analytics dashboard
    status/            # Public status page
  lib/
    api.ts             # API client
    auth.ts            # Authentication utilities
    socket.ts          # Socket.io client
```

## User Roles

- **Customer/Public**: Can check-in and view status (no login required)
- **Agent**: Can manage own queue, call next, mark as serving/completed/no-show, reorder queue, transfer tickets
- **Admin**: Full access to all features, user management, categories, analytics, override capabilities

## Key Features

### Automatic Routing
When a customer checks in and selects a category, the system automatically:
1. Finds all active agents assigned to that category
2. Calculates which agent has the fewest pending tickets
3. Routes the ticket to that agent
4. Generates a unique token number
5. Sends SMS/Email notifications (if configured)

### Queue Management
- Each agent has their own separate queue
- Agents can reorder their queue
- Agents can transfer tickets to other agents (if they handle the same category)
- Real-time updates via WebSocket

### Analytics
- Average wait time
- Average service time
- Peak hours heatmap
- Abandonment rate
- Agent performance ranking
- Category statistics
- Excel export

## Environment Variables Reference

### Backend Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DB_HOST` | SQL Server host address | `localhost` | `localhost` or `192.168.1.100` |
| `DB_PORT` | SQL Server port | `1433` | `1433` |
| `DB_USERNAME` | SQL Server username | `sa` | `sa` or your SQL user |
| `DB_PASSWORD` | SQL Server password | (empty) | Your SQL password |
| `DB_DATABASE` | Database name | `qms_db` | `qms_db` |
| `DB_ENCRYPT` | Enable encryption for connection | `true` | `true` or `false` |
| `DB_TRUST_CERT` | Trust server certificate | `true` | `true` (for self-signed certs) |
| `JWT_SECRET` | Secret key for JWT tokens | (required) | Min 32 characters |
| `JWT_EXPIRES_IN` | Access token expiration | `15m` | `15m`, `1h`, `7d` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | (required) | Min 32 characters |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` | `7d`, `30d` |
| `ENCRYPTION_KEY` | Key for data encryption | (optional) | 64-character hex string |
| `PORT` | Backend server port | `3000` | `3000` |
| `NODE_ENV` | Environment mode | `development` | `development` or `production` |

### Backend Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis host (for Socket.io scaling) | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | (none) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | (none) |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | (none) |
| `RESEND_API_KEY` | Resend API key | (none) |
| `RESEND_FROM_EMAIL` | Default from email address | (none) |

### Frontend Required Variables

Create `frontend/.env.local`:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket server URL | `http://localhost:3000` |

### Generating Secure Keys

**JWT Secrets:**
```bash
# Generate a secure JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Encryption Key:**
```bash
# Generate a secure encryption key (64-character hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment File Template

Create a `.env` file in the root directory:

```env
# ============================================
# Database Configuration (MS SQL Server)
# ============================================
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=YourSQLServerPassword
DB_DATABASE=qms_db
DB_ENCRYPT=true
DB_TRUST_CERT=true

# ============================================
# JWT Authentication
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# Encryption (for sensitive data)
# ============================================
ENCRYPTION_KEY=your-generated-64-character-hex-key-or-leave-empty-for-dev-default

# ============================================
# Application Settings
# ============================================
PORT=3000
NODE_ENV=development

# ============================================
# Optional: Redis (for Socket.io scaling)
# ============================================
# REDIS_HOST=localhost
# REDIS_PORT=6379

# ============================================
# Optional: Twilio SMS
# ============================================
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=+1234567890

# ============================================
# Optional: Resend Email
# ============================================
# RESEND_API_KEY=your-resend-api-key
# RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## Development

### Backend
```bash
# Run in development mode with hot reload
npm run start:dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Frontend
```bash
cd frontend

# Run development server
npm run dev

# Lint code
npm run lint
```

## Complete Setup Checklist

Follow these steps in order:

- [ ] Install Node.js 20.x
- [ ] Install and configure Microsoft SQL Server
- [ ] Clone the repository
- [ ] Run `npm install` in root directory
- [ ] Run `npm install` in `frontend` directory
- [ ] Create `.env` file with database and JWT configuration
- [ ] Create `frontend/.env.local` with API URLs
- [ ] Ensure SQL Server is running
- [ ] Run `npm run setup:db` to create database and tables
- [ ] Verify admin user was created (username: `masteradmin`, password: `admin`)
- [ ] Start backend: `npm run start:dev`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Access application at `http://localhost:3001`
- [ ] Change default admin password after first login

## Production Deployment

### Backend

1. **Environment Configuration:**
   - Set `NODE_ENV=production` in `.env`
   - Set `synchronize: false` in database config (already set)
   - Generate and set strong JWT secrets (minimum 32 characters)
   - Generate and set secure `ENCRYPTION_KEY` (64-character hex)
   - Configure production database credentials

2. **Database:**
   - Run `npm run setup:db` on production server
   - Or use migrations for schema management
   - Ensure database backups are configured

3. **Security:**
   - Use strong passwords for database
   - Enable SSL/TLS for database connections
   - Set `DB_ENCRYPT=true` and configure certificates
   - Review and restrict CORS origins
   - Use environment-specific secrets

4. **Scaling:**
   - Configure Redis for Socket.io scaling (if needed)
   - Set up load balancing if required
   - Use process manager (PM2, systemd, etc.)

5. **Build and Deploy:**
   ```bash
   npm run build
   npm run start:prod
   ```

### Frontend

1. **Environment Variables:**
   - Set production API URLs in `frontend/.env.local`:
     ```env
     NEXT_PUBLIC_API_URL=https://api.yourdomain.com
     NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
     ```

2. **Build:**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

3. **Deployment Options:**
   - **Vercel**: Supports Next.js natively, automatic deployments
   - **Docker**: Containerize the application
   - **Traditional Hosting**: Build and serve static files or use Node.js server

### Production Checklist

- [ ] All environment variables configured
- [ ] Strong JWT secrets generated
- [ ] Encryption key generated and secured
- [ ] Database backups configured
- [ ] SSL/TLS certificates installed
- [ ] CORS origins restricted
- [ ] Error logging and monitoring set up
- [ ] Process manager configured (PM2/systemd)
- [ ] Firewall rules configured
- [ ] Regular security updates scheduled

## License

MIT
