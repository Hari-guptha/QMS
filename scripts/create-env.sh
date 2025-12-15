#!/bin/bash

# Create .env file if it doesn't exist

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
    echo ".env file already exists. Skipping..."
    exit 0
fi

cat > "$ENV_FILE" << 'EOF'
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

# Redis (Optional - for Socket.io scaling)
REDIS_HOST=localhost
REDIS_PORT=6379

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Resend Email (Optional)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App
PORT=3000
NODE_ENV=development
EOF

echo "✅ .env file created successfully!"
echo ""
echo "⚠️  Please update the JWT secrets with strong random strings before production!"

