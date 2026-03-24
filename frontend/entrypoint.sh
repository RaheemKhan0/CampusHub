#!/usr/bin/env bash
set -euo pipefail

API_SPEC_URL="${API_SPEC_URL:-http://campus-api:4000/api-json}"

echo "Fetching OpenAPI spec from $API_SPEC_URL ..."
for i in {1..40}; do
  echo "try number $i"
  if npx openapi-typescript "$API_SPEC_URL" -o src/types/openapi.d.ts; then
    echo "OpenAPI spec fetched."
    break
  fi
  echo "Spec not ready yet. Retry $i/40 ..."
  sleep 1
done

npm run api:gen   # generates src/api/types/openapi.d.ts (or .ts)
exec npm run dev  # or: npm start (for prod)

