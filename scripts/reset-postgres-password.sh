#!/bin/bash

# Reset postgres user password to match .env file
# This script sets the password to 'postgres' (default)

set -e

NEW_PASSWORD="postgres"

echo "Resetting postgres user password..."
echo ""

# Method 1: Using psql (if we can connect)
if sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';" 2>/dev/null; then
    echo "✅ Password reset successfully!"
    echo ""
    echo "New password: $NEW_PASSWORD"
    echo ""
    echo "Test connection:"
    echo "  psql -U postgres -d qms_db -c 'SELECT version();'"
    exit 0
fi

# Method 2: If we can't connect, provide instructions
echo "⚠️  Could not reset password automatically."
echo ""
echo "Please run this command manually:"
echo "  sudo -u postgres psql"
echo ""
echo "Then in the PostgreSQL prompt, run:"
echo "  ALTER USER postgres WITH PASSWORD 'postgres';"
echo "  \\q"
echo ""
echo "Or use this one-liner:"
echo "  sudo -u postgres psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""

