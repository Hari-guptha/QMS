#!/bin/bash

# Fix PostgreSQL authentication to allow password-based connections
# This script updates pg_hba.conf to use md5 authentication

set -e

echo "Fixing PostgreSQL authentication..."

# Find PostgreSQL version and config directory
PG_VERSION=$(sudo -u postgres psql -t -c "SHOW server_version_num;" | xargs)
PG_MAJOR_VERSION=$(echo $PG_VERSION | cut -c1-2)

# Try to find pg_hba.conf
PG_HBA_CONF=""
if [ -f "/etc/postgresql/${PG_MAJOR_VERSION}/main/pg_hba.conf" ]; then
    PG_HBA_CONF="/etc/postgresql/${PG_MAJOR_VERSION}/main/pg_hba.conf"
elif [ -f "/etc/postgresql/*/main/pg_hba.conf" ]; then
    PG_HBA_CONF=$(ls /etc/postgresql/*/main/pg_hba.conf | head -1)
elif [ -f "/var/lib/pgsql/data/pg_hba.conf" ]; then
    PG_HBA_CONF="/var/lib/pgsql/data/pg_hba.conf"
else
    echo "❌ Could not find pg_hba.conf automatically"
    echo "Please find it manually and update it:"
    echo "  sudo find /etc -name pg_hba.conf"
    exit 1
fi

echo "Found pg_hba.conf at: $PG_HBA_CONF"

# Backup original
sudo cp "$PG_HBA_CONF" "${PG_HBA_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# Update authentication method for local connections
echo ""
echo "Updating authentication method..."
echo "Current local connection settings:"
sudo grep "^local\|^host.*127.0.0.1\|^host.*localhost" "$PG_HBA_CONF" || echo "No local connection rules found"

echo ""
echo "Setting local connections to use md5 (password) authentication..."
sudo sed -i 's/^local.*all.*postgres.*peer/local   all             postgres                                md5/' "$PG_HBA_CONF"
sudo sed -i 's/^local.*all.*all.*peer/local   all             all                                     md5/' "$PG_HBA_CONF"
sudo sed -i 's/^host.*127.0.0.1.*postgres.*ident/host    all             postgres        127.0.0.1\/32            md5/' "$PG_HBA_CONF"
sudo sed -i 's/^host.*127.0.0.1.*postgres.*peer/host    all             postgres        127.0.0.1\/32            md5/' "$PG_HBA_CONF"

# Reload PostgreSQL configuration
echo ""
echo "Reloading PostgreSQL configuration..."
sudo systemctl reload postgresql || sudo service postgresql reload

echo ""
echo "✅ PostgreSQL authentication updated!"
echo ""
echo "You can now connect using:"
echo "  psql -U postgres -d qms_db"
echo ""
echo "Or test with:"
echo "  psql -U postgres -d qms_db -c 'SELECT version();'"

