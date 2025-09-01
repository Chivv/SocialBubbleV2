#!/bin/bash

# Test the daily-task edge function locally or remotely

# Configuration
SUPABASE_URL="https://kogmdiwyufeebdjayekd.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZ21kaXd5dWZlZWJkamF5ZWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNDU5NDEsImV4cCI6MjA2ODkyMTk0MX0.TbNiUo-ps7pOZc62sOpXj6Auio-DtWE525NMJg1KnIg"

# For production (deployed function)
echo "Testing deployed edge function..."
curl -X POST "${SUPABASE_URL}/functions/v1/daily-task" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"task": "test-creative-agenda", "isManualTrigger": true}' \
  | python3 -m json.tool

# To test locally (if running Supabase locally)
# Uncomment below:
# echo "Testing local edge function..."
# curl -X POST "http://localhost:54321/functions/v1/daily-task" \
#   -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
#   -H "Content-Type: application/json" \
#   -d '{"task": "test-creative-agenda", "isManualTrigger": true}' \
#   | python3 -m json.tool