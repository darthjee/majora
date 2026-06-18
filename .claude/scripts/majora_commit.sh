#!/usr/bin/env bash

# Commit message templating for Majora issue management.
#
# Commands:
#   commit <type> <scope> <id> <subject> <agent> <model-name> <model-email> [body]
#                          — build a message from .github/commit_message_template.md and commit
#                            staged changes; every commit in this pipeline goes through this
#   commit-issue <id> <model-name> <model-email>
#                          — git add + commit the issue file (via `commit`)
#   commit-plan <id> <model-name> <model-email>
#                          — git add + commit the plan directory (via `commit`)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/majora_common.sh"
source "${SCRIPT_DIR}/majora_issue_files.sh"

cmd_commit() {
  local type=${1:?commit requires a type}
  local scope=${2:?commit requires a scope}
  local id=${3:?commit requires an id}
  local subject=${4:?commit requires a subject}
  local agent=${5:?commit requires an agent}
  local model_name=${6:?commit requires an AI model name}
  local model_email=${7:?commit requires an AI model email}
  local body=${8:-}

  {
    echo "${type}(${scope}): ${subject} (issue #${id})"
    if [[ -n "$body" ]]; then
      echo
      echo "$body"
    fi
    echo
    echo "Co-Authored-By: ${model_name} <${model_email}>"
    echo "Co-Authored-By: ${agent} agent <${model_email}>"
  } | git commit -F -
}

cmd_commit_issue() {
  local id=${1:?commit-issue requires an id}
  local model_name=${2:?commit-issue requires an AI model name}
  local model_email=${3:?commit-issue requires an AI model email}
  local file
  file=$(_find_issue_file "$id")
  git add "$file"
  cmd_commit docs issue "$id" "add issue file" architect "$model_name" "$model_email"
}

cmd_commit_plan() {
  local id=${1:?commit-plan requires an id}
  local model_name=${2:?commit-plan requires an AI model name}
  local model_email=${3:?commit-plan requires an AI model email}
  local plan_dir
  plan_dir=$(cmd_plan_dir "$id")
  git add "$plan_dir"
  cmd_commit docs plan "$id" "add implementation plan" architect "$model_name" "$model_email"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case ${1:-} in
    commit)
      shift
      cmd_commit "$@"
      ;;

    commit-issue)
      shift
      cmd_commit_issue "$@"
      ;;

    commit-plan)
      shift
      cmd_commit_plan "$@"
      ;;

    *)
      echo "Usage: $0 {commit <type> <scope> <id> <subject> <agent> <model-name> <model-email> [body]|commit-issue <id> <model-name> <model-email>|commit-plan <id> <model-name> <model-email>}" >&2
      exit 1
      ;;
  esac
fi
