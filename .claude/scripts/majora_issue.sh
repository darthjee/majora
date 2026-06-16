#!/usr/bin/env bash

# Helper script for Majora issue management.
#
# ID conventions:
#   numeric (1, 5, 42)  — issue has a counterpart on GitHub
#   x-prefixed (x01)    — local-only issue, no GitHub counterpart
#
# Commands:
#   next-id                — next numeric ID from existing issue files
#   next-local-id          — next x-prefixed ID (x01, x02, ...) from existing issue files
#   filename <id> <title>  — canonical path: docs/agents/issues/<id>_<slug>.md
#   plan-dir <id>          — canonical plan directory: docs/agents/plans/<id>_<slug>
#   read-github <id>       — fetch GitHub issue JSON (number, title, body); numeric IDs only
#   write-github <id>      — update GitHub issue from local file; skips silently for x-prefixed IDs
#   checkout-from-main <id>— fetch + pull main + checkout -b issue-<id>
#   commit-issue <id>      — git add + commit the issue file
#   commit-plan <id>       — git add + commit the plan directory
#   create-branch <id>     — create and checkout the branch defined in plan.md, or issue-<id>
#   draft-pr <id>          — push current branch, open a draft PR, save PR URL to .claude/state/
#   mark-ready <id>        — convert the existing draft PR to ready for review
#   monitor-pr <id>        — check PR status: outputs "merged", "commented", or "waiting"
#                            on "commented", subsequent lines are the new comment bodies (author: darthjee only)

set -euo pipefail

ISSUES_DIR="docs/agents/issues"
REPO="darthjee/majora"
STATE_DIR=".claude/state"

_pr_owner() {
  local owner
  owner=$(git config user.ghuser 2>/dev/null || true)
  if [[ -z "$owner" ]]; then
    owner=$(git config --global user.ghuser 2>/dev/null || true)
  fi
  if [[ -z "$owner" ]]; then
    echo "Error: git config user.ghuser is not set (local or global)" >&2
    exit 1
  fi
  echo "$owner"
}

_is_local_id() {
  [[ "$1" =~ ^x ]]
}

_find_issue_file() {
  local id="$1"
  local file
  file=$(ls "$ISSUES_DIR/${id}_"*.md 2>/dev/null | head -1)
  if [[ -z "$file" ]]; then
    echo "Error: no issue file found for id '$id' in $ISSUES_DIR" >&2
    exit 1
  fi
  echo "$file"
}

_extract_title() {
  local file="$1"
  grep -m1 '^# ' "$file" | sed 's/^# //'
}

_extract_body() {
  local file="$1"
  tail -n +2 "$file"
}

case ${1:-} in
  next-id)
    max=$(ls "$ISSUES_DIR" 2>/dev/null | grep -oE '^[0-9]+' | sort -n | tail -1 || true)
    echo $((${max:-0} + 1))
    ;;

  next-local-id)
    max=$(ls "$ISSUES_DIR" 2>/dev/null | grep -oE '^x[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1 || true)
    printf "x%02d\n" $((${max:-0} + 1))
    ;;

  filename)
    id=${2:?filename requires an id}
    shift 2
    title="$*"
    slug=$(echo "$title" \
      | tr '[:upper:]' '[:lower:]' \
      | sed 's/[^a-z0-9]/_/g' \
      | sed 's/_\{2,\}/_/g' \
      | sed 's/^_//;s/_$//')
    echo "${ISSUES_DIR}/${id}_${slug}.md"
    ;;

  plan-dir)
    id=${2:?plan-dir requires an id}
    file=$(_find_issue_file "$id")
    slug=$(basename "$file" .md | sed "s/^${id}_//")
    echo "docs/agents/plans/${id}_${slug}"
    ;;

  read-github)
    id=${2:?read-github requires an id}
    if _is_local_id "$id"; then
      echo "Error: '$id' is a local-only id — no GitHub counterpart" >&2
      exit 1
    fi
    gh issue view "$id" --repo "$REPO" --json number,title,body
    ;;

  write-github)
    id=${2:?write-github requires an id}
    if _is_local_id "$id"; then
      exit 0
    fi
    file=$(_find_issue_file "$id")
    title=$(_extract_title "$file")
    body=$(_extract_body "$file")
    gh issue edit "$id" --repo "$REPO" --title "$title" --body "$body"
    ;;

  checkout-from-main)
    id=${2:?checkout-from-main requires an id}
    git fetch origin
    git checkout main
    git pull origin main
    git checkout -b "issue-${id}"
    echo "issue-${id}"
    ;;

  commit-issue)
    id=${2:?commit-issue requires an id}
    file=$(_find_issue_file "$id")
    git add "$file"
    git commit -m "docs: add issue ${id}"
    ;;

  commit-plan)
    id=${2:?commit-plan requires an id}
    plan_dir=$(bash "$0" plan-dir "$id")
    git add "$plan_dir"
    git commit -m "docs: add plan for issue ${id}"
    ;;

  create-branch)
    id=${2:?create-branch requires an id}
    plan_dir=$(bash "$0" plan-dir "$id")
    plan_file="${plan_dir}/plan.md"

    branch=""
    if [[ -f "$plan_file" ]]; then
      branch=$(grep -A1 '^## Branch' "$plan_file" | tail -1 | tr -d '`[:space:]' || true)
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
    ;;

  draft-pr)
    id=${2:?draft-pr requires an id}
    issue_file=$(_find_issue_file "$id")
    title=$(_extract_title "$issue_file")
    plan_dir=$(bash "$0" plan-dir "$id")
    plan_file="${plan_dir}/plan.md"
    branch=$(git branch --show-current)

    pr_body="## Issue

$(cat "$issue_file")"

    if [[ -f "$plan_file" ]]; then
      pr_body="${pr_body}

## Plan

$(cat "$plan_file")"
    fi

    git push -u origin "$branch"
    pr_url=$(gh pr create \
      --repo "$REPO" \
      --draft \
      --title "$title" \
      --body "$pr_body" \
      --head "$branch")

    mkdir -p "$STATE_DIR"
    echo "$pr_url" > "${STATE_DIR}/${id}_pr.txt"
    echo "$pr_url"
    ;;

  mark-ready)
    id=${2:?mark-ready requires an id}
    pr_file="${STATE_DIR}/${id}_pr.txt"
    if [[ ! -f "$pr_file" ]]; then
      echo "Error: no PR URL found for issue '${id}' — was draft-pr run?" >&2
      exit 1
    fi
    pr_url=$(cat "$pr_file")
    pr_num=$(echo "$pr_url" | grep -oE '[0-9]+$')
    gh pr ready "$pr_num" --repo "$REPO"
    echo "$pr_url"
    ;;

  monitor-pr)
    id=${2:?monitor-pr requires an id}
    pr_file="${STATE_DIR}/${id}_pr.txt"

    if [[ ! -f "$pr_file" ]]; then
      echo "Error: no PR URL found for issue '${id}' — was draft-pr run?" >&2
      exit 1
    fi

    pr_owner=$(_pr_owner)
    pr_url=$(cat "$pr_file")
    pr_num=$(echo "$pr_url" | grep -oE '[0-9]+$')
    last_time_file="${STATE_DIR}/${id}_last_comment_time.txt"

    while true; do
      pr_data=$(gh pr view "$pr_num" --repo "$REPO" --json state,comments 2>/dev/null) || {
        sleep 5
        continue
      }

      state=$(echo "$pr_data" | jq -r '.state' 2>/dev/null) || { sleep 5; continue; }

      if [[ "$state" == "MERGED" ]]; then
        echo "merged"
        exit 0
      fi

      # Fetch inline review comments (different endpoint, different field names)
      review_comments=$(gh api "repos/${REPO}/pulls/${pr_num}/comments" 2>/dev/null) || {
        sleep 5
        continue
      }

      # Normalize both sources to {login, createdAt, body}
      all_comments=$(jq -n \
        --argjson conv "$pr_data" \
        --argjson inline "$review_comments" \
        '[$conv.comments[] | {login: .author.login, createdAt: .createdAt, body: .body}] +
         [$inline[] | {login: .user.login, createdAt: .created_at, body: .body}]' \
        2>/dev/null) || { sleep 5; continue; }

      last_time=$(cat "$last_time_file" 2>/dev/null || echo "1970-01-01T00:00:00Z")

      count=$(echo "$all_comments" | jq -r \
        "[.[] | select(.login == \"${pr_owner}\" and .createdAt > \"${last_time}\")] | length" \
        2>/dev/null) || { sleep 5; continue; }

      if [[ "$count" -gt 0 ]]; then
        latest_time=$(echo "$all_comments" | jq -r \
          "[.[] | select(.login == \"${pr_owner}\" and .createdAt > \"${last_time}\")] | map(.createdAt) | max" \
          2>/dev/null) || { sleep 5; continue; }
        mkdir -p "$STATE_DIR"
        echo "$latest_time" > "$last_time_file"
        echo "commented"
        echo "$all_comments" | jq -r \
          "[.[] | select(.login == \"${pr_owner}\" and .createdAt > \"${last_time}\")] | .[] | \"---\n\" + .body"
        exit 0
      fi

      sleep 5
    done
    ;;

  *)
    echo "Usage: $0 {next-id|next-local-id|filename <id> <title>|plan-dir <id>|read-github <id>|write-github <id>|checkout-from-main <id>|commit-issue <id>|commit-plan <id>|create-branch <id>|draft-pr <id>|mark-ready <id>|monitor-pr <id>}" >&2
    exit 1
    ;;
esac
