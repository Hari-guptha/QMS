# QMS Frontend

Next.js frontend for the Queue Management System.

## Features

- **Customer Flow**: Check-in, category selection, token generation, status page
- **Agent Dashboard**: Queue management, call next, mark as serving/completed
- **Admin Panel**: Users, categories, queues, analytics management
- **Real-time Updates**: Socket.io integration for live updates
- **Responsive Design**: Tailwind CSS for modern UI

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) (or next available port).

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Project Structure

```
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

## API Integration

The frontend integrates with the NestJS backend API:
- Public endpoints for customer check-in
- Agent endpoints for queue management
- Admin endpoints for system management
- Real-time updates via Socket.io

## Build

```bash
npm run build
npm start
```
