#!/usr/bin/env bash
set -euo pipefail

fix=0
if [ "${1:-}" = "--fix" ]; then
  fix=1
elif [ "$#" -gt 0 ]; then
  echo "Usage: scripts/repo-hygiene.sh [--fix]" >&2
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "${repo_root}"

# OPL owns generic source byproduct policy; OMA only keeps repository-specific forbidden surfaces below.
source_hygiene_args=(workspace source-hygiene --source-root "${repo_root}")
if [ "${fix}" = "1" ]; then
  source_hygiene_args+=(--fix)
fi
opl "${source_hygiene_args[@]}"

domain_residue_pathspecs=(
  ':(glob)**/build/**'
  ':(glob)**/out/**'
  ':(glob)**/.codex/**'
  ':(glob)**/.omx/**'
  ':(glob)**/.runtime-program/**'
  ':(glob)**/runtime-state/**'
  ':(glob)**/.DS_Store'
  '.agent-contract-baseline.json'
)

tracked="$(git ls-files -- "${domain_residue_pathspecs[@]}")"
if [ -n "${tracked}" ]; then
  printf '%s\n%s\n' 'repo hygiene: forbidden tracked OMA paths:' "${tracked}" >&2
  exit 1
fi

unignored="$(git ls-files --others --exclude-standard -- "${domain_residue_pathspecs[@]}")"
if [ -n "${unignored}" ]; then
  printf '%s\n%s\n' 'repo hygiene: unignored OMA generated paths:' "${unignored}" >&2
  printf '%s\n' 'Route the producer to OPL_REPO_TEMP_ROOT or add an explicit ignore for unavoidable local output.' >&2
  exit 1
fi
