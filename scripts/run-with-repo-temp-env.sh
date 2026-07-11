#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: scripts/run-with-repo-temp-env.sh <command> [args...]" >&2
  exit 2
fi

cleanup_temp_root=0
if [ -n "${OPL_REPO_TEMP_ROOT:-}" ]; then
  repo_temp_root="${OPL_REPO_TEMP_ROOT}"
else
  repo_temp_root="$(mktemp -d "${TMPDIR:-/tmp}/opl-meta-agent-repo-temp.XXXXXX")"
  cleanup_temp_root=1
fi

cleanup() {
  if [ "${cleanup_temp_root}" = "1" ]; then
    rm -rf "${repo_temp_root}"
  fi
}
trap cleanup EXIT

mkdir -p \
  "${repo_temp_root}/tmp" \
  "${repo_temp_root}/npm/cache" \
  "${repo_temp_root}/node/compile-cache" \
  "${repo_temp_root}/xdg-cache"

export TMPDIR="${repo_temp_root}/tmp/"
export OPL_REPO_TEMP_ENV_ACTIVE=1
export OPL_REPO_TEMP_ROOT="${repo_temp_root}"
export NPM_CONFIG_CACHE="${repo_temp_root}/npm/cache"
export npm_config_cache="${NPM_CONFIG_CACHE}"
export NODE_COMPILE_CACHE="${repo_temp_root}/node/compile-cache"
export XDG_CACHE_HOME="${repo_temp_root}/xdg-cache"

"$@"
