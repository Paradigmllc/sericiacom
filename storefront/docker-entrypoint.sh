#!/bin/sh
# ------------------------------------------------------------------------------
# sericia storefront — container entrypoint
#
# Responsibilities (in order, fail-stop on the critical phase):
#   1. Apply pending Payload CMS migrations (fail-fast — schema integrity
#      matters more than serving traffic against a corrupted DB).
#   2. Seed the admin user once (fail-open — idempotent, recoverable manually).
#   3. Hand off to `next start` as PID 1 via `exec` so signals propagate.
#
# Both inner steps are already idempotent:
#   - `payload migrate` checks the `payload_migrations` table and skips applied ones.
#   - `payload-bootstrap.ts` calls payload.find({collection:"users",limit:1}) and
#     returns early when any user exists.
#
# Rule E / Rule V:
#   - No silent failures — everything is echoed with a clear prefix.
#   - Migration errors crash the container; Coolify + Slack hooks pick it up.
#   - Bootstrap errors degrade gracefully — admin seed is a seed, not a runtime
#     dependency of the storefront itself.
# ------------------------------------------------------------------------------
set -e

echo "[entrypoint] sericia storefront starting..."

# ---- Phase 1: Payload migrations (fail-fast) --------------------------------
if [ -n "$DATABASE_URL_PAYLOAD" ]; then
  echo "[entrypoint] running payload migrations..."
  if ! npm run payload:migrate; then
    echo "[entrypoint] ERROR: payload migrations failed — aborting startup" >&2
    echo "[entrypoint] fix DB schema state before restarting the container" >&2
    exit 1
  fi
  echo "[entrypoint] payload migrations ok"
else
  echo "[entrypoint] WARN: DATABASE_URL_PAYLOAD unset — skipping payload migrations"
fi

# ---- Phase 2: admin bootstrap (fail-open) -----------------------------------
if [ -n "$DATABASE_URL_PAYLOAD" ] && [ -n "$PAYLOAD_ADMIN_PASSWORD" ]; then
  echo "[entrypoint] ensuring payload admin user..."
  if npm run payload:bootstrap; then
    echo "[entrypoint] payload admin bootstrap ok"
  else
    echo "[entrypoint] WARN: payload bootstrap failed — continuing without admin seed" >&2
    echo "[entrypoint] run 'npm run payload:bootstrap' manually once DB is reachable" >&2
  fi
else
  echo "[entrypoint] WARN: admin bootstrap skipped (missing env)"
fi

# ---- Phase 3: Next.js handoff ------------------------------------------------
echo "[entrypoint] handing off to next start on port ${PORT:-8000}"
exec npm run start
