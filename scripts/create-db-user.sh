#!/bin/bash

# Create a database user matching your system username
# This allows you to connect without sudo

set -e

SYSTEM_USER=$(whoami)
DB_NAME="qms_db"
DB_PASSWORD="postgres"

echo "Creating database user '$SYSTEM_USER'..."

# Quote the username to handle special characters like hyphens
QUOTED_USER="\"$SYSTEM_USER\""

# Create user if it doesn't exist
sudo -u postgres psql -c "SELECT 1 FROM pg_user WHERE usename='$SYSTEM_USER'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER $QUOTED_USER WITH PASSWORD '$DB_PASSWORD';"

# Grant privileges (use quoted username)
sudo -u postgres psql -c "ALTER USER $QUOTED_USER CREATEDB;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $QUOTED_USER;"

echo "✅ User '$SYSTEM_USER' created with password '$DB_PASSWORD'"
echo ""
echo "You can now connect using:"
echo "  psql -U $SYSTEM_USER -d $DB_NAME"
echo ""
echo "Or update .env file:"
echo "  DB_USERNAME=$SYSTEM_USER"
echo "  DB_PASSWORD=$DB_PASSWORD"

