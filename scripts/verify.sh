#!/usr/bin/env bash
set -euo pipefail

lane="${1:-smoke}"

case "${lane}" in
  smoke|contracts)
    scripts/repo-hygiene.sh
    npm run test:contracts
    ;;
  full)
    scripts/repo-hygiene.sh
    npm run test:full
    ;;
  cleanup|fix|hygiene:fix)
    scripts/repo-hygiene.sh --fix
    scripts/repo-hygiene.sh
    ;;
  *)
    echo "Unknown lane: ${lane}" >&2
    echo "Usage: scripts/verify.sh [smoke|contracts|full|cleanup]" >&2
    exit 1
    ;;
esac
