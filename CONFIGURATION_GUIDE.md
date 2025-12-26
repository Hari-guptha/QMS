# QMS Configuration Guide

This document lists all configuration files that need to be set up for both backend and frontend.

---

## Backend Configuration

### 1. Environment Variables (`.env`)

**Location**: Root directory (`P:\QMS\.env`)

**Required**: Create this file if it doesn't exist

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

**Important Notes**:
- Replace `YourSQLServerPassword` with your actual SQL Server password
- Generate secure keys for `JWT_SECRET` and `JWT_REFRESH_SECRET` (minimum 32 characters)
- Generate `ENCRYPTION_KEY` for production (64-character hex string)
- Uncomment and configure optional services as needed

**Generating Secure Keys**:
```bash
# Generate JWT Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key (64-character hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 2. TypeScript Configuration (`tsconfig.json`)

**Location**: Root directory (`P:\QMS\tsconfig.json`)

**Status**: ✅ Already configured - No changes needed

**Key Settings**:
- Target: ES2021
- Module: CommonJS
- Decorators: Enabled (for NestJS)
- Path aliases: `@/*` → `src/*`

---

### 3. NestJS Configuration (`nest-cli.json`)

**Location**: Root directory (`P:\QMS\nest-cli.json`)

**Status**: ✅ Already configured - No changes needed

**Key Settings**:
- Source root: `src`
- Webpack: Disabled
- Watch assets: Enabled

---

### 4. Database Setup Script

**Location**: `DBsetup/setup-database.ts`

**Status**: ✅ Already configured - Run once to setup database

**Command**:
```bash
npm run setup:db
```

**What it does**:
- Creates database if it doesn't exist
- Creates all tables
- Creates default admin user (username: `masteradmin`, password: `admin`)

---

## Frontend Configuration

### 1. Environment Variables (`.env.local`)

**Location**: Frontend directory (`P:\QMS\frontend\.env.local`)

**Required**: Create this file if it doesn't exist

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# WebSocket Server URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

**Production Example**:
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

**Important Notes**:
- File must be named `.env.local` (not `.env`)
- Variables must start with `NEXT_PUBLIC_` to be accessible in browser
- Restart dev server after creating/modifying this file

**How to Change Backend API URL or Port**:
1. Open or create `frontend/.env.local` file
2. Update `NEXT_PUBLIC_API_URL` to point to your backend:
   ```bash
   # Example: Change backend port from 3000 to 4000
   NEXT_PUBLIC_API_URL=http://localhost:4000
   
   # Example: Use different host
   NEXT_PUBLIC_API_URL=http://192.168.1.100:3000
   
   # Example: Production URL
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```
3. Update `NEXT_PUBLIC_SOCKET_URL` to match (if using WebSockets)
4. Restart the frontend dev server for changes to take effect

---

### 2. Frontend Dev Server Port

**Location**: `P:\QMS\frontend\package.json`

**Current Configuration**:
- Development: Port `3001` (line 6: `"dev": "next dev -p 3001"`)
- Production: Port `3001` (line 8: `"start": "next start -p 3001"`)

**How to Change Frontend Port**:

**Option 1: Edit `package.json`** (Recommended)
```json
{
  "scripts": {
    "dev": "next dev -p 3002",    // Change 3001 to your desired port
    "start": "next start -p 3002" // Change 3001 to your desired port
  }
}
```

**Option 2: Use Environment Variable**
Create or edit `frontend/.env.local`:
```bash
PORT=3002
```
Then update `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p ${PORT:-3001}",
    "start": "next start -p ${PORT:-3001}"
  }
}
```

**Option 3: Command Line Override**
```bash
# Run on a different port without changing files
npm run dev -- -p 3002
```

**Important Notes**:
- Default port is `3001`
- Make sure the port is not already in use
- After changing port, access frontend at `http://localhost:NEW_PORT`
- If you change the frontend port, you don't need to update backend configuration (they're independent)

---

### 3. Next.js Configuration (`next.config.js`)

**Location**: `P:\QMS\frontend\next.config.js`

**Current Status**: Empty (default configuration)

**Optional Configuration** (for production):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode (recommended)
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: ['your-image-domain.com'],
  },
  
  // Environment variables (if needed)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Output configuration (for static export)
  // output: 'standalone',
  
  // Compression
  compress: true,
  
  // Security headers (production)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**Status**: ✅ Works with default - Optional to customize

---

### 3. TypeScript Configuration (`tsconfig.json`)

**Location**: `P:\QMS\frontend\tsconfig.json`

**Status**: ✅ Already configured - No changes needed

**Key Settings**:
- Target: ES2017
- Module: ESNext
- JSX: Preserve
- Path aliases: `@/*` → `./*`

---

### 4. Tailwind CSS Configuration (`tailwind.config.js`)

**Location**: `P:\QMS\frontend\tailwind.config.js`

**Status**: ✅ Already configured - No changes needed

**Key Settings**:
- Dark mode: Class-based
- Content: All source files
- Theme: Extended with custom variables
- Custom colors: Primary, secondary, destructive, etc.

**Optional Customization**:
You can customize colors, fonts, spacing, etc. in this file if needed.

---

### 5. PostCSS Configuration (`postcss.config.js`)

**Location**: `P:\QMS\frontend\postcss.config.js`

**Status**: ✅ Already configured - No changes needed

**Configuration**:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### 6. Global Styles (`app/globals.css`)

**Location**: `P:\QMS\frontend\app\globals.css`

**Status**: ✅ Already configured - Optional to customize

**What's configured**:
- CSS variables for theming
- Light/dark mode colors
- Chart colors
- Custom properties

**Optional Customization**:
You can modify CSS variables to change:
- Primary color
- Border radius
- Spacing
- Font sizes
- etc.

---

## Configuration Checklist

### Backend Setup

- [ ] Create `.env` file in root directory
- [ ] Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- [ ] Generate and set `JWT_SECRET` (32+ characters)
- [ ] Generate and set `JWT_REFRESH_SECRET` (32+ characters)
- [ ] Generate and set `ENCRYPTION_KEY` (64-character hex) - Optional for dev
- [ ] Set `PORT` (default: 3000)
- [ ] Set `NODE_ENV` (development/production)
- [ ] Configure optional services (Twilio, Resend, Redis, Microsoft OAuth) if needed
- [ ] Run `npm run setup:db` to create database

### Frontend Setup

- [ ] Create `.env.local` file in `frontend/` directory
- [ ] Set `NEXT_PUBLIC_API_URL` (default: http://localhost:3000)
- [ ] Set `NEXT_PUBLIC_SOCKET_URL` (default: http://localhost:3000)
- [ ] (Optional) Customize `next.config.js` for production
- [ ] (Optional) Customize `tailwind.config.js` for branding
- [ ] (Optional) Customize `app/globals.css` for styling

---

## Quick Start Configuration

### Minimal Setup (Development)

**Backend** (`.env`):
```bash
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourPassword
DB_NAME=qms_db
DB_ENCRYPT=true
TrustServerCertificate=true
JWT_SECRET=dev-secret-key-min-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-characters-long
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Production Setup

**Backend** (`.env`):
```bash
DB_HOST=your-production-db-host
DB_PORT=1433
DB_USER=your-db-user
DB_PASSWORD=strong-production-password
DB_NAME=qms_db
DB_ENCRYPT=true
TrustServerCertificate=false
JWT_SECRET=<generate-strong-32-char-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate-strong-32-char-secret>
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=<generate-64-char-hex-key>
PORT=3000
NODE_ENV=production
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

---

## Environment Variable Reference

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | ✅ Yes | - | SQL Server host |
| `DB_PORT` | ✅ Yes | 1433 | SQL Server port |
| `DB_USER` | ✅ Yes | - | SQL Server username |
| `DB_PASSWORD` | ✅ Yes | - | SQL Server password |
| `DB_NAME` | ✅ Yes | qms_db | Database name |
| `DB_ENCRYPT` | No | true | Enable encryption |
| `TrustServerCertificate` | No | true | Trust server certificate |
| `JWT_SECRET` | ✅ Yes | - | JWT signing secret (32+ chars) |
| `JWT_EXPIRES_IN` | No | 15m | Access token expiry |
| `JWT_REFRESH_SECRET` | ✅ Yes | - | Refresh token secret (32+ chars) |
| `JWT_REFRESH_EXPIRES_IN` | No | 7d | Refresh token expiry |
| `ENCRYPTION_KEY` | No | - | Data encryption key (64-char hex) |
| `PORT` | No | 3000 | Backend server port |
| `NODE_ENV` | No | development | Environment mode |
| `REDIS_HOST` | No | - | Redis host (optional) |
| `REDIS_PORT` | No | 6379 | Redis port (optional) |
| `TWILIO_ACCOUNT_SID` | No | - | Twilio account SID (optional) |
| `TWILIO_AUTH_TOKEN` | No | - | Twilio auth token (optional) |
| `TWILIO_PHONE_NUMBER` | No | - | Twilio phone number (optional) |
| `RESEND_API_KEY` | No | - | Resend API key (optional) |
| `RESEND_FROM_EMAIL` | No | - | Resend from email (optional) |
| `MICROSOFT_CLIENT_ID` | No | - | Microsoft OAuth client ID (optional) |
| `MICROSOFT_CLIENT_SECRET` | No | - | Microsoft OAuth secret (optional) |
| `MICROSOFT_CALLBACK_URL` | No | - | Microsoft OAuth callback (optional) |
| `FRONTEND_URL` | No | - | Frontend URL for OAuth redirects (optional) |

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | http://localhost:3000 | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ Yes | http://localhost:3000 | WebSocket server URL |

---

## Verification Steps

### Backend Verification

1. **Check environment variables**:
   ```bash
   # In root directory
   cat .env  # or type .env on Windows
   ```

2. **Test database connection**:
   ```bash
   npm run setup:db
   ```

3. **Start backend**:
   ```bash
   npm run start:dev
   ```
   - Should start on http://localhost:3000
   - Swagger docs at http://localhost:3000/api

### Frontend Verification

1. **Check environment variables**:
   ```bash
   # In frontend directory
   cat .env.local  # or type .env.local on Windows
   ```

2. **Start frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   - Should start on http://localhost:3001

3. **Test connection**:
   - Open browser to http://localhost:3001
   - Check browser console for errors
   - Verify API calls work

---

## Troubleshooting

### Backend Issues

**Error**: "Missing required environment variables"
- **Solution**: Check `.env` file exists and has all required variables

**Error**: "Database connection failed"
- **Solution**: Verify SQL Server is running and credentials are correct

**Error**: "JWT_SECRET is too short"
- **Solution**: Generate a new secret with at least 32 characters

### Frontend Issues

**Error**: "API calls failing"
- **Solution**: Check `NEXT_PUBLIC_API_URL` in `.env.local`
- **Solution**: Verify backend is running on the specified port
- **Solution**: Ensure backend CORS allows your frontend URL

**Error**: "Socket connection failed"
- **Solution**: Check `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
- **Solution**: Verify backend WebSocket server is running
- **Solution**: Ensure WebSocket URL matches backend URL

**Error**: "Environment variables not working"
- **Solution**: Ensure variables start with `NEXT_PUBLIC_`
- **Solution**: Restart dev server after changing `.env.local`
- **Solution**: Clear browser cache if variables still not updating

**Error**: "Port already in use" or "EADDRINUSE"
- **Solution**: Change port in `package.json` scripts (see section 2)
- **Solution**: Or kill the process using the port:
  ```bash
  # Windows PowerShell
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  
  # Or use a different port
  npm run dev -- -p 3002
  ```

**Error**: "Cannot connect to backend"
- **Solution**: Verify backend is running: `npm run start:dev` (in root directory)
- **Solution**: Check `NEXT_PUBLIC_API_URL` matches backend port (default: 3000)
- **Solution**: Test backend directly: Open `http://localhost:3000/api` in browser

---

## Security Best Practices

1. **Never commit `.env` or `.env.local` to git**
   - Already in `.gitignore` - verify it's there

2. **Use strong secrets in production**
   - Generate random keys using crypto
   - Minimum 32 characters for JWT secrets
   - 64-character hex for encryption key

3. **Restrict CORS in production**
   - Update `src/main.ts` to restrict origins

4. **Use HTTPS in production**
   - Configure SSL certificates
   - Update API URLs to use `https://`

5. **Keep dependencies updated**
   - Regularly run `npm audit`
   - Update packages when security patches are available

---

## Summary

### Files That MUST Be Created

1. **Backend**: `.env` (root directory)
2. **Frontend**: `.env.local` (frontend directory)

### Files Already Configured (No Changes Needed)

1. `tsconfig.json` (both backend and frontend)
2. `nest-cli.json` (backend)
3. `tailwind.config.js` (frontend)
4. `postcss.config.js` (frontend)
5. `app/globals.css` (frontend)

### Files Optional to Customize

1. `next.config.js` (frontend) - For production optimizations
2. `app/globals.css` (frontend) - For custom styling
3. `tailwind.config.js` (frontend) - For custom theme

---

**Last Updated**: 2024
**Version**: 1.0.0

