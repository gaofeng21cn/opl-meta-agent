#!/usr/bin/env bash
set -euo pipefail

if [ "${OPL_REPO_TEMP_ENV_ACTIVE:-}" != "1" ]; then
  exec "$(dirname "$0")/run-with-repo-temp-env.sh" "$0" "$@"
fi

lane="${1:-smoke}"

scripts/repo-hygiene.sh --fix
scripts/repo-hygiene.sh

case "$lane" in
  smoke)
    npm test
    ;;
  typecheck)
    npm run typecheck
    ;;
  structure|line-budget)
    node scripts/sync-stage-control-plane.ts --check
    node scripts/check-source-structure.ts --advisory
    ;;
  structure:strict|line-budget:strict)
    node scripts/sync-stage-control-plane.ts --check
    node scripts/check-source-structure.ts --strict
    ;;
  full)
    npm run typecheck
    npm test
    node scripts/sync-stage-control-plane.ts --check
    node scripts/check-source-structure.ts --advisory
    ;;
  *)
    echo "Unknown lane: $lane" >&2
    echo "Usage: scripts/verify.sh [smoke|typecheck|structure|line-budget|structure:strict|line-budget:strict|full]" >&2
    exit 1
    ;;
esac
