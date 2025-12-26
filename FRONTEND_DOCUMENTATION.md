# QMS Frontend - Complete Documentation

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Folder Structure](#folder-structure)
4. [Routes & Pages](#routes--pages)
5. [Components](#components)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Real-time Communication](#real-time-communication)
9. [Styling & Theming](#styling--theming)
10. [Configuration Guide](#configuration-guide)
11. [Authentication Flow](#authentication-flow)
12. [Session Management](#session-management)

---

## Technology Stack

### Core Framework
- **Next.js**: 14.2.5 - React framework with App Router
- **React**: ^18.3.1 - UI library
- **TypeScript**: ^5.x - Typed JavaScript

### Styling
- **Tailwind CSS**: ^3.4.1 - Utility-first CSS framework
- **PostCSS**: ^8.x - CSS processing
- **Autoprefixer**: ^10.x - CSS vendor prefixing
- **next-themes**: ^0.4.6 - Theme management (light/dark mode)

### State Management
- **Zustand**: ^5.0.8 - Lightweight state management
- **React Hooks**: Built-in state management

### UI & Animation
- **Framer Motion**: ^12.23.25 - Animation library
- **Lucide React**: ^0.556.0 - Icon library
- **@dnd-kit/core**: ^6.3.1 - Drag and drop functionality
- **@dnd-kit/sortable**: ^10.0.0 - Sortable lists
- **@dnd-kit/utilities**: ^3.2.2 - DnD utilities

### HTTP & Real-time
- **Axios**: ^1.13.2 - HTTP client
- **Socket.io-client**: ^4.8.1 - WebSocket client

### Development Tools
- **ESLint**: ^8.x - Code linting
- **TypeScript**: Type checking

---

## Architecture Overview

### Architecture Pattern
The frontend follows **Next.js App Router Architecture** with:

```
┌─────────────────────────────────────────┐
│         Next.js App Router              │
│         (App Directory)                  │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Pages   │  │Components │  │  Lib   │ │
│  │  (Routes)│  │  (UI)     │  │ (Utils)│ │
│  └──────────┘  └──────────┘  └────────┘ │
│  ┌──────────┐  ┌──────────┐              │
│  │  State   │  │  API     │              │
│  │ (Zustand)│  │ (Axios)   │              │
│  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐              │
│  │ Socket.io│  │  Theme   │              │
│  │  Client  │  │ Provider │              │
│  └──────────┘  └──────────┘              │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    ┌─────────┐        ┌──────────┐
    │  Backend│        │ Socket.io│
    │   API   │        │  Server  │
    └─────────┘        └──────────┘
```

### Design Principles
1. **Server Components First**: Use React Server Components where possible
2. **Client Components**: Marked with `'use client'` for interactivity
3. **Component Composition**: Reusable, composable components
4. **Progressive Enhancement**: Works without JavaScript where possible
5. **Real-time Updates**: Socket.io for live data
6. **Responsive Design**: Mobile-first approach
7. **Accessibility**: WCAG compliant components
8. **Theme Support**: Light/dark mode with system preference

### Request Flow
```
User Action
    ↓
Client Component (React)
    ↓
API Client (Axios) / Socket.io
    ↓
Backend API / WebSocket Server
    ↓
Response / Event
    ↓
State Update (Zustand / React State)
    ↓
UI Re-render
```

---

## Folder Structure

```
frontend/
├── app/                          # Next.js App Router (Pages)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   │
│   ├── admin/                    # Admin pages
│   │   ├── login/
│   │   │   └── page.tsx          # Admin login
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Admin dashboard
│   │   ├── users/
│   │   │   └── page.tsx           # User management
│   │   ├── categories/
│   │   │   └── page.tsx           # Category management
│   │   ├── queues/
│   │   │   └── page.tsx           # Queue management
│   │   └── analytics/
│   │       └── page.tsx          # Analytics dashboard
│   │
│   ├── agent/                     # Agent pages
│   │   ├── login/
│   │   │   └── page.tsx           # Agent login
│   │   └── dashboard/
│   │       └── page.tsx          # Agent dashboard
│   │
│   ├── customer/                  # Customer pages
│   │   ├── check-in/
│   │   │   └── page.tsx           # Customer check-in
│   │   └── token/
│   │       └── [tokenNumber]/
│   │           └── page.tsx       # Token display page
│   │
│   ├── status/                    # Public pages
│   │   └── page.tsx               # Public status page
│   │
│   ├── settings/                  # Settings pages
│   │   ├── account/
│   │   │   └── page.tsx           # Account settings
│   │   ├── password/
│   │   │   └── page.tsx           # Password change
│   │   └── appearance/
│   │       └── page.tsx          # Appearance settings
│   │
│   └── auth/                      # Authentication
│       └── microsoft/
│           └── callback/
│               └── page.tsx       # Microsoft OAuth callback
│
├── components/                    # React components
│   ├── Navbar.tsx                 # Navigation bar
│   ├── ThemeProvider.tsx          # Theme context provider
│   ├── ThemeToggle.tsx            # Theme switcher
│   ├── SessionTimeoutWarning.tsx  # Session timeout warning
│   ├── ConfirmDialog.tsx           # Confirmation dialog
│   │
│   ├── charts/                    # Chart components
│   │   ├── AreaChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── HeatmapChart.tsx
│   │   ├── LineChart.tsx
│   │   └── PieChart.tsx
│   │
│   └── ui/                        # UI components
│       └── Select.tsx             # Select dropdown
│
├── lib/                           # Utilities & helpers
│   ├── api.ts                     # API client (Axios)
│   ├── auth.ts                    # Authentication utilities
│   ├── socket.ts                  # Socket.io client
│   ├── session-manager.ts         # Session management
│   ├── theme-store.ts             # Theme state (Zustand)
│   └── color-utils.ts             # Color utilities
│
├── hooks/                         # Custom React hooks
│
├── public/                        # Static assets
│   ├── favicon.ico
│   └── *.svg                      # SVG icons
│
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── postcss.config.js              # PostCSS configuration
├── package.json                   # Dependencies
└── README.md                       # Frontend README
```

---

## Routes & Pages

### Public Routes (No Authentication)

#### `/` - Home Page
- **File**: `app/page.tsx`
- **Purpose**: Landing page with navigation to different user types
- **Features**:
  - Customer, Agent, Admin entry points
  - Link to public status page
  - Theme toggle
  - Animated UI with Framer Motion

#### `/status` - Public Status Page
- **File**: `app/status/page.tsx`
- **Purpose**: Display queue status for all categories
- **Features**:
  - Real-time queue updates
  - Category-wise status
  - Estimated wait times
  - Public access (no login)

#### `/customer/check-in` - Customer Check-in
- **File**: `app/customer/check-in/page.tsx`
- **Purpose**: Customer check-in form
- **Features**:
  - Category selection
  - Customer information form
  - Token generation
  - Real-time updates
  - Redirect to token page

#### `/customer/token/[tokenNumber]` - Token Display
- **File**: `app/customer/token/[tokenNumber]/page.tsx`
- **Purpose**: Display customer token and status
- **Features**:
  - Token number display
  - Queue position
  - Estimated wait time
  - Real-time status updates
  - Print functionality

---

### Agent Routes (Requires Agent Authentication)

#### `/agent/login` - Agent Login
- **File**: `app/agent/login/page.tsx`
- **Purpose**: Agent authentication
- **Features**:
  - Email/password login
  - Microsoft OAuth option
  - Session management
  - Redirect to dashboard on success

#### `/agent/dashboard` - Agent Dashboard
- **File**: `app/agent/dashboard/page.tsx`
- **Purpose**: Agent queue management
- **Features**:
  - View own queue
  - Call next ticket
  - Mark as serving/completed/no-show
  - Reorder queue (drag & drop)
  - Transfer tickets
  - Real-time updates
  - Queue statistics

---

### Admin Routes (Requires Admin Authentication)

#### `/admin/login` - Admin Login
- **File**: `app/admin/login/page.tsx`
- **Purpose**: Admin authentication
- **Features**:
  - Email/password login
  - Microsoft OAuth option
  - Session management
  - Redirect to dashboard on success

#### `/admin/dashboard` - Admin Dashboard
- **File**: `app/admin/dashboard/page.tsx`
- **Purpose**: Admin overview
- **Features**:
  - System statistics
  - Quick actions
  - Recent activity
  - Navigation to all admin sections

#### `/admin/users` - User Management
- **File**: `app/admin/users/page.tsx`
- **Purpose**: Manage users (agents, admins)
- **Features**:
  - List all users
  - Create new user
  - Edit user details
  - Delete user
  - Filter by role
  - Search functionality

#### `/admin/categories` - Category Management
- **File**: `app/admin/categories/page.tsx`
- **Purpose**: Manage service categories
- **Features**:
  - List categories
  - Create category
  - Edit category
  - Delete/deactivate category
  - Assign agents to categories
  - Set estimated wait times

#### `/admin/queues` - Queue Management
- **File**: `app/admin/queues/page.tsx`
- **Purpose**: View and manage all queues
- **Features**:
  - View all agent queues
  - Filter by category/agent
  - Admin override actions
  - Reorder any queue
  - Delete tickets
  - Real-time updates

#### `/admin/analytics` - Analytics Dashboard
- **File**: `app/admin/analytics/page.tsx`
- **Purpose**: Analytics and reporting
- **Features**:
  - Dashboard statistics
  - Average wait/service times
  - Peak hours heatmap
  - Agent performance
  - Category statistics
  - Excel export
  - Date range filtering
  - Interactive charts

---

### Settings Routes (Requires Authentication)

#### `/settings/account` - Account Settings
- **File**: `app/settings/account/page.tsx`
- **Purpose**: Manage account information
- **Features**:
  - Update profile
  - Edit name, email
  - View user details

#### `/settings/password` - Password Settings
- **File**: `app/settings/password/page.tsx`
- **Purpose**: Change password
- **Features**:
  - Current password verification
  - New password input
  - Password strength indicator
  - Secure password change

#### `/settings/appearance` - Appearance Settings
- **File**: `app/settings/appearance/page.tsx`
- **Purpose**: Customize appearance
- **Features**:
  - Theme selection (light/dark/system)
  - Primary color customization
  - Color presets
  - Live preview

---

### Authentication Routes

#### `/auth/microsoft/callback` - Microsoft OAuth Callback
- **File**: `app/auth/microsoft/callback/page.tsx`
- **Purpose**: Handle Microsoft OAuth callback
- **Features**:
  - Extract tokens from URL
  - Store authentication data
  - Redirect to appropriate dashboard

---

## Components

### Layout Components

#### `Navbar.tsx`
- **Location**: `components/Navbar.tsx`
- **Purpose**: Navigation bar
- **Features**:
  - Role-based navigation
  - User menu
  - Logout functionality
  - Theme toggle
  - Responsive design

#### `ThemeProvider.tsx`
- **Location**: `components/ThemeProvider.tsx`
- **Purpose**: Theme context provider
- **Features**:
  - Light/dark mode support
  - System theme detection
  - Theme persistence
  - Smooth transitions

#### `SessionTimeoutWarning.tsx`
- **Location**: `components/SessionTimeoutWarning.tsx`
- **Purpose**: Session timeout warning
- **Features**:
  - Warning before session expiry
  - Extend session option
  - Auto-logout on timeout

#### `ConfirmDialog.tsx`
- **Location**: `components/ConfirmDialog.tsx`
- **Purpose**: Confirmation dialogs
- **Features**:
  - Reusable confirmation dialog
  - Context provider
  - Customizable messages

### Chart Components

#### `AreaChart.tsx`
- **Location**: `components/charts/AreaChart.tsx`
- **Purpose**: Area chart for analytics
- **Usage**: Analytics dashboard

#### `BarChart.tsx`
- **Location**: `components/charts/BarChart.tsx`
- **Purpose**: Bar chart for analytics
- **Usage**: Analytics dashboard

#### `HeatmapChart.tsx`
- **Location**: `components/charts/HeatmapChart.tsx`
- **Purpose**: Heatmap for peak hours
- **Usage**: Analytics dashboard

#### `LineChart.tsx`
- **Location**: `components/charts/LineChart.tsx`
- **Purpose**: Line chart for trends
- **Usage**: Analytics dashboard

#### `PieChart.tsx`
- **Location**: `components/charts/PieChart.tsx`
- **Purpose**: Pie chart for distributions
- **Usage**: Analytics dashboard

### UI Components

#### `Select.tsx`
- **Location**: `components/ui/Select.tsx`
- **Purpose**: Custom select dropdown
- **Features**:
  - Accessible
  - Styled with Tailwind
  - Theme support

---

## State Management

### Zustand Stores

#### Theme Store (`lib/theme-store.ts`)
- **Purpose**: Theme and color management
- **State**:
  - `theme`: 'light' | 'dark' | 'system'
  - `primaryColor`: string
  - `mounted`: boolean
- **Actions**:
  - `setTheme(theme)`: Change theme
  - `setPrimaryColor(color)`: Change primary color
  - `initTheme()`: Initialize theme
  - `initPrimaryColor()`: Initialize primary color

### React State
- **Local State**: `useState` for component-specific state
- **Context**: Theme context via `next-themes`
- **Session State**: Managed by `session-manager.ts`

---

## API Integration

### API Client (`lib/api.ts`)

#### Base Configuration
- **Library**: Axios
- **Base URL**: `process.env.NEXT_PUBLIC_API_URL`
- **Default**: `http://localhost:3000`

#### Request Interceptor
- Automatically adds JWT token to headers
- Token from `localStorage.getItem('accessToken')`

#### Response Interceptor
- Handles 401 (Unauthorized) errors
- Automatic token refresh
- Session validation
- Redirects on authentication failure

### API Modules

#### `authApi`
- `login(email, password)`: User login
- `refresh(refreshToken)`: Refresh access token
- `updatePassword(currentPassword, newPassword)`: Change password
- `updateProfile(data)`: Update user profile
- `getProfile()`: Get current user profile
- `microsoftAuth()`: Initiate Microsoft OAuth

#### `publicApi`
- `checkIn(data)`: Customer check-in
- `getStatus(categoryId?)`: Get public status
- `getTicketByToken(tokenNumber)`: Get ticket by token
- `getCategories()`: Get active categories

#### `agentApi`
- `getMyQueue()`: Get agent's queue
- `callNext()`: Call next ticket
- `markAsServing(ticketId)`: Mark as serving
- `markAsCompleted(ticketId)`: Mark as completed
- `markAsNoShow(ticketId)`: Mark as no-show
- `reopenTicket(ticketId)`: Reopen ticket
- `reorderQueue(ticketIds)`: Reorder queue
- `transferTicket(ticketId, newAgentId)`: Transfer ticket

#### `adminApi`
- **Users**:
  - `getUsers()`: Get all users
  - `getAgents()`: Get all agents
  - `createUser(data)`: Create user
  - `updateUser(id, data)`: Update user
  - `deleteUser(id)`: Delete user
- **Categories**:
  - `getCategories()`: Get all categories
  - `createCategory(data)`: Create category
  - `updateCategory(id, data)`: Update category
  - `deleteCategory(id)`: Delete category
  - `assignAgent(categoryId, agentId)`: Assign agent
  - `removeAgent(categoryId, agentId)`: Remove agent
- **Queues**:
  - `getAllQueues(categoryId?, agentId?)`: Get all queues
  - `getAgentQueue(agentId)`: Get agent queue
  - `reorderAgentQueue(agentId, ticketIds)`: Reorder queue
  - `adminCallNext(agentId)`: Call next ticket
  - `adminMarkAsCompleted(ticketId)`: Mark completed
  - `adminMarkAsServing(ticketId)`: Mark serving
  - `adminMarkAsNoShow(ticketId)`: Mark no-show
  - `adminReopenTicket(ticketId)`: Reopen ticket
  - `adminUpdateTicket(ticketId, data)`: Update ticket
  - `deleteTicket(ticketId)`: Delete ticket
- **Analytics**:
  - `getDashboard(startDate?, endDate?)`: Dashboard stats
  - `getAgentPerformance(startDate?, endDate?)`: Agent performance
  - `getDetailedAgentPerformance(startDate?, endDate?, categoryId?)`: Detailed performance
  - `exportExcel(startDate?, endDate?)`: Export to Excel

---

## Real-time Communication

### Socket.io Client (`lib/socket.ts`)

#### Connection
- **Namespace**: `/queue`
- **URL**: `process.env.NEXT_PUBLIC_SOCKET_URL`
- **Default**: `http://localhost:3000`

#### Configuration
- **Transports**: WebSocket, polling (fallback)
- **Reconnection**: Enabled
- **Reconnection Delay**: 1000ms
- **Max Delay**: 5000ms
- **Attempts**: Infinite

#### Usage
```typescript
import { getSocket } from '@/lib/socket';

const socket = getSocket();

// Join rooms
socket.emit('join-agent-room', agentId);
socket.emit('join-category-room', categoryId);
socket.emit('join-public-room');

// Listen to events
socket.on('ticket:created', (data) => {
  // Handle new ticket
});

socket.on('ticket:called', (data) => {
  // Handle ticket called
});

socket.on('queue:updated', (data) => {
  // Handle queue update
});
```

#### Events

**Client → Server**:
- `join-agent-room`: Join agent's room
- `join-category-room`: Join category room
- `join-public-room`: Join public room

**Server → Client**:
- `ticket:created`: New ticket created
- `ticket:called`: Ticket called
- `ticket:serving`: Service started
- `ticket:completed`: Service completed
- `ticket:no-show`: No-show marked
- `ticket:transferred`: Ticket transferred
- `queue:updated`: Queue updated
- `status:updated`: Public status updated

---

## Styling & Theming

### Tailwind CSS

#### Configuration (`tailwind.config.js`)
- **Dark Mode**: Class-based (`dark:` prefix)
- **Content**: All `.tsx`, `.ts`, `.jsx`, `.js` files
- **Theme**: Extended with custom colors and variables

#### Custom Colors
- **Primary**: Theme primary color (customizable)
- **Secondary**: Theme secondary color
- **Destructive**: Error/danger color
- **Muted**: Muted text/background
- **Accent**: Accent color
- **Card**: Card background
- **Sidebar**: Sidebar colors
- **Chart**: Chart color palette (1-5)

#### CSS Variables
Defined in `globals.css`:
- `--primary`: Primary color
- `--primary-foreground`: Primary text color
- `--background`: Background color
- `--foreground`: Text color
- `--border`: Border color
- `--radius`: Border radius
- And more...

### Theme System

#### Light/Dark Mode
- **Provider**: `next-themes`
- **Storage**: localStorage
- **Default**: System preference
- **Toggle**: Theme toggle component

#### Primary Color Customization
- **Presets**: Predefined color options
- **Custom**: User-defined colors
- **Storage**: Zustand with persistence
- **Application**: CSS variables updated dynamically

### Framer Motion

#### Usage
- **Animations**: Page transitions, hover effects
- **Variants**: Reusable animation variants
- **Gestures**: Interactive animations
- **Performance**: Optimized animations

---

## Configuration Guide

### Environment Variables

Create `frontend/.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# WebSocket Server URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Next.js Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

module.exports = nextConfig;
```

### TypeScript Configuration (`tsconfig.json`)

- **Target**: ES2017
- **Module**: ESNext
- **JSX**: Preserve (Next.js handles compilation)
- **Paths**: `@/*` → `./*` (absolute imports)

### Tailwind Configuration (`tailwind.config.js`)

- **Dark Mode**: Class-based
- **Content**: All source files
- **Theme**: Extended with custom variables
- **Plugins**: None (can add if needed)

---

## Authentication Flow

### Login Process

1. **User submits credentials** → `authApi.login()`
2. **Backend validates** → Returns JWT tokens
3. **Frontend stores tokens**:
   - `accessToken` → localStorage
   - `refreshToken` → localStorage
   - `user` → localStorage (JSON)
4. **Session initialized** → Session manager starts
5. **Redirect** → Role-based dashboard

### Token Management

#### Access Token
- **Storage**: localStorage
- **Expiry**: 15 minutes
- **Usage**: Added to all API requests
- **Refresh**: Automatic on 401 error

#### Refresh Token
- **Storage**: localStorage
- **Expiry**: 7 days
- **Usage**: Refresh access token
- **Rotation**: New refresh token on refresh

### Authentication Utilities (`lib/auth.ts`)

#### Functions
- `login(username, password)`: Login and store tokens
- `logout()`: Clear all auth data
- `getUser()`: Get current user (with session check)
- `getToken()`: Get access token (with session check)
- `isAuthenticated()`: Check if user is authenticated

### Route Protection

#### Client-side Protection
- Check `auth.isAuthenticated()` before rendering
- Redirect to login if not authenticated
- Role-based access control

#### Example
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function ProtectedPage() {
  const router = useRouter();
  
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/admin/login');
    }
  }, [router]);
  
  // ... rest of component
}
```

---

## Session Management

### Session Manager (`lib/session-manager.ts`)

#### Features
- **Timeout**: 15 minutes of inactivity
- **Warning**: 2 minutes before timeout
- **Activity Tracking**: Mouse, keyboard, scroll, touch
- **Cross-tab Sync**: Storage events
- **Visibility Handling**: Tab visibility changes

#### Configuration
- **Session Timeout**: 15 minutes (900,000ms)
- **Warning Time**: 2 minutes before timeout
- **Activity Events**: mousedown, mousemove, keypress, scroll, touchstart, click

#### Usage
```typescript
import { getSessionManager } from '@/lib/session-manager';

const sessionManager = getSessionManager();

// Check if session is valid
if (sessionManager?.isSessionValid()) {
  // Session is active
}

// Get time remaining
const timeLeft = sessionManager?.getTimeRemaining();

// Listen to timeout
sessionManager?.onTimeout(() => {
  // Handle timeout
});

// Listen to warning
sessionManager?.onWarning((minutes) => {
  // Show warning
});
```

#### Session Data
- **Storage**: sessionStorage + localStorage
- **Session ID**: Unique per session
- **Last Activity**: Timestamp
- **Expires At**: Calculated timestamp

---

## Running the Application

### Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Access**: `http://localhost:3001`

### Production

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Available Scripts

- `npm run dev`: Start development server (port 3001)
- `npm run build`: Build for production
- `npm run start`: Start production server (port 3001)
- `npm run lint`: Lint code

---

## Best Practices

### Component Structure
1. **Server Components First**: Use server components when possible
2. **Client Components**: Mark with `'use client'` only when needed
3. **Component Composition**: Build complex UIs from simple components
4. **Props Typing**: Always type component props

### State Management
1. **Local State**: Use `useState` for component-specific state
2. **Global State**: Use Zustand for shared state
3. **Server State**: Use React Query (if added) or fetch directly

### API Calls
1. **Error Handling**: Always handle errors
2. **Loading States**: Show loading indicators
3. **Token Refresh**: Rely on interceptors for automatic refresh
4. **Optimistic Updates**: Update UI optimistically when appropriate

### Real-time Updates
1. **Cleanup**: Always disconnect sockets on unmount
2. **Room Management**: Join/leave rooms appropriately
3. **Event Handlers**: Remove event listeners on cleanup

### Styling
1. **Tailwind First**: Use Tailwind utilities
2. **Custom CSS**: Only when Tailwind isn't sufficient
3. **Theme Variables**: Use CSS variables for theming
4. **Responsive**: Mobile-first approach

### Performance
1. **Code Splitting**: Automatic with Next.js
2. **Image Optimization**: Use Next.js Image component
3. **Lazy Loading**: Load components on demand
4. **Memoization**: Use `useMemo` and `useCallback` when needed

---

## Troubleshooting

### Build Errors

**Error**: Module not found
- **Solution**: Check imports, ensure dependencies are installed

**Error**: Type errors
- **Solution**: Check TypeScript configuration, ensure types are correct

### Runtime Errors

**Error**: API calls failing
- **Solution**: Check `NEXT_PUBLIC_API_URL` environment variable
- **Solution**: Verify backend is running
- **Solution**: Check CORS configuration

**Error**: Socket connection failed
- **Solution**: Check `NEXT_PUBLIC_SOCKET_URL` environment variable
- **Solution**: Verify backend WebSocket server is running

**Error**: Authentication issues
- **Solution**: Check token storage in localStorage
- **Solution**: Verify session is valid
- **Solution**: Check token expiry

### Styling Issues

**Issue**: Dark mode not working
- **Solution**: Check `next-themes` provider is in layout
- **Solution**: Verify `darkMode` in Tailwind config

**Issue**: Colors not updating
- **Solution**: Check CSS variables are defined
- **Solution**: Verify theme store is initialized

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Framer Motion Docs**: https://www.framer.com/motion
- **Zustand Docs**: https://zustand-demo.pmnd.rs
- **Socket.io Client Docs**: https://socket.io/docs/v4/client-api

---

**Last Updated**: 2024
**Version**: 1.0.0

