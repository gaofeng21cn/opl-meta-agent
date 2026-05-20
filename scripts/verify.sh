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
  full)
    npm run typecheck
    npm test
    ;;
  *)
    echo "Unknown lane: $lane" >&2
    echo "Usage: scripts/verify.sh [smoke|typecheck|full]" >&2
    exit 1
    ;;
esac
