# Queue Management System (QMS)

Universal Queue Management System - A completely generic, white-label Queue Management System that works for any business: Banks, Hospitals, Government Offices, Salons, Restaurants, Universities, DMVs, Clinics, etc.

This is a monorepo containing both the backend (NestJS) and frontend (Next.js) applications.

## Technology Stack

### Backend
- **Framework**: Node.js 20 + NestJS 10
- **Database**: PostgreSQL (via TypeORM)
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

## Installation

### Backend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
# - Database credentials
# - JWT secrets
# - Twilio credentials (optional)
# - Resend API key (optional)
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
EOF
```

## Database Setup

```bash
# Create PostgreSQL database
createdb qms_db

# The application will auto-create tables in development mode
# For production, use migrations
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

## Environment Variables

### Backend
See `.env.example` for all required environment variables.

### Frontend
Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
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

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Set `synchronize: false` in database config (use migrations)
3. Set strong JWT secrets
4. Configure Redis for Socket.io scaling (if needed)
5. Set up proper CORS origins
6. Use process manager (PM2, systemd, etc.)

### Frontend
1. Set production API URLs in environment variables
2. Build the application: `npm run build`
3. Start the production server: `npm start`
4. Or deploy to a platform like Vercel, which supports Next.js natively

## License

MIT
