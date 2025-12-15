# QMS - Technology Stack Documentation

## Overview

This document provides a comprehensive overview of all technologies, frameworks, libraries, and tools used in the Queue Management System (QMS), including versions and encryption methods.

---

## Backend Technology Stack

### Core Framework & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x (LTS) | JavaScript runtime environment |
| **NestJS** | ^10.3.0 | Progressive Node.js framework for building efficient server-side applications |
| **TypeScript** | ^5.3.3 | Typed superset of JavaScript |
| **Express** | ^10.3.0 (via @nestjs/platform-express) | Web application framework |

### Database & ORM

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | Latest | Relational database management system |
| **TypeORM** | ^0.3.17 | Object-Relational Mapping (ORM) framework |
| **pg** | ^8.11.3 | PostgreSQL client for Node.js |

**Database Configuration:**
- Default Host: `localhost`
- Default Port: `5432`
- Default Database: `qms_db`
- Connection Pool: Managed by TypeORM

### Authentication & Security

| Technology | Version | Purpose |
|------------|---------|---------|
| **@nestjs/jwt** | ^10.2.0 | JWT token generation and validation |
| **@nestjs/passport** | ^10.0.3 | Passport.js integration for NestJS |
| **passport** | ^0.7.0 | Authentication middleware |
| **passport-jwt** | ^4.0.1 | JWT strategy for Passport |
| **passport-local** | ^1.0.0 | Local username/password strategy |
| **bcrypt** | ^5.1.1 | Password hashing (bcrypt algorithm) |
| **jsonwebtoken** | (via @nestjs/jwt) | JWT token signing and verification |

**Authentication Details:**
- **JWT Algorithm**: HS256 (HMAC-SHA256)
- **Access Token Expiry**: 15 minutes (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token Expiry**: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Password Hashing**: bcrypt with salt rounds (default: 10)

### Encryption

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js crypto** | Built-in | Cryptographic functionality |

**Encryption Implementation:**
- **Algorithm**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes) - randomly generated for each encryption
- **Tag Length**: 128 bits (16 bytes) - authentication tag
- **Salt Length**: 512 bits (64 bytes) - for key derivation
- **Key Derivation**: scrypt (from Node.js crypto module)
- **Encoding**: Base64 encoding for database storage
- **Format**: `iv:tag:encrypted` (hex encoded, then Base64)

**Encrypted Fields:**
- **Ticket Entity**: `customerName`, `customerPhone`, `customerEmail`, `formData`
- **User Entity**: `phone`, `firstName`, `lastName` (email is NOT encrypted for login/search)

**Security Features:**
- Unique IV per encryption (prevents pattern analysis)
- Authentication tag (detects tampering)
- Key derivation using scrypt
- Automatic encryption/decryption via TypeORM transformers

### Real-Time Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Socket.io** | ^4.6.1 | Real-time bidirectional event-based communication |
| **@nestjs/websockets** | ^10.3.0 | WebSocket support for NestJS |
| **@nestjs/platform-socket.io** | ^10.3.0 | Socket.io adapter for NestJS |
| **socket.io-redis** | ^6.1.1 | Redis adapter for Socket.io (scaling) |
| **redis** | ^4.6.11 | Redis client for Node.js |

**WebSocket Configuration:**
- Namespace: `/queue`
- CORS: Enabled for all origins
- Rooms: `agent:{agentId}`, `category:{categoryId}`, `public`

### Communication Services

| Technology | Version | Purpose |
|------------|---------|---------|
| **Twilio** | ^4.19.0 | SMS/WhatsApp messaging service |
| **Resend** | ^2.1.0 | Email delivery service |

### Document Generation

| Technology | Version | Purpose |
|------------|---------|---------|
| **pdfmake** | ^0.2.7 | PDF document generation |
| **exceljs** | ^4.4.0 | Excel file generation and manipulation |

### Validation & Transformation

| Technology | Version | Purpose |
|------------|---------|---------|
| **class-validator** | ^0.14.0 | Decorator-based validation |
| **class-transformer** | ^0.5.1 | Object transformation and serialization |
| **@nestjs/mapped-types** | (via NestJS) | Utility types for DTOs |

### API Documentation

| Technology | Version | Purpose |
|------------|---------|---------|
| **@nestjs/swagger** | ^7.1.17 | OpenAPI/Swagger documentation |
| **swagger-ui-dist** | (via @nestjs/swagger) | Swagger UI interface |

**API Documentation:**
- Endpoint: `/api`
- Authentication: Bearer Token (JWT)
- Tags: `auth`, `public`, `agent`, `admin`

### Configuration & Environment

| Technology | Version | Purpose |
|------------|---------|---------|
| **@nestjs/config** | ^3.1.1 | Configuration management |
| **dotenv** | (via @nestjs/config) | Environment variable loading |
| **dotenv-expand** | (via @nestjs/config) | Environment variable expansion |

### Utilities & Helpers

| Technology | Version | Purpose |
|------------|---------|---------|
| **rxjs** | ^7.8.1 | Reactive programming library |
| **reflect-metadata** | ^0.1.13 | Metadata reflection API |
| **dayjs** | (if used) | Date manipulation library |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **@nestjs/cli** | ^10.2.1 | NestJS command-line interface |
| **@nestjs/schematics** | ^10.0.3 | NestJS code generators |
| **@nestjs/testing** | ^10.3.0 | Testing utilities |
| **jest** | ^29.7.0 | JavaScript testing framework |
| **ts-jest** | ^29.1.1 | TypeScript preprocessor for Jest |
| **supertest** | ^6.3.3 | HTTP assertion library |
| **eslint** | ^8.56.0 | JavaScript/TypeScript linter |
| **@typescript-eslint/eslint-plugin** | ^6.17.0 | ESLint plugin for TypeScript |
| **@typescript-eslint/parser** | ^6.17.0 | ESLint parser for TypeScript |
| **prettier** | ^3.1.1 | Code formatter |
| **ts-node** | ^10.9.2 | TypeScript execution engine |
| **ts-loader** | ^9.5.1 | TypeScript loader for webpack |
| **tsconfig-paths** | ^4.2.0 | TypeScript path mapping |

### Type Definitions

| Technology | Version | Purpose |
|------------|---------|---------|
| **@types/express** | ^4.17.21 | TypeScript types for Express |
| **@types/node** | ^20.10.6 | TypeScript types for Node.js |
| **@types/jest** | ^29.5.11 | TypeScript types for Jest |
| **@types/bcrypt** | ^5.0.2 | TypeScript types for bcrypt |
| **@types/passport-jwt** | ^4.0.1 | TypeScript types for passport-jwt |
| **@types/passport-local** | ^1.0.35 | TypeScript types for passport-local |
| **@types/pg** | ^8.10.9 | TypeScript types for PostgreSQL |
| **@types/pdfmake** | ^0.2.4 | TypeScript types for pdfmake |
| **@types/supertest** | ^6.0.2 | TypeScript types for supertest |

---

## Frontend Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.5 | React framework for production |
| **React** | ^18.3.1 | JavaScript library for building user interfaces |
| **React DOM** | ^18.3.1 | React DOM renderer |
| **TypeScript** | ^5 | Typed superset of JavaScript |

### Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | ^3.4.1 | Utility-first CSS framework |
| **PostCSS** | ^8 | CSS transformation tool |
| **Autoprefixer** | ^10 | CSS vendor prefixing |

**Tailwind Configuration:**
- Dark Mode: `class` (manual toggle)
- Content Paths: `./pages/**/*`, `./components/**/*`, `./app/**/*`

### State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | ^5.0.8 | Lightweight state management library |

### HTTP Client

| Technology | Version | Purpose |
|------------|---------|---------|
| **Axios** | ^1.13.2 | Promise-based HTTP client |

### Real-Time Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **socket.io-client** | ^4.8.1 | Socket.io client for browser |

### UI Components & Interactions

| Technology | Version | Purpose |
|------------|---------|---------|
| **@dnd-kit/core** | ^6.3.1 | Drag and drop functionality |
| **@dnd-kit/sortable** | ^10.0.0 | Sortable list components |
| **@dnd-kit/utilities** | ^3.2.2 | Utility functions for dnd-kit |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | ^8 | JavaScript/TypeScript linter |
| **eslint-config-next** | 14.2.5 | ESLint configuration for Next.js |

### Type Definitions

| Technology | Version | Purpose |
|------------|---------|---------|
| **@types/node** | ^20 | TypeScript types for Node.js |
| **@types/react** | ^18 | TypeScript types for React |
| **@types/react-dom** | ^18 | TypeScript types for React DOM |

---

## Build & Compilation

### Backend Build Configuration

- **Target**: ES2021
- **Module**: CommonJS
- **Module Resolution**: Node
- **Source Maps**: Enabled
- **Incremental Compilation**: Enabled
- **Decorators**: Enabled (experimental)
- **Output Directory**: `./dist`

### Frontend Build Configuration

- **Target**: ES2017
- **Module**: ESNext
- **Module Resolution**: Bundler
- **JSX**: Preserve (handled by Next.js)
- **Incremental Compilation**: Enabled
- **Output**: `.next` directory

---

## Runtime Environment

### Backend

- **Port**: 3000 (configurable via `PORT` environment variable)
- **Environment**: Development/Production (via `NODE_ENV`)
- **CORS**: Enabled for all origins (configurable)
- **Validation**: Global validation pipe with whitelist and transform

### Frontend

- **Port**: 3001 (configurable)
- **Development Server**: Next.js dev server
- **Production Server**: Next.js production server

---

## Security Summary

### Encryption Methods

1. **Data at Rest Encryption**
   - Algorithm: AES-256-GCM
   - Key Derivation: scrypt
   - Implementation: Node.js crypto module
   - Fields: Customer PII (names, phone, email, form data)

2. **Password Hashing**
   - Algorithm: bcrypt
   - Salt Rounds: 10 (default)
   - Implementation: bcrypt library

3. **Token-Based Authentication**
   - Algorithm: HS256 (HMAC-SHA256)
   - Token Type: JWT (JSON Web Token)
   - Implementation: @nestjs/jwt

### Security Best Practices

- Environment variables for sensitive configuration
- JWT tokens with expiration
- Refresh token mechanism
- Password hashing with bcrypt
- AES-256-GCM encryption for sensitive data
- CORS configuration
- Input validation via class-validator
- SQL injection protection via TypeORM parameterized queries

---

## Database Schema

### Entities

1. **User Entity**
   - Roles: Admin, Agent, Customer
   - Encrypted: phone, firstName, lastName
   - Not Encrypted: email (for login/search)

2. **Category Entity**
   - Service categories
   - Agent assignments

3. **AgentCategory Entity**
   - Many-to-many relationship between agents and categories

4. **Ticket Entity**
   - Queue management
   - Encrypted: customerName, customerPhone, customerEmail, formData

---

## API Architecture

### REST API

- Framework: NestJS with Express
- Documentation: Swagger/OpenAPI
- Authentication: JWT Bearer tokens
- Validation: class-validator DTOs

### WebSocket API

- Framework: Socket.io
- Namespace: `/queue`
- Rooms: Agent-specific, Category-specific, Public
- Scaling: Redis adapter support

---

## External Services Integration

### Twilio

- **Service**: SMS/WhatsApp messaging
- **Configuration**: Account SID, Auth Token, Phone Number
- **Purpose**: Customer notifications

### Resend

- **Service**: Email delivery
- **Configuration**: API Key, From Email
- **Purpose**: Email notifications

### Redis (Optional)

- **Service**: In-memory data store
- **Purpose**: Socket.io scaling, caching
- **Configuration**: Host, Port

---

## Development Workflow

### Scripts

**Backend:**
- `npm run build` - Build production bundle
- `npm run start:dev` - Development mode with watch
- `npm run start:prod` - Production mode
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run format` - Format code with Prettier

**Frontend:**
- `npm run dev` - Development server (port 3001)
- `npm run build` - Production build
- `npm run start` - Production server (port 3001)
- `npm run lint` - Run ESLint

---

## Environment Variables

### Backend Required Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=qms_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your-generated-64-character-hex-key

# App
PORT=3000
NODE_ENV=development
```

### Optional Variables

```env
# Redis (for Socket.io scaling)
REDIS_HOST=localhost
REDIS_PORT=6379

# Twilio SMS
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Resend Email
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

## Version Control & Package Management

- **Package Manager**: npm
- **Lock Files**: package-lock.json
- **Node Version**: 20.x (LTS recommended)

---

## Deployment Considerations

### Backend

- Node.js 20.x runtime required
- PostgreSQL database required
- Redis (optional, for scaling)
- Environment variables must be configured
- Encryption key must be securely stored

### Frontend

- Next.js 14.x runtime
- Can be deployed as static export or server-side rendered
- Environment variables for API endpoints

---

## Performance Considerations

- **Encryption Overhead**: ~1-2ms per field (encryption/decryption)
- **Database**: TypeORM connection pooling
- **Real-time**: Socket.io with optional Redis adapter for horizontal scaling
- **Caching**: Redis can be used for caching (if configured)

---

## Testing Stack

- **Framework**: Jest
- **TypeScript Support**: ts-jest
- **E2E Testing**: Supertest
- **Coverage**: Jest coverage reports

---

## Code Quality Tools

- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Type Checking**: TypeScript compiler
- **Validation**: class-validator decorators

---

## Documentation

- **API Documentation**: Swagger/OpenAPI (accessible at `/api`)
- **Encryption Guide**: `ENCRYPTION.md`
- **README**: Project setup and usage instructions

---

## Summary

This Queue Management System uses a modern, secure, and scalable technology stack:

- **Backend**: NestJS 10 with TypeScript 5, PostgreSQL, Socket.io
- **Frontend**: Next.js 14 with React 18, Tailwind CSS 3
- **Security**: AES-256-GCM encryption, bcrypt hashing, JWT authentication
- **Real-time**: Socket.io with Redis adapter support
- **Communication**: Twilio (SMS), Resend (Email)
- **Documentation**: Swagger/OpenAPI

All technologies are actively maintained and follow industry best practices for security and performance.

