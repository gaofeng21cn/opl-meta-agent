#!/usr/bin/env bash
set -euo pipefail

if [ "${OPL_REPO_TEMP_ENV_ACTIVE:-}" != "1" ]; then
  exec "$(dirname "$0")/run-with-repo-temp-env.sh" "$0" "$@"
fi

lane="${1:-smoke}"

if [[ "$lane" == "cleanup" || "$lane" == "fix" || "$lane" == "hygiene:fix" ]]; then
  scripts/repo-hygiene.sh --fix
  scripts/repo-hygiene.sh
  exit 0
fi

scripts/repo-hygiene.sh

case "$lane" in
  smoke)
    npm run typecheck
    npm test
    ;;
  behavior)
    npm run test:behavior
    ;;
  typecheck)
    npm run typecheck
    ;;
  structure)
    node scripts/sync-authority-functions.ts --check
    node scripts/sync-stage-control-plane.ts --check
    node scripts/check-source-structure.ts --advisory
    ;;
  structure:strict)
    node scripts/sync-authority-functions.ts --check
    node scripts/sync-stage-control-plane.ts --check
    node scripts/check-source-structure.ts --strict
    ;;
  full)
    npm run typecheck
    npm run test:full
    node scripts/sync-authority-functions.ts --check
    node scripts/sync-stage-control-plane.ts --check
    node scripts/check-source-structure.ts --advisory
    ;;
  *)
    echo "Unknown lane: $lane" >&2
    echo "Usage: scripts/verify.sh [smoke|behavior|typecheck|structure|structure:strict|full|cleanup]" >&2
    exit 1
    ;;
esac
