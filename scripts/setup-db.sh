#!/bin/bash

# Database setup script for QMS
# This script creates the database and user if they don't exist

set -e

DB_NAME="qms_db"
DB_USER="postgres"
DB_PASSWORD="postgres"

echo "Setting up PostgreSQL database for QMS..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  Fedora/RHEL: sudo dnf install postgresql postgresql-server"
    echo "  macOS: brew install postgresql"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready -U postgres &> /dev/null; then
    echo "PostgreSQL service is not running. Starting it..."
    sudo systemctl start postgresql || sudo service postgresql start
    sleep 2
fi

# Create database if it doesn't exist
echo "Creating database '$DB_NAME' if it doesn't exist..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"

echo "Database '$DB_NAME' is ready!"

# Set password for postgres user (optional)
echo "Setting password for postgres user..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Database credentials:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  Username: postgres"
echo "  Password: postgres"
echo ""
echo "⚠️  Remember to change the default password in production!"

