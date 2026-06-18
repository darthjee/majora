#!/usr/bin/env bash

# PR lifecycle, CI wait, and PR monitoring for Majora issue management.
#
# Commands:
#   draft-pr <id>          — push current branch, open a draft PR, save pr_url/pr_number
#                            into .claude/state/metadata/issue_<id>.json
#   mark-ready <id>        — convert the existing draft PR to ready for review
#   cleanup-artifacts <id> <model-name> <model-email>
#                          — git rm issue file + plan dir and commit (called on approval, via `commit`)
#   wait-ci <id>           — blocking loop: waits for CircleCI checks on PR head commit
#                            outputs "passed" or "failed"; on "failed", subsequent lines are job names
#   merge-pr <id>          — squash-merge the PR
#   monitor-pr <id>        — blocking loop: outputs "merged", "approved", or "commented"
#                            on "commented", subsequent lines are the new comment bodies
#                            a comment containing only ":shipit:" is treated as approval

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/majora_common.sh"
source "${SCRIPT_DIR}/majora_issue_files.sh"
source "${SCRIPT_DIR}/majora_metadata.sh"
source "${SCRIPT_DIR}/majora_commit.sh"

cmd_draft_pr() {
  local id=${1:?draft-pr requires an id}
  local issue_file
  issue_file=$(_find_issue_file "$id")
  local title
  title=$(_extract_title "$issue_file")
  local plan_dir
  plan_dir=$(cmd_plan_dir "$id")
  local plan_file="${plan_dir}/plan.md"
  local branch
  branch=$(git branch --show-current)

  local problem
  problem=$(_extract_section "$issue_file" "Context")
  local solution
  solution=$(_extract_section "$issue_file" "What needs to be done")

  local pr_body="## Summary

${title}

## Problem
${problem}
## Solution
${solution}"

  if [[ -f "$plan_file" ]]; then
    local overview
    overview=$(_extract_section "$plan_file" "Overview")
    if [[ -n "$overview" ]]; then
      pr_body="${pr_body}
## Details
${overview}"
    fi
  fi

  pr_body="${pr_body}
Fixes #${id}"

  git push -u origin "$branch"
  local pr_url
  pr_url=$(gh pr create \
    --repo "$REPO" \
    --draft \
    --title "$title" \
    --body "$pr_body" \
    --head "$branch")
  local pr_num
  pr_num=$(echo "$pr_url" | grep -oE '[0-9]+$')

  _set_pr_metadata "$id" "$pr_url" "$pr_num"
  echo "$pr_url"
}

cmd_mark_ready() {
  local id=${1:?mark-ready requires an id}
  local pr_num
  pr_num=$(_get_metadata_field "$id" pr_number)
  gh pr ready "$pr_num" --repo "$REPO"
  _get_metadata_field "$id" pr_url
}

cmd_cleanup_artifacts() {
  local id=${1:?cleanup-artifacts requires an id}
  local model_name=${2:?cleanup-artifacts requires an AI model name}
  local model_email=${3:?cleanup-artifacts requires an AI model email}
  local issue_file
  issue_file=$(ls "${ISSUES_DIR}/${id}_"*.md 2>/dev/null | head -1 || true)
  if [[ -n "$issue_file" ]]; then
    local plan_dir
    plan_dir=$(cmd_plan_dir "$id")
    [[ -n "$(git ls-files "$issue_file")" ]] && git rm "$issue_file"
    if [[ -d "$plan_dir" ]] && [[ -n "$(git ls-files "$plan_dir")" ]]; then
      git rm -r "$plan_dir"
    fi
    if ! git diff --cached --quiet; then
      cmd_commit chore docs "$id" "remove planning artifacts" architect "$model_name" "$model_email"
    fi
  fi
}

cmd_wait_ci() {
  local id=${1:?wait-ci requires an id}
  local pr_num
  pr_num=$(_get_metadata_field "$id" pr_number)

  while true; do
    local sha
    sha=$(gh pr view "$pr_num" --repo "$REPO" --json headRefOid -q '.headRefOid' 2>/dev/null) || {
      sleep 5; continue
    }

    local checks
    checks=$(gh api "repos/${REPO}/commits/${sha}/check-runs?per_page=100" 2>/dev/null) || {
      sleep 5; continue
    }

    # Filter for CircleCI check runs only
    local circleci
    circleci=$(echo "$checks" | jq \
      '[.check_runs[] | select(.app.slug == "circleci-checks")]' \
      2>/dev/null) || { sleep 5; continue; }

    local total
    total=$(echo "$circleci" | jq 'length' 2>/dev/null) || { sleep 5; continue; }

    # No checks registered yet — keep waiting
    if [[ "$total" -eq 0 ]]; then
      sleep 5; continue
    fi

    local failed
    failed=$(echo "$circleci" | jq \
      '[.[] | select(.status == "completed" and (.conclusion == "failure" or .conclusion == "cancelled" or .conclusion == "timed_out"))] | length' \
      2>/dev/null) || { sleep 5; continue; }

    if [[ "$failed" -gt 0 ]]; then
      echo "failed"
      echo "$circleci" | jq -r \
        '.[] | select(.status == "completed" and (.conclusion == "failure" or .conclusion == "cancelled" or .conclusion == "timed_out")) | .name'
      exit 0
    fi

    local passed
    passed=$(echo "$circleci" | jq \
      '[.[] | select(.status == "completed" and .conclusion == "success")] | length' \
      2>/dev/null) || { sleep 5; continue; }

    if [[ "$passed" -eq "$total" ]]; then
      echo "passed"
      exit 0
    fi

    # Still pending — keep waiting
    sleep 5
  done
}

cmd_merge_pr() {
  local id=${1:?merge-pr requires an id}
  local pr_num
  pr_num=$(_get_metadata_field "$id" pr_number)
  local pr_url
  pr_url=$(_get_metadata_field "$id" pr_url)
  local pr_title
  pr_title=$(gh pr view "$pr_num" --repo "$REPO" --json title -q '.title')
  gh pr merge "$pr_num" --repo "$REPO" --squash --subject "${pr_title} (#${pr_num})" --body ""
  echo "$pr_url"
}

cmd_monitor_pr() {
  local id=${1:?monitor-pr requires an id}
  local pr_owner
  pr_owner=$(_pr_owner)
  local pr_num
  pr_num=$(_get_metadata_field "$id" pr_number)

  while true; do
    local pr_data
    pr_data=$(gh pr view "$pr_num" --repo "$REPO" --json state,comments,reviews 2>/dev/null) || {
      sleep 5
      continue
    }

    local state
    state=$(echo "$pr_data" | jq -r '.state' 2>/dev/null) || { sleep 5; continue; }

    if [[ "$state" == "MERGED" ]]; then
      echo "merged"
      exit 0
    fi

    if [[ "$state" == "CLOSED" ]]; then
      echo "closed"
      exit 0
    fi

    # Check approval: only the LATEST review from the owner counts
    local latest_review_state
    latest_review_state=$(echo "$pr_data" | jq -r \
      "[.reviews[] | select(.author.login == \"${pr_owner}\")] | sort_by(.submittedAt) | last | .state" \
      2>/dev/null) || { sleep 5; continue; }

    if [[ "$latest_review_state" == "APPROVED" ]]; then
      echo "approved"
      exit 0
    fi

    # Fetch inline review comments (different endpoint, different field names)
    local review_comments
    review_comments=$(gh api "repos/${REPO}/pulls/${pr_num}/comments" 2>/dev/null) || {
      sleep 5
      continue
    }

    # Normalize both sources to {login, createdAt, body}
    local all_comments
    all_comments=$(jq -n \
      --argjson conv "$pr_data" \
      --argjson inline "$review_comments" \
      '[$conv.comments[] | {login: .author.login, createdAt: .createdAt, body: .body}] +
       [$inline[] | {login: .user.login, createdAt: .created_at, body: .body}]' \
      2>/dev/null) || { sleep 5; continue; }

    local last_time
    last_time=$(jq -r '.last_comment_time // "1970-01-01T00:00:00Z"' "$(_metadata_file "$id")" 2>/dev/null) \
      || last_time="1970-01-01T00:00:00Z"

    local new_comments
    new_comments=$(echo "$all_comments" | jq -r \
      "[.[] | select(.login == \"${pr_owner}\" and .createdAt > \"${last_time}\")]" \
      2>/dev/null) || { sleep 5; continue; }

    local count
    count=$(echo "$new_comments" | jq 'length' 2>/dev/null) || { sleep 5; continue; }

    if [[ "$count" -gt 0 ]]; then
      local latest_time
      latest_time=$(echo "$new_comments" | jq -r '[.[].createdAt] | max' 2>/dev/null) || { sleep 5; continue; }
      _set_last_comment_time "$id" "$latest_time"

      local shipit_count
      shipit_count=$(echo "$new_comments" | jq \
        '[.[] | select(.body | test("^[[:space:]]*:shipit:[[:space:]]*$"))] | length' \
        2>/dev/null) || { sleep 5; continue; }

      if [[ "$shipit_count" -gt 0 ]]; then
        echo "approved"
        exit 0
      fi

      echo "commented"
      echo "$new_comments" | jq -r '.[] | "---\n" + .body'
      exit 0
    fi

    sleep 5
  done
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case ${1:-} in
    draft-pr)
      shift
      cmd_draft_pr "$@"
      ;;

    mark-ready)
      shift
      cmd_mark_ready "$@"
      ;;

    cleanup-artifacts)
      shift
      cmd_cleanup_artifacts "$@"
      ;;

    wait-ci)
      shift
      cmd_wait_ci "$@"
      ;;

    merge-pr)
      shift
      cmd_merge_pr "$@"
      ;;

    monitor-pr)
      shift
      cmd_monitor_pr "$@"
      ;;

    *)
      echo "Usage: $0 {draft-pr <id>|mark-ready <id>|cleanup-artifacts <id> <model-name> <model-email>|wait-ci <id>|merge-pr <id>|monitor-pr <id>}" >&2
      exit 1
      ;;
  esac
fi
