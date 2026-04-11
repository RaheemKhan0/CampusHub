#!/usr/bin/env bash
# Runs every seed script in the correct order. Each seeder is its own Node
# process so a failure aborts the chain and later seeders never run against
# partially-populated state.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

cd "$BACKEND_DIR"

run_seed() {
  local label="$1"
  local script="$2"
  echo ""
  echo "▶ Running $label"
  npm run --silent "$script"
  echo "✓ $label complete"
}

run_seed "degrees + modules"  degree-seed
run_seed "servers"            servers-seed
run_seed "channels"           channels-seed
run_seed "societies"          societies-seed

echo ""
echo "All seed scripts finished successfully."
