#!/bin/bash

# Run Supabase migrations using the schema.sql file
echo "Running Supabase migrations..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed."
    echo "Please run the migrations manually in the Supabase Dashboard:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of lib/supabase/schema.sql"
    echo "4. Click Run"
    exit 1
fi

# You would need to initialize and link your project first:
# supabase init
# supabase link --project-ref kogmdiwyufeebdjayekd

# For now, just show instructions
echo "To run migrations:"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of lib/supabase/schema.sql"
echo "4. Click Run"
echo ""
echo "Or if you have the Supabase CLI configured:"
echo "supabase db reset --db-url postgresql://postgres:kDw7GRpdR8tYYF2Y@db.kogmdiwyufeebdjayekd.supabase.co:5432/postgres"