#!/bin/bash

# Simple database setup - run as postgres user or with sudo
# Usage: sudo -u postgres bash scripts/setup-db-simple.sh

DB_NAME="qms_db"

echo "Creating database '$DB_NAME'..."

# Create database
psql -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
psql -c "CREATE DATABASE $DB_NAME;"

echo "✅ Database '$DB_NAME' created successfully!"

