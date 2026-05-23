#!/usr/bin/env bash
set -euo pipefail

# apply_migrations.sh
# Idempotent runner to apply SQL migration files in the `supabase/migrations` folder
# Requirements:
#  - psql CLI available
#  - environment variables: SUPABASE_DB_URL (full postgres connection string) or
#    SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_NAME, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  if [ -z "${SUPABASE_DB_HOST:-}" ] || [ -z "${SUPABASE_DB_NAME:-}" ] || [ -z "${SUPABASE_DB_USER:-}" ] || [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
    echo "Please set SUPABASE_DB_URL or SUPABASE_DB_HOST/NAME/USER/PASSWORD environment variables." >&2
    exit 1
  fi
  export PGPASSWORD="$SUPABASE_DB_PASSWORD"
  PSQLOPTS=("-h" "$SUPABASE_DB_HOST" "-p" "${SUPABASE_DB_PORT:-5432}" "-U" "$SUPABASE_DB_USER" "-d" "$SUPABASE_DB_NAME")
else
  PSQLOPTS=("$SUPABASE_DB_URL")
fi

echo "Running migrations from: $MIGRATIONS_DIR"

# We'll use a simple table to track applied migrations
TRACK_TABLE="schema_migrations"

apply_sql() {
  local file="$1"
  if [ -z "${SUPABASE_DB_URL:-}" ]; then
    psql "${PSQLOPTS[@]}" -v ON_ERROR_STOP=1 -f "$file"
  else
    psql "$file" "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f - < "$file"
  fi
}

export PGPASSWORD=${PGPASSWORD:-}

# Create tracking table if not exists
if [ -z "${SUPABASE_DB_URL:-}" ]; then
  psql "${PSQLOPTS[@]}" -v ON_ERROR_STOP=1 -c "CREATE TABLE IF NOT EXISTS \"$TRACK_TABLE\" (filename text primary key, applied_at timestamptz default now());"
else
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "CREATE TABLE IF NOT EXISTS \"$TRACK_TABLE\" (filename text primary key, applied_at timestamptz default now());"
fi

shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)
for f in "${files[@]}"; do
  fname="$(basename "$f")"
  # check if applied
  if [ -z "${SUPABASE_DB_URL:-}" ]; then
    already=$(psql "${PSQLOPTS[@]}" -t -A -c "SELECT filename FROM \"$TRACK_TABLE\" WHERE filename = '")"${fname}""" || true
  else
    already=$(psql "$SUPABASE_DB_URL" -t -A -c "SELECT filename FROM \"$TRACK_TABLE\" WHERE filename = '")"${fname}""" || true
  fi
  if [ -n "$already" ]; then
    echo "Skipping already-applied: $fname"
    continue
  fi

  echo "Applying: $fname"
  if [ -z "${SUPABASE_DB_URL:-}" ]; then
    psql "${PSQLOPTS[@]}" -v ON_ERROR_STOP=1 -f "$f"
  else
    psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
  fi

  # record as applied
  if [ -z "${SUPABASE_DB_URL:-}" ]; then
    psql "${PSQLOPTS[@]}" -v ON_ERROR_STOP=1 -c "INSERT INTO \"$TRACK_TABLE\" (filename) VALUES ('"$fname"')"
  else
    psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO \"$TRACK_TABLE\" (filename) VALUES ('"$fname"')"
  fi
done

echo "Migrations complete."
