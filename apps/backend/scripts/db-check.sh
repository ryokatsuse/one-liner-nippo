#!/bin/bash

echo "=== DATABASE STATUS ==="
echo "Users:"
npx wrangler d1 execute one-liner-nippo-dev --local --command="SELECT COUNT(*) as count FROM users;" 2>/dev/null | grep -A 10 "results" | grep count || echo "No users"

echo -e "\nRecent Users:"
npx wrangler d1 execute one-liner-nippo-dev --local --command="SELECT username, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 5;" 2>/dev/null | grep -A 20 "results"

echo -e "\nReports:"
npx wrangler d1 execute one-liner-nippo-dev --local --command="SELECT COUNT(*) as count FROM reports;" 2>/dev/null | grep -A 10 "results" | grep count || echo "No reports"

echo -e "\nTables:"
npx wrangler d1 execute one-liner-nippo-dev --local --command="SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null | grep -A 10 "results"