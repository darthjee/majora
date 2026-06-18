#!/usr/bin/env bash

# Branch checkout/creation for Majora issue management.
#
# Commands:
#   checkout-from-main <id>— fetch + pull main + checkout -b issue-<id>
#   create-branch <id>     — create and checkout the branch defined in plan.md, or issue-<id>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/majora_common.sh"
source "${SCRIPT_DIR}/majora_issue_files.sh"

cmd_checkout_from_main() {
  local id=${1:?checkout-from-main requires an id}
  git fetch origin
  git checkout main
  git pull origin main
  if git show-ref --verify --quiet "refs/heads/issue-${id}"; then
    git branch -D "issue-${id}"
  fi
  git push origin --delete "issue-${id}" 2>/dev/null || true
  git checkout -b "issue-${id}"
  echo "issue-${id}"
}

cmd_create_branch() {
  local id=${1:?create-branch requires an id}
  local plan_dir
  plan_dir=$(cmd_plan_dir "$id")
  local plan_file="${plan_dir}/plan.md"

  local branch=""
  if [[ -f "$plan_file" ]]; then
    branch=$(grep -A2 '^## Branch' "$plan_file" | tail -1 | tr -d '`[:space:]' || true)
  fi

  if [[ -z "$branch" ]]; then
    branch="issue-${id}"
  fi

  if git show-ref --verify --quiet "refs/heads/${branch}"; then
    git checkout "$branch"
  else
    git checkout -b "$branch"
  fi

  echo "$branch"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case ${1:-} in
    checkout-from-main)
      shift
      cmd_checkout_from_main "$@"
      ;;

    create-branch)
      shift
      cmd_create_branch "$@"
      ;;

    *)
      echo "Usage: $0 {checkout-from-main <id>|create-branch <id>}" >&2
      exit 1
      ;;
  esac
fi
