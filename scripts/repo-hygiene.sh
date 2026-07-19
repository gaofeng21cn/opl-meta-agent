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

if [ "${fix}" = "1" ]; then
  while IFS= read -r path_to_remove; do
    if git check-ignore -q -- "${path_to_remove}"; then
      rm -rf -- "${path_to_remove}"
    fi
  done < <(
    find . \
      -path './.git' -prune -o \
      -path './.worktrees' -prune -o \
      -path './worktrees' -prune -o \
      \( \
        -name '.venv' -o \
        -name '__pycache__' -o \
        -name '.pytest_cache' -o \
        -name 'node_modules' -o \
        -name 'dist' -o \
        -name 'coverage' -o \
        -name '*.egg-info' -o \
        -name '*.pyc' -o \
        -name '*.pyo' -o \
        -name '.DS_Store' \
      \) -prune -print
  )
fi

# OPL owns generic source byproduct policy; OMA only keeps repository-specific forbidden surfaces below.
opl workspace source-hygiene --source-root "${repo_root}"

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
