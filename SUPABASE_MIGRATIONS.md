Supabase migrations runner
==========================

This project keeps SQL migration files under `supabase/migrations/`.

What I added
- `scripts/apply_migrations.sh` - idempotent shell script that applies `.sql` files in lexicographic order and records applied files in a `schema_migrations` table.
- `package.json` script `migrate:supabase` to run the script via `npm run migrate:supabase`.

Requirements
- `psql` CLI available on PATH.
- Either set `SUPABASE_DB_URL` (preferred) or the set of env vars: `SUPABASE_DB_HOST`, `SUPABASE_DB_PORT` (optional, default 5432), `SUPABASE_DB_NAME`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`.

Usage
- Run locally:

  SUPABASE_DB_URL="postgres://user:pass@host:5432/dbname" npm run migrate:supabase

  or using discrete env vars:

  SUPABASE_DB_HOST=... SUPABASE_DB_NAME=... SUPABASE_DB_USER=... SUPABASE_DB_PASSWORD=... npm run migrate:supabase

Notes & caveats
- The runner uses a simple `schema_migrations` table to track applied files.
- It expects migration files to be plain `.sql` scripts that can be executed by `psql`.
- If your migrations rely on Supabase-specific roles, extensions, or RLS setup, run them in an environment with appropriate privileges.
- For production or team workflows consider using Supabase CLI or a more feature-rich migration tool.
