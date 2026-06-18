#!/usr/bin/env bash

# Issue/plan file naming and ID helpers for Majora issue management.
#
# Commands:
#   next-id                — next numeric ID from existing issue files
#   next-local-id          — next x-prefixed ID (x01, x02, ...) from existing issue files
#   filename <id> <title>  — canonical path: docs/agents/issues/<id>_<slug>.md
#   plan-dir <id>          — canonical plan directory: docs/agents/plans/<id>_<slug>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/majora_common.sh"

cmd_next_id() {
  max=$(ls "$ISSUES_DIR" 2>/dev/null | grep -oE '^[0-9]+' | sort -n | tail -1 || true)
  echo $((${max:-0} + 1))
}

cmd_next_local_id() {
  max=$(ls "$ISSUES_DIR" 2>/dev/null | grep -oE '^x[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1 || true)
  printf "x%02d\n" $((${max:-0} + 1))
}

cmd_filename() {
  local id=${1:?filename requires an id}
  shift
  local title="$*"
  local slug
  slug=$(echo "$title" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9]/_/g' \
    | sed 's/_\{2,\}/_/g' \
    | sed 's/^_//;s/_$//')
  echo "${ISSUES_DIR}/${id}_${slug}.md"
}

cmd_plan_dir() {
  local id=${1:?plan-dir requires an id}
  local file
  file=$(_find_issue_file "$id")
  local slug
  slug=$(basename "$file" .md | sed "s/^${id}_//")
  echo "docs/agents/plans/${id}_${slug}"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case ${1:-} in
    next-id)
      cmd_next_id
      ;;

    next-local-id)
      cmd_next_local_id
      ;;

    filename)
      shift
      cmd_filename "$@"
      ;;

    plan-dir)
      shift
      cmd_plan_dir "$@"
      ;;

    *)
      echo "Usage: $0 {next-id|next-local-id|filename <id> <title>|plan-dir <id>}" >&2
      exit 1
      ;;
  esac
fi
