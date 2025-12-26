# QMS Backend - Complete Documentation

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [Folder Structure](#folder-structure)
5. [API Routes & Endpoints](#api-routes--endpoints)
6. [Configuration Guide](#configuration-guide)
7. [Module Details](#module-details)
8. [Security & Authentication](#security--authentication)
9. [Real-time Communication](#real-time-communication)

---

## Technology Stack

### Core Framework
- **Node.js**: 20.x (LTS)
- **NestJS**: ^10.3.0 - Progressive Node.js framework
- **TypeScript**: ^5.3.3 - Typed JavaScript
- **Express**: ^10.3.0 (via @nestjs/platform-express)

### Database & ORM
- **Microsoft SQL Server**: Primary database (2017+)
- **TypeORM**: ^0.3.17 - Object-Relational Mapping
- **mssql**: ^11.0.1 - SQL Server client driver
- **pg**: ^8.11.3 - PostgreSQL client (if needed)

### Authentication & Security
- **@nestjs/jwt**: ^10.2.0 - JWT token management
- **@nestjs/passport**: ^10.0.3 - Authentication middleware
- **passport-jwt**: ^4.0.1 - JWT strategy
- **passport-local**: ^1.0.0 - Local authentication
- **passport-microsoft**: ^2.1.0 - Microsoft OAuth
- **bcrypt**: ^6.0.0 - Password hashing

### Real-time Communication
- **Socket.io**: ^4.6.1 - WebSocket library
- **@nestjs/websockets**: ^10.3.0 - WebSocket module
- **@nestjs/platform-socket.io**: ^10.3.0 - Socket.io adapter
- **socket.io-redis**: ^6.1.1 - Redis adapter (for scaling)

### External Services
- **Twilio**: ^4.19.0 - SMS notifications
- **Resend**: ^2.1.0 - Email service
- **Redis**: ^4.6.11 - Caching & Socket.io scaling (optional)

### Utilities
- **class-validator**: ^0.14.0 - DTO validation
- **class-transformer**: ^0.5.1 - Object transformation
- **exceljs**: ^4.4.0 - Excel export
- **pdfmake**: ^0.2.7 - PDF generation

### Documentation
- **@nestjs/swagger**: ^7.1.17 - API documentation

---

## Architecture Overview

### Architecture Pattern
The backend follows **Modular Monolithic Architecture** using NestJS:

```
┌─────────────────────────────────────────┐
│           Main Application               │
│         (app.module.ts)                  │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │   Auth   │  │  Users   │  │ Queue  │ │
│  │  Module  │  │  Module  │  │ Module │ │
│  └──────────┘  └──────────┘  └────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │Categories│  │Analytics │  │Realtime│ │
│  │  Module  │  │  Module  │  │ Gateway│ │
│  └──────────┘  └──────────┘  └────────┘ │
│  ┌──────────┐  ┌──────────┐              │
│  │Encryption│  │Notification│            │
│  │  Module  │  │  Module    │            │
│  └──────────┘  └──────────┘              │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    ┌─────────┐        ┌──────────┐
    │ TypeORM │        │ Socket.io│
    │   ORM   │        │  Server  │
    └─────────┘        └──────────┘
         │
         ▼
    ┌─────────────┐
    │ MS SQL      │
    │   Server    │
    └─────────────┘
```

### Design Principles
1. **Modular Design**: Each feature is a separate module
2. **Dependency Injection**: NestJS DI container manages dependencies
3. **Layered Architecture**: Controllers → Services → Repositories → Database
4. **Separation of Concerns**: Business logic in services, routing in controllers
5. **Security First**: JWT authentication, role-based access control (RBAC)
6. **Data Encryption**: Sensitive fields encrypted at database level

### Request Flow
```
Client Request
    ↓
Main.ts (Bootstrap)
    ↓
Global Guards (JWT, Roles)
    ↓
Controller (Route Handler)
    ↓
Service (Business Logic)
    ↓
Repository (TypeORM)
    ↓
Database (MS SQL Server)
    ↓
Response (JSON)
```

---

## Database Schema

### Database: `qms_db` (Microsoft SQL Server)

#### 1. **users** Table
Stores all users (customers, agents, admins)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uniqueidentifier (PK) | UUID primary key |
| `email` | nvarchar(255) | Unique email (unencrypted for login) |
| `phone` | nvarchar(500) | Encrypted phone number |
| `password` | nvarchar(255) | Bcrypt hashed password (nullable for OAuth) |
| `firstName` | nvarchar(500) | Encrypted first name |
| `lastName` | nvarchar(500) | Encrypted last name |
| `role` | varchar(20) | Enum: 'customer', 'agent', 'admin' |
| `isActive` | bit | Active status |
| `employeeId` | nvarchar(100) | Employee ID (nullable) |
| `counterNumber` | nvarchar(50) | Counter/desk number (nullable) |
| `microsoftId` | nvarchar(255) | Microsoft OAuth ID (nullable, indexed) |
| `createdAt` | datetime2 | Creation timestamp |
| `updatedAt` | datetime2 | Last update timestamp |

**Relationships:**
- One-to-Many with `tickets` (agent → tickets)
- One-to-Many with `agent_categories` (agent → categories)

#### 2. **categories** Table
Service categories (e.g., "Loan", "Deposit", "Withdrawal")

| Column | Type | Description |
|--------|------|-------------|
| `id` | uniqueidentifier (PK) | UUID primary key |
| `name` | nvarchar(100) | Unique category name |
| `description` | nvarchar(500) | Category description |
| `isActive` | bit | Active status |
| `estimatedWaitTime` | int | Estimated wait time in minutes |
| `createdAt` | datetime2 | Creation timestamp |
| `updatedAt` | datetime2 | Last update timestamp |

**Relationships:**
- One-to-Many with `tickets`
- One-to-Many with `agent_categories`

#### 3. **agent_categories** Table
Junction table linking agents to categories they can handle

| Column | Type | Description |
|--------|------|-------------|
| `id` | uniqueidentifier (PK) | UUID primary key |
| `agentId` | uniqueidentifier (FK) | Reference to users.id |
| `categoryId` | uniqueidentifier (FK) | Reference to categories.id |
| `isActive` | bit | Active assignment status |
| `assignedAt` | datetime2 | Assignment timestamp |

**Relationships:**
- Many-to-One with `users` (agent)
- Many-to-One with `categories` (category)

#### 4. **tickets** Table
Queue tickets/customer check-ins

| Column | Type | Description |
|--------|------|-------------|
| `id` | uniqueidentifier (PK) | UUID primary key |
| `tokenNumber` | nvarchar(50) | Unique token (e.g., "LOAN-001") |
| `categoryId` | uniqueidentifier (FK) | Reference to categories.id |
| `agentId` | uniqueidentifier (FK) | Assigned agent (nullable) |
| `status` | varchar(20) | Enum: 'pending', 'called', 'serving', 'completed', 'no_show', 'hold', 'cancelled' |
| `customerName` | nvarchar(500) | Encrypted customer name |
| `customerPhone` | nvarchar(500) | Encrypted phone number |
| `customerEmail` | nvarchar(500) | Encrypted email |
| `formData` | nvarchar(max) | Encrypted JSON form data |
| `calledAt` | datetime2 | When ticket was called |
| `servingStartedAt` | datetime2 | When service started |
| `completedAt` | datetime2 | When service completed |
| `noShowAt` | datetime2 | When marked as no-show |
| `positionInQueue` | int | Position in agent's queue |
| `createdAt` | datetime2 | Creation timestamp |
| `updatedAt` | datetime2 | Last update timestamp |

**Indexes:**
- `[agentId, status, createdAt]` - For agent queue queries
- `[categoryId, status, createdAt]` - For category queries

**Relationships:**
- Many-to-One with `categories`
- Many-to-One with `users` (agent)

### Database Configuration
- **Type**: Microsoft SQL Server
- **Port**: 1433 (default)
- **Connection**: TypeORM with connection pooling
- **Synchronization**: Disabled in production (use migrations/setup script)
- **Encryption**: AES-256-GCM for sensitive fields

---

## Folder Structure

```
QMS/
├── src/                          # Backend source code
│   ├── main.ts                   # Application entry point
│   ├── app.module.ts             # Root module
│   │
│   ├── auth/                     # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    # Login, refresh, OAuth endpoints
│   │   ├── auth.service.ts       # Auth business logic
│   │   ├── decorators/
│   │   │   ├── get-user.decorator.ts    # @GetUser() decorator
│   │   │   ├── public.decorator.ts      # @Public() decorator
│   │   │   └── roles.decorator.ts        # @Roles() decorator
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   └── update-password.dto.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         # JWT authentication guard
│   │   │   └── roles.guard.ts            # Role-based access guard
│   │   └── strategies/
│   │       ├── jwt.strategy.ts           # JWT passport strategy
│   │       └── microsoft.strategy.ts     # Microsoft OAuth strategy
│   │
│   ├── users/                    # User management module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts   # CRUD endpoints (Admin only)
│   │   ├── users.service.ts      # User business logic
│   │   ├── dto/
│   │   │   └── create-user.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts    # User entity definition
│   │
│   ├── categories/               # Category management module
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   ├── dto/
│   │   │   └── create-category.dto.ts
│   │   └── entities/
│   │       ├── category.entity.ts
│   │       └── agent-category.entity.ts
│   │
│   ├── queue/                    # Queue management module
│   │   ├── queue.module.ts
│   │   ├── queue.controller.ts   # Queue endpoints (Public/Agent/Admin)
│   │   ├── queue.service.ts      # Queue business logic
│   │   ├── dto/
│   │   │   └── create-ticket.dto.ts
│   │   └── entities/
│   │       └── ticket.entity.ts
│   │
│   ├── analytics/                # Analytics & reporting module
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts
│   │   └── analytics.service.ts
│   │
│   ├── realtime/                 # WebSocket/real-time module
│   │   ├── realtime.module.ts
│   │   ├── realtime.gateway.ts   # Socket.io gateway
│   │   └── realtime.service.ts
│   │
│   ├── notification/             # SMS/Email notifications
│   │   ├── notification.module.ts
│   │   └── notification.service.ts
│   │
│   └── encryption/               # Data encryption module
│       ├── encryption.module.ts
│       ├── encryption.service.ts # AES-256-GCM encryption
│       └── transformers.ts       # TypeORM transformers
│
├── DBsetup/                      # Database setup scripts
│   ├── setup-database.ts         # Main setup script
│   └── README.md
│
├── scripts/                      # Utility scripts
│   └── create-admin-user.ts
│
├── dist/                         # Compiled JavaScript (generated)
├── node_modules/                 # Dependencies
│
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── nest-cli.json                 # NestJS CLI configuration
├── .env                          # Environment variables (create this)
└── README.md                     # Project documentation
```

---

## API Routes & Endpoints

### Base URL
- **Development**: `http://localhost:3000`
- **Swagger Docs**: `http://localhost:3000/api`

### Authentication Endpoints

#### `POST /auth/login`
Login with username/password
- **Public**: Yes
- **Body**: `{ email: string, password: string }`
- **Response**: `{ accessToken, refreshToken, user }`

#### `POST /auth/refresh`
Refresh access token
- **Public**: Yes
- **Body**: `{ refreshToken: string }`
- **Response**: `{ accessToken, refreshToken }`

#### `GET /auth/microsoft`
Initiate Microsoft OAuth login
- **Public**: Yes
- **Redirects**: To Microsoft OAuth

#### `GET /auth/microsoft/callback`
Microsoft OAuth callback
- **Public**: Yes
- **Redirects**: To frontend with tokens

#### `POST /auth/update-password`
Update user password
- **Auth**: Required (JWT)
- **Body**: `{ currentPassword: string, newPassword: string }`

---

### Public Queue Endpoints (No Authentication)

#### `POST /queue/check-in`
Customer check-in - Create ticket
- **Public**: Yes
- **Body**: `{ categoryId: string, customerName?: string, customerPhone?: string, customerEmail?: string, formData?: object }`
- **Response**: `{ ticket: Ticket, tokenNumber: string }`

#### `GET /queue/status`
Get public status page
- **Public**: Yes
- **Query**: `?categoryId=uuid` (optional)
- **Response**: Queue status for all categories or specific category

#### `GET /queue/ticket/:tokenNumber`
Get ticket by token number
- **Public**: Yes
- **Response**: Ticket details

---

### Agent Endpoints (Requires Agent Role)

#### `GET /queue/agent/my-queue`
Get agent's own queue
- **Auth**: Required (Agent)
- **Response**: List of tickets assigned to agent

#### `POST /queue/agent/call-next`
Call next ticket in queue
- **Auth**: Required (Agent)
- **Response**: Called ticket details

#### `PATCH /queue/agent/:ticketId/serving`
Mark ticket as serving
- **Auth**: Required (Agent)
- **Response**: Updated ticket

#### `PATCH /queue/agent/:ticketId/complete`
Mark ticket as completed
- **Auth**: Required (Agent)
- **Response**: Updated ticket

#### `PATCH /queue/agent/:ticketId/no-show`
Mark ticket as no-show
- **Auth**: Required (Agent)
- **Response**: Updated ticket

#### `PATCH /queue/agent/:ticketId/reopen`
Reopen a ticket
- **Auth**: Required (Agent)
- **Response**: Updated ticket

#### `PUT /queue/agent/reorder`
Reorder agent's queue
- **Auth**: Required (Agent)
- **Body**: `{ ticketIds: string[] }`
- **Response**: Updated queue

#### `POST /queue/agent/:ticketId/transfer/:newAgentId`
Transfer ticket to another agent
- **Auth**: Required (Agent)
- **Response**: Updated ticket

---

### Admin Endpoints (Requires Admin Role)

#### Queue Management

##### `GET /queue/admin/all`
Get all queues
- **Auth**: Required (Admin)
- **Query**: `?categoryId=uuid&agentId=uuid` (optional filters)
- **Response**: All queues with filters

##### `GET /queue/admin/ticket/:id`
Get ticket by ID
- **Auth**: Required (Admin)
- **Response**: Ticket details

##### `PUT /queue/admin/reorder/:agentId`
Reorder any agent's queue
- **Auth**: Required (Admin)
- **Body**: `{ ticketIds: string[] }`
- **Response**: Updated queue

##### `POST /queue/admin/call-next/:agentId`
Call next ticket for any agent
- **Auth**: Required (Admin)
- **Response**: Called ticket

##### `PATCH /queue/admin/:ticketId/complete`
Mark any ticket as completed
- **Auth**: Required (Admin)
- **Response**: Updated ticket

##### `PATCH /queue/admin/:ticketId/serving`
Mark any ticket as serving
- **Auth**: Required (Admin)
- **Response**: Updated ticket

##### `PATCH /queue/admin/:ticketId/no-show`
Mark any ticket as no-show
- **Auth**: Required (Admin)
- **Response**: Updated ticket

##### `PATCH /queue/admin/:ticketId/reopen`
Reopen any ticket
- **Auth**: Required (Admin)
- **Response**: Updated ticket

##### `PUT /queue/admin/:ticketId`
Update ticket information
- **Auth**: Required (Admin)
- **Body**: `{ customerName?, customerPhone?, customerEmail?, formData? }`
- **Response**: Updated ticket

##### `PATCH /queue/admin/:ticketId/override`
Admin override - Update any ticket field
- **Auth**: Required (Admin)
- **Body**: Any ticket fields
- **Response**: Updated ticket

##### `DELETE /queue/admin/:ticketId`
Delete ticket
- **Auth**: Required (Admin)
- **Response**: Success message

#### User Management

##### `POST /users`
Create new user
- **Auth**: Required (Admin)
- **Body**: `CreateUserDto`
- **Response**: Created user

##### `GET /users`
Get all users
- **Auth**: Required (Admin)
- **Response**: List of users

##### `GET /users/agents`
Get all agents
- **Auth**: Required (Admin)
- **Response**: List of agents

##### `GET /users/:id`
Get user by ID
- **Auth**: Required (Admin)
- **Response**: User details

##### `PUT /users/:id`
Update user
- **Auth**: Required (Admin)
- **Body**: Partial user data
- **Response**: Updated user

##### `DELETE /users/:id`
Delete user
- **Auth**: Required (Admin)
- **Response**: Success message

##### `GET /users/profile/me`
Get current user profile
- **Auth**: Required (any role)
- **Response**: Current user details

#### Category Management

##### `POST /categories`
Create category
- **Auth**: Required (Admin)
- **Body**: `CreateCategoryDto`
- **Response**: Created category

##### `GET /categories`
Get all categories
- **Auth**: Required (any authenticated user)
- **Query**: `?activeOnly=true` (optional)
- **Response**: List of categories

##### `GET /categories/public`
Get active categories (Public)
- **Public**: Yes
- **Response**: List of active categories

##### `GET /categories/:id`
Get category by ID
- **Auth**: Required (any authenticated user)
- **Response**: Category details

##### `PUT /categories/:id`
Update category
- **Auth**: Required (Admin)
- **Body**: Partial category data
- **Response**: Updated category

##### `DELETE /categories/:id`
Delete/deactivate category
- **Auth**: Required (Admin)
- **Response**: Success message

##### `POST /categories/:categoryId/assign-agent/:agentId`
Assign agent to category
- **Auth**: Required (Admin)
- **Response**: Assignment details

##### `DELETE /categories/:categoryId/remove-agent/:agentId`
Remove agent from category
- **Auth**: Required (Admin)
- **Response**: Success message

#### Analytics Endpoints

##### `GET /analytics/dashboard`
Get dashboard statistics
- **Auth**: Required (Admin)
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (optional)
- **Response**: Dashboard stats

##### `GET /analytics/avg-wait-time`
Get average wait time
- **Auth**: Required (Admin)
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response**: `{ avgWaitTime: number }`

##### `GET /analytics/avg-service-time`
Get average service time
- **Auth**: Required (Admin)
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response**: `{ avgServiceTime: number }`

##### `GET /analytics/peak-hours`
Get peak hours heatmap
- **Auth**: Required (Admin)
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response**: Hourly statistics

##### `GET /analytics/abandonment-rate`
Get abandonment rate
- **Auth**: Required (Admin)
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response**: `{ abandonmentRate: number }`

##### `GET /analytics/agent-performance`
Get agent performance ranking
- **Auth**: Required (Admin)
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response**: Agent performance list

##### `GET /analytics/detailed-agent-performance`
Get detailed agent performance
- **Auth**: Required (Admin)
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&categoryId=uuid`
- **Response**: Detailed agent metrics

##### `GET /analytics/category-stats`
Get category statistics
- **Auth**: Required (Admin)
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response**: Category statistics

##### `GET /analytics/export/excel`
Export analytics to Excel
- **Auth**: Required (Admin)
- **Query**: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Response**: Excel file download

---

## Configuration Guide

### Environment Variables

Create a `.env` file in the root directory:

```bash
# ============================================
# Database Configuration (MS SQL Server)
# ============================================
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourSQLServerPassword
DB_NAME=qms_db
DB_ENCRYPT=true
TrustServerCertificate=true

# Note: Both setup script and app.module.ts use:
# DB_USER, DB_PASSWORD, DB_NAME (not DB_USERNAME/DB_DATABASE)

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

# ============================================
# Optional: Microsoft OAuth
# ============================================
# MICROSOFT_CLIENT_ID=your-microsoft-client-id
# MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
# MICROSOFT_CALLBACK_URL=http://localhost:3000/auth/microsoft/callback

# ============================================
# Optional: Frontend URL (for OAuth redirects)
# ============================================
# FRONTEND_URL=http://localhost:3001
```

### Generating Secure Keys

#### JWT Secrets (32+ characters)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Encryption Key (64-character hex)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Configuration

#### Step 1: Install SQL Server
- Install Microsoft SQL Server 2017+ or SQL Server Express
- Enable Mixed Mode Authentication (SQL + Windows)
- Note your `sa` password or create a SQL user

#### Step 2: Configure Connection
Update `.env` with your SQL Server details:
```bash
DB_HOST=localhost              # or your SQL Server IP
DB_PORT=1433                   # default SQL Server port
DB_USER=sa                     # or your SQL username
DB_PASSWORD=YourPassword       # your SQL password
DB_NAME=qms_db                 # database name
DB_ENCRYPT=true                # enable encryption
TrustServerCertificate=true    # trust certificate (for self-signed)
```

#### Step 3: Run Database Setup
```bash
npm run setup:db
```

This script will:
1. Create the database if it doesn't exist
2. Create all tables (users, categories, agent_categories, tickets)
3. Create default admin user:
   - **Username**: `masteradmin`
   - **Password**: `admin`
   - ⚠️ **Change password immediately after first login!**

### Application Configuration

#### TypeScript Configuration (`tsconfig.json`)
- **Target**: ES2021
- **Module**: CommonJS
- **Decorators**: Enabled (for NestJS)
- **Path Aliases**: `@/*` → `src/*`

#### NestJS Configuration (`nest-cli.json`)
- **Source Root**: `src`
- **Webpack**: Disabled
- **Watch Assets**: Enabled

### CORS Configuration

Configured in `src/main.ts`:
```typescript
app.enableCors({
  origin: true,        // Allow all origins (restrict in production)
  credentials: true,   // Allow cookies/auth headers
});
```

**Production**: Restrict `origin` to your frontend domain:
```typescript
app.enableCors({
  origin: ['https://yourdomain.com'],
  credentials: true,
});
```

### Swagger Configuration

Swagger is automatically configured at `/api` endpoint.

Access: `http://localhost:3000/api`

Features:
- Interactive API documentation
- Try endpoints directly
- Bearer token authentication support

---

## Module Details

### 1. Auth Module (`src/auth/`)

**Purpose**: Authentication and authorization

**Components**:
- **Controller**: Login, refresh, OAuth endpoints
- **Service**: JWT generation, password validation, OAuth handling
- **Guards**: JWT authentication, role-based access
- **Strategies**: JWT passport strategy, Microsoft OAuth strategy
- **Decorators**: `@Public()`, `@Roles()`, `@GetUser()`

**Key Features**:
- JWT access tokens (15min expiry)
- JWT refresh tokens (7 days expiry)
- Password hashing with bcrypt
- Microsoft OAuth integration
- Role-based access control

### 2. Users Module (`src/users/`)

**Purpose**: User management (Admin only)

**Components**:
- **Controller**: CRUD operations for users
- **Service**: User business logic
- **Entity**: User model with encryption

**Key Features**:
- Create/Read/Update/Delete users
- Role management (customer, agent, admin)
- Encrypted sensitive fields
- Active/inactive status

### 3. Categories Module (`src/categories/`)

**Purpose**: Service category management

**Components**:
- **Controller**: Category CRUD, agent assignment
- **Service**: Category business logic
- **Entities**: Category, AgentCategory (junction table)

**Key Features**:
- Create service categories
- Assign agents to categories
- Active/inactive categories
- Estimated wait times

### 4. Queue Module (`src/queue/`)

**Purpose**: Queue and ticket management

**Components**:
- **Controller**: Public, Agent, Admin endpoints
- **Service**: Queue business logic, automatic routing
- **Entity**: Ticket model

**Key Features**:
- Customer check-in
- Automatic agent assignment (least busy)
- Ticket status management
- Queue reordering
- Ticket transfer
- Token number generation

**Ticket Status Flow**:
```
PENDING → CALLED → SERVING → COMPLETED
   ↓         ↓
NO_SHOW   HOLD/CANCELLED
```

### 5. Analytics Module (`src/analytics/`)

**Purpose**: Analytics and reporting (Admin only)

**Components**:
- **Controller**: Analytics endpoints
- **Service**: Statistics calculation

**Key Features**:
- Dashboard statistics
- Average wait/service times
- Peak hours analysis
- Abandonment rate
- Agent performance ranking
- Category statistics
- Excel export

### 6. Realtime Module (`src/realtime/`)

**Purpose**: WebSocket real-time communication

**Components**:
- **Gateway**: Socket.io gateway
- **Service**: Real-time event broadcasting

**Key Features**:
- Real-time queue updates
- Agent room subscriptions
- Category room subscriptions
- Public status updates

**Socket Events**:
- `ticket:created` - New ticket
- `ticket:called` - Ticket called
- `ticket:serving` - Service started
- `ticket:completed` - Service completed
- `ticket:no-show` - No-show marked
- `ticket:transferred` - Ticket transferred
- `queue:updated` - Queue changed
- `status:updated` - Public status changed

### 7. Notification Module (`src/notification/`)

**Purpose**: SMS and Email notifications

**Components**:
- **Service**: Twilio SMS, Resend Email

**Key Features**:
- SMS notifications (Twilio)
- Email notifications (Resend)
- Virtual ticket delivery
- Graceful degradation (works without config)

### 8. Encryption Module (`src/encryption/`)

**Purpose**: Data encryption at database level

**Components**:
- **Service**: AES-256-GCM encryption
- **Transformers**: TypeORM column transformers

**Key Features**:
- Field-level encryption
- Automatic encrypt/decrypt
- AES-256-GCM algorithm
- Secure key management

**Encrypted Fields**:
- User: `phone`, `firstName`, `lastName`
- Ticket: `customerName`, `customerPhone`, `customerEmail`, `formData`

---

## Security & Authentication

### Authentication Flow

1. **Login**: User provides email/password
2. **Validation**: Service validates credentials
3. **JWT Generation**: Access token (15min) + Refresh token (7 days)
4. **Response**: Tokens returned to client
5. **Subsequent Requests**: Client sends `Authorization: Bearer <token>`
6. **Token Validation**: JWT Guard validates token
7. **User Injection**: User object injected via `@GetUser()` decorator

### Role-Based Access Control (RBAC)

**Roles**:
- `customer`: Public access only
- `agent`: Own queue management
- `admin`: Full system access

**Implementation**:
- `@Roles()` decorator on endpoints
- `RolesGuard` validates user role
- Applied after `JwtAuthGuard`

### Password Security

- **Hashing**: bcrypt with 10 salt rounds
- **Storage**: Hashed passwords only (never plain text)
- **Validation**: bcrypt.compare() for login

### Data Encryption

- **Algorithm**: AES-256-GCM
- **Key Management**: Environment variable (`ENCRYPTION_KEY`)
- **Scope**: Sensitive fields only (PII data)
- **Transparent**: Automatic encrypt/decrypt via TypeORM transformers

### JWT Security

- **Algorithm**: HS256 (HMAC-SHA256)
- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (7 days)
- **Storage**: Client-side (localStorage/sessionStorage)
- **Validation**: Signature + expiration check

---

## Real-time Communication

### Socket.io Setup

**Namespace**: `/queue`

**Connection**:
```javascript
const socket = io('http://localhost:3000/queue');
```

### Client Events

#### `join-agent-room`
Join agent's room for queue updates
```javascript
socket.emit('join-agent-room', agentId);
```

#### `join-category-room`
Join category room for status updates
```javascript
socket.emit('join-category-room', categoryId);
```

#### `join-public-room`
Join public room for general status
```javascript
socket.emit('join-public-room');
```

### Server Events

#### `ticket:created`
New ticket created
```javascript
socket.on('ticket:created', (data) => {
  // data: { ticket, tokenNumber }
});
```

#### `ticket:called`
Ticket called by agent
```javascript
socket.on('ticket:called', (data) => {
  // data: { ticket, agent }
});
```

#### `ticket:serving`
Service started
```javascript
socket.on('ticket:serving', (data) => {
  // data: { ticket }
});
```

#### `ticket:completed`
Service completed
```javascript
socket.on('ticket:completed', (data) => {
  // data: { ticket }
});
```

#### `ticket:no-show`
No-show marked
```javascript
socket.on('ticket:no-show', (data) => {
  // data: { ticket }
});
```

#### `ticket:transferred`
Ticket transferred
```javascript
socket.on('ticket:transferred', (data) => {
  // data: { ticket, oldAgentId, newAgentId }
});
```

#### `queue:updated`
Queue updated
```javascript
socket.on('queue:updated', (data) => {
  // data: { agentId, queue }
});
```

#### `status:updated`
Public status updated
```javascript
socket.on('status:updated', (data) => {
  // data: { status }
});
```

### Scaling with Redis

For multi-server deployments, configure Redis:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

Socket.io will use Redis adapter for cross-server communication.

---

## Running the Application

### Development

```bash
# Install dependencies
npm install

# Setup database
npm run setup:db

# Start development server
npm run start:dev
```

### Production

```bash
# Build
npm run build

# Start production server
npm run start:prod
```

### Available Scripts

- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run start:dev` - Start with hot reload
- `npm run start:debug` - Start with debugger
- `npm run start:prod` - Start production (compiled)
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run test` - Run tests
- `npm run setup:db` - Setup database

---

## Troubleshooting

### Database Connection Issues

**Error**: Connection refused
- Check SQL Server is running
- Verify port 1433 is open
- Check firewall settings
- Verify credentials in `.env`

**Error**: Authentication failed
- Ensure Mixed Mode authentication is enabled
- Verify username/password
- Check user has CREATE DATABASE permission

### JWT Issues

**Error**: Unauthorized
- Check token is sent in `Authorization: Bearer <token>` header
- Verify token hasn't expired
- Check `JWT_SECRET` matches between restarts

### Encryption Issues

**Error**: Decryption failed
- Verify `ENCRYPTION_KEY` is set correctly
- Don't change encryption key after data is encrypted
- Key must be 64-character hex string

### Port Conflicts

**Error**: Port 3000 already in use
- Change `PORT` in `.env`
- Or kill process using port 3000

---

## Best Practices

1. **Environment Variables**: Never commit `.env` to git
2. **Secrets**: Use strong, randomly generated secrets
3. **Database**: Use migrations for schema changes (not synchronize)
4. **Encryption**: Keep encryption key secure and backed up
5. **CORS**: Restrict origins in production
6. **Logging**: Enable logging in development, disable in production
7. **Error Handling**: Don't expose sensitive errors to clients
8. **Validation**: Always validate input with DTOs
9. **Authentication**: Use HTTPS in production
10. **Backups**: Regular database backups

---

## Support & Resources

- **NestJS Docs**: https://docs.nestjs.com
- **TypeORM Docs**: https://typeorm.io
- **Socket.io Docs**: https://socket.io/docs
- **Swagger Docs**: http://localhost:3000/api

---

**Last Updated**: 2024
**Version**: 1.0.0

