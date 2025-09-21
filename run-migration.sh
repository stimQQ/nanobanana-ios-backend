#!/bin/bash

# Ask for database password
echo "Please enter your Supabase database password:"
echo "(You can find this in your Supabase dashboard under Settings > Database)"
read -s DB_PASSWORD

# Database connection URL with password
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.xwwjacrqhnpqrmcvdhly.supabase.co:5432/postgres"

echo ""
echo "Starting database migration..."
echo "Running migration script: migrate-database.sql"

# Run the migration using psql
psql "$DATABASE_URL" -f migrate-database.sql

if [ $? -eq 0 ]; then
    echo "Migration completed successfully!"
else
    echo "Migration failed. Please check the error messages above."
    exit 1
fi