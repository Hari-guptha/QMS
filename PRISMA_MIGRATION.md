# TypeORM to Prisma Migration Guide

This document outlines the migration from TypeORM to Prisma that has been completed.

## Overview

The QMS backend has been successfully migrated from TypeORM to Prisma. This migration provides:
- Better type safety
- Improved developer experience
- Better performance
- Modern ORM features

## Changes Made

### 1. Prisma Setup
- Installed `prisma` and `@prisma/client`
- Created `prisma/schema.prisma` with all database models
- Created `prisma.config.ts` for database connection configuration
- Generated Prisma Client

### 2. Database Schema
The Prisma schema includes:
- **User** model (users table)
- **Category** model (categories table)
- **AgentCategory** model (agent_categories table)
- **Ticket** model (tickets table)

Note: SQL Server doesn't support native Prisma enums, so `UserRole` and `TicketStatus` are stored as strings.

### 3. Services Updated
All services have been migrated to use Prisma:
- `UsersService` - Uses Prisma for user operations
- `CategoriesService` - Uses Prisma for category operations
- `QueueService` - Uses Prisma for ticket operations with transactions
- `AuthService` - Uses Prisma for authentication

### 4. Encryption Handling
Since Prisma doesn't support transformers like TypeORM, encryption is handled manually:
- Created `src/prisma/prisma-helpers.ts` with encryption/decryption helpers
- All sensitive fields are encrypted before saving and decrypted after reading
- Encryption fields: `phone`, `firstName`, `lastName` (User), `customerName`, `customerPhone`, `customerEmail`, `formData` (Ticket)

### 5. Module Updates
- `AppModule` - Replaced TypeORM with PrismaModule
- All feature modules - Removed `TypeOrmModule.forFeature()` imports
- Created `PrismaModule` as a global module

### 6. Setup Scripts
- Created `DBsetup/setup-database-prisma.ts` for database setup with Prisma
- Updated `package.json` scripts

## Migration Steps

### For Existing Databases

1. **Backup your database** (IMPORTANT!)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

5. **Update environment variables:**
   Ensure your `.env` file has `DATABASE_URL` or the individual DB variables:
   ```
   DB_HOST=localhost
   DB_PORT=1433
   DB_USER=sa
   DB_PASSWORD=your_password
   DB_NAME=qms_db
   ```

6. **Run setup script:**
   ```bash
   npm run setup:db
   ```

### For New Installations

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure database in `.env`**

3. **Run setup:**
   ```bash
   npm run setup:db
   ```

## Key Differences from TypeORM

### Query Syntax
- **TypeORM:** `repository.find({ where: { id }, relations: ['category'] })`
- **Prisma:** `prisma.ticket.findUnique({ where: { id }, include: { category: true } })`

### Transactions
- **TypeORM:** `queryRunner.startTransaction()`
- **Prisma:** `prisma.$transaction(async (tx) => { ... })`

### Relations
- **TypeORM:** `relations: ['category']`
- **Prisma:** `include: { category: true }`

### Enums
- **TypeORM:** Native enum support
- **Prisma:** String fields (SQL Server limitation)

## Files Changed

### New Files
- `prisma/schema.prisma`
- `prisma.config.ts`
- `src/prisma/prisma.service.ts`
- `src/prisma/prisma.module.ts`
- `src/prisma/prisma-helpers.ts`
- `DBsetup/setup-database-prisma.ts`

### Updated Files
- `src/app.module.ts`
- `src/users/users.service.ts`
- `src/users/users.module.ts`
- `src/categories/categories.service.ts`
- `src/categories/categories.module.ts`
- `src/queue/queue.service.ts`
- `src/queue/queue.module.ts`
- `src/auth/auth.service.ts`
- `src/auth/auth.module.ts`
- `package.json`

### Entity Files (Type Definitions)
- `src/users/entities/user.entity.ts` (now TypeScript interfaces)
- `src/categories/entities/category.entity.ts`
- `src/categories/entities/agent-category.entity.ts`
- `src/queue/entities/ticket.entity.ts`

## Notes

1. **Encryption:** All encryption/decryption is now handled manually in services. The encryption service is injected and used via helper functions.

2. **Type Safety:** Prisma provides excellent type safety. Use `Prisma.User`, `Prisma.Ticket`, etc. for type definitions.

3. **Migrations:** Use `prisma migrate dev` for development and `prisma migrate deploy` for production.

4. **Removed Dependencies:** TypeORM and `@nestjs/typeorm` can be removed from `package.json` after verifying everything works.

## Testing

After migration, test:
- User authentication
- User CRUD operations
- Category management
- Ticket creation and queue management
- Encryption/decryption of sensitive fields
- Transactions (ticket creation)

## Rollback

If you need to rollback:
1. Restore database from backup
2. Revert git changes
3. Reinstall TypeORM dependencies
4. Restart application

## Support

For Prisma-specific issues, refer to:
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma SQL Server Guide](https://www.prisma.io/docs/concepts/database-connectors/sql-server)

