#!/bin/bash

# Quick fix: Set postgres password and update pg_hba.conf
# Run this script to enable password authentication

set -e

echo "Quick fix for PostgreSQL authentication..."
echo ""

# Step 1: Set password for postgres user
echo "1. Setting password for postgres user..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || echo "   (Password may already be set)"

# Step 2: Find and update pg_hba.conf
echo ""
echo "2. Finding pg_hba.conf..."

PG_HBA_CONF=$(sudo find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)

if [ -z "$PG_HBA_CONF" ]; then
    echo "   ❌ Could not find pg_hba.conf automatically"
    echo "   Please run: sudo find /etc -name pg_hba.conf"
    exit 1
fi

echo "   Found: $PG_HBA_CONF"

# Backup
sudo cp "$PG_HBA_CONF" "${PG_HBA_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ Backup created"

# Update for local connections (Unix socket)
echo ""
echo "3. Updating local connection authentication..."
sudo sed -i 's/^local.*all.*postgres.*peer/local   all             postgres                                md5/' "$PG_HBA_CONF" 2>/dev/null || true
sudo sed -i 's/^local.*all.*all.*peer/local   all             all                                     md5/' "$PG_HBA_CONF" 2>/dev/null || true

# Update for TCP/IP connections (localhost)
echo "4. Updating TCP/IP connection authentication..."
sudo sed -i 's/^host.*127.0.0.1.*ident/host    all             all             127.0.0.1\/32            md5/' "$PG_HBA_CONF" 2>/dev/null || true
sudo sed -i 's/^host.*127.0.0.1.*peer/host    all             all             127.0.0.1\/32            md5/' "$PG_HBA_CONF" 2>/dev/null || true

# Reload
echo ""
echo "5. Reloading PostgreSQL..."
sudo systemctl reload postgresql 2>/dev/null || sudo service postgresql reload 2>/dev/null || echo "   ⚠️  Please reload PostgreSQL manually: sudo systemctl reload postgresql"

echo ""
echo "✅ Configuration updated!"
echo ""
echo "Test connection:"
echo "  psql -U postgres -d qms_db -c 'SELECT version();'"
echo ""
echo "Or test with NestJS:"
echo "  npx ts-node scripts/test-connection.ts"

