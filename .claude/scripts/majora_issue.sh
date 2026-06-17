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
#   read-github <id>       — fetch GitHub issue JSON (number, title, body); numeric IDs only;
#                            also extracts metadata (tags) from the body and saves it via save-metadata
#   save-metadata <id> <body>
#                          — parse a "Tags: :emoji: ..." line (case-insensitive) out of <body> and
#                            write {"issue_id": <id>, "tags": [...]} to .claude/state/metadata/issue_<id>.json
#   write-github <id>      — update GitHub issue from local file; skips silently for x-prefixed IDs
#   checkout-from-main <id>— fetch + pull main + checkout -b issue-<id>
#   metadata <id> <field>  — read a field (e.g. pr_url, pr_number, tags) from
#                            .claude/state/metadata/issue_<id>.json
#   commit <type> <scope> <id> <subject> <agent> <model-name> <model-email> [body]
#                          — build a message from .github/commit_message_template.md and commit
#                            staged changes; every commit in this pipeline goes through this
#   commit-issue <id> <model-name> <model-email>
#                          — git add + commit the issue file (via `commit`)
#   commit-plan <id> <model-name> <model-email>
#                          — git add + commit the plan directory (via `commit`)
#   create-branch <id>     — create and checkout the branch defined in plan.md, or issue-<id>
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

_extract_section() {
  local file="$1"
  local section="$2"
  awk -v sec="## ${section}" '$0==sec{found=1; next} found && /^## /{exit} found{print}' "$file"
}

_metadata_file() {
  local id="$1"
  echo "${STATE_DIR}/metadata/issue_${id}.json"
}

_ensure_metadata() {
  local id="$1"
  local file
  file=$(_metadata_file "$id")
  mkdir -p "$(dirname "$file")"
  if [[ ! -f "$file" ]]; then
    jq -n --arg id "$id" '{issue_id: $id, tags: []}' > "$file"
  fi
  echo "$file"
}

_set_pr_metadata() {
  local id="$1" pr_url="$2" pr_number="$3"
  local file
  file=$(_ensure_metadata "$id")
  jq --arg url "$pr_url" --argjson num "$pr_number" '.pr_url = $url | .pr_number = $num' \
    "$file" > "${file}.tmp"
  mv "${file}.tmp" "$file"
}

_get_metadata_field() {
  local id="$1" field="$2"
  local file
  file=$(_metadata_file "$id")
  if [[ ! -f "$file" ]]; then
    echo "Error: no metadata found for issue '${id}'" >&2
    exit 1
  fi
  local value
  value=$(jq -r ".${field} // empty" "$file")
  if [[ -z "$value" ]]; then
    echo "Error: no '${field}' found in metadata for issue '${id}'" >&2
    exit 1
  fi
  echo "$value"
}

_set_last_comment_time() {
  local id="$1" timestamp="$2"
  local file
  file=$(_ensure_metadata "$id")
  jq --arg t "$timestamp" '.last_comment_time = $t' "$file" > "${file}.tmp"
  mv "${file}.tmp" "$file"
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
    json=$(gh issue view "$id" --repo "$REPO" --json number,title,body)
    bash "$0" save-metadata "$id" "$(echo "$json" | jq -r '.body')"
    echo "$json"
    ;;

  save-metadata)
    id=${2:?save-metadata requires an id}
    body=${3:-}
    tags_line=$(echo "$body" | grep -im1 '^tags:' || true)
    tags_json="[]"
    if [[ -n "$tags_line" ]]; then
      tags_json=$(echo "$tags_line" \
        | grep -oE ':[a-zA-Z0-9_+-]+:' \
        | sed 's/^://;s/:$//' \
        | tr '[:upper:]' '[:lower:]' \
        | jq -R . | jq -s .)
    fi
    file=$(_ensure_metadata "$id")
    jq --arg id "$id" --argjson tags "$tags_json" '.issue_id = $id | .tags = $tags' \
      "$file" > "${file}.tmp"
    mv "${file}.tmp" "$file"
    ;;

  metadata)
    id=${2:?metadata requires an id}
    field=${3:?metadata requires a field}
    _get_metadata_field "$id" "$field"
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
    if git show-ref --verify --quiet "refs/heads/issue-${id}"; then
      git branch -D "issue-${id}"
    fi
    git push origin --delete "issue-${id}" 2>/dev/null || true
    git checkout -b "issue-${id}"
    echo "issue-${id}"
    ;;

  commit)
    type=${2:?commit requires a type}
    scope=${3:?commit requires a scope}
    id=${4:?commit requires an id}
    subject=${5:?commit requires a subject}
    agent=${6:?commit requires an agent}
    model_name=${7:?commit requires an AI model name}
    model_email=${8:?commit requires an AI model email}
    body=${9:-}

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
    ;;

  commit-issue)
    id=${2:?commit-issue requires an id}
    model_name=${3:?commit-issue requires an AI model name}
    model_email=${4:?commit-issue requires an AI model email}
    file=$(_find_issue_file "$id")
    git add "$file"
    bash "$0" commit docs issue "$id" "add issue file" architect "$model_name" "$model_email"
    ;;

  commit-plan)
    id=${2:?commit-plan requires an id}
    model_name=${3:?commit-plan requires an AI model name}
    model_email=${4:?commit-plan requires an AI model email}
    plan_dir=$(bash "$0" plan-dir "$id")
    git add "$plan_dir"
    bash "$0" commit docs plan "$id" "add implementation plan" architect "$model_name" "$model_email"
    ;;

  create-branch)
    id=${2:?create-branch requires an id}
    plan_dir=$(bash "$0" plan-dir "$id")
    plan_file="${plan_dir}/plan.md"

    branch=""
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
    ;;

  draft-pr)
    id=${2:?draft-pr requires an id}
    issue_file=$(_find_issue_file "$id")
    title=$(_extract_title "$issue_file")
    plan_dir=$(bash "$0" plan-dir "$id")
    plan_file="${plan_dir}/plan.md"
    branch=$(git branch --show-current)

    problem=$(_extract_section "$issue_file" "Context")
    solution=$(_extract_section "$issue_file" "What needs to be done")

    pr_body="## Summary

${title}

## Problem
${problem}
## Solution
${solution}"

    if [[ -f "$plan_file" ]]; then
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
    pr_url=$(gh pr create \
      --repo "$REPO" \
      --draft \
      --title "$title" \
      --body "$pr_body" \
      --head "$branch")
    pr_num=$(echo "$pr_url" | grep -oE '[0-9]+$')

    _set_pr_metadata "$id" "$pr_url" "$pr_num"
    echo "$pr_url"
    ;;

  mark-ready)
    id=${2:?mark-ready requires an id}
    pr_num=$(_get_metadata_field "$id" pr_number)
    gh pr ready "$pr_num" --repo "$REPO"
    _get_metadata_field "$id" pr_url
    ;;

  cleanup-artifacts)
    id=${2:?cleanup-artifacts requires an id}
    model_name=${3:?cleanup-artifacts requires an AI model name}
    model_email=${4:?cleanup-artifacts requires an AI model email}
    issue_file=$(ls "${ISSUES_DIR}/${id}_"*.md 2>/dev/null | head -1 || true)
    if [[ -n "$issue_file" ]]; then
      plan_dir=$(bash "$0" plan-dir "$id")
      [[ -n "$(git ls-files "$issue_file")" ]] && git rm "$issue_file"
      if [[ -d "$plan_dir" ]] && [[ -n "$(git ls-files "$plan_dir")" ]]; then
        git rm -r "$plan_dir"
      fi
      if ! git diff --cached --quiet; then
        bash "$0" commit chore docs "$id" "remove planning artifacts" architect "$model_name" "$model_email"
      fi
    fi
    ;;

  wait-ci)
    id=${2:?wait-ci requires an id}
    pr_num=$(_get_metadata_field "$id" pr_number)

    while true; do
      sha=$(gh pr view "$pr_num" --repo "$REPO" --json headRefOid -q '.headRefOid' 2>/dev/null) || {
        sleep 5; continue
      }

      checks=$(gh api "repos/${REPO}/commits/${sha}/check-runs?per_page=100" 2>/dev/null) || {
        sleep 5; continue
      }

      # Filter for CircleCI check runs only
      circleci=$(echo "$checks" | jq \
        '[.check_runs[] | select(.app.slug == "circleci-checks")]' \
        2>/dev/null) || { sleep 5; continue; }

      total=$(echo "$circleci" | jq 'length' 2>/dev/null) || { sleep 5; continue; }

      # No checks registered yet — keep waiting
      if [[ "$total" -eq 0 ]]; then
        sleep 5; continue
      fi

      failed=$(echo "$circleci" | jq \
        '[.[] | select(.status == "completed" and (.conclusion == "failure" or .conclusion == "cancelled" or .conclusion == "timed_out"))] | length' \
        2>/dev/null) || { sleep 5; continue; }

      if [[ "$failed" -gt 0 ]]; then
        echo "failed"
        echo "$circleci" | jq -r \
          '.[] | select(.status == "completed" and (.conclusion == "failure" or .conclusion == "cancelled" or .conclusion == "timed_out")) | .name'
        exit 0
      fi

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
    ;;

  merge-pr)
    id=${2:?merge-pr requires an id}
    pr_num=$(_get_metadata_field "$id" pr_number)
    pr_url=$(_get_metadata_field "$id" pr_url)
    pr_title=$(gh pr view "$pr_num" --repo "$REPO" --json title -q '.title')
    gh pr merge "$pr_num" --repo "$REPO" --squash --subject "${pr_title} (#${pr_num})" --body ""
    echo "$pr_url"
    ;;

  monitor-pr)
    id=${2:?monitor-pr requires an id}
    pr_owner=$(_pr_owner)
    pr_num=$(_get_metadata_field "$id" pr_number)

    while true; do
      pr_data=$(gh pr view "$pr_num" --repo "$REPO" --json state,comments,reviews 2>/dev/null) || {
        sleep 5
        continue
      }

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
      latest_review_state=$(echo "$pr_data" | jq -r \
        "[.reviews[] | select(.author.login == \"${pr_owner}\")] | sort_by(.submittedAt) | last | .state" \
        2>/dev/null) || { sleep 5; continue; }

      if [[ "$latest_review_state" == "APPROVED" ]]; then
        echo "approved"
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

      last_time=$(jq -r '.last_comment_time // "1970-01-01T00:00:00Z"' "$(_metadata_file "$id")" 2>/dev/null) \
        || last_time="1970-01-01T00:00:00Z"

      new_comments=$(echo "$all_comments" | jq -r \
        "[.[] | select(.login == \"${pr_owner}\" and .createdAt > \"${last_time}\")]" \
        2>/dev/null) || { sleep 5; continue; }

      count=$(echo "$new_comments" | jq 'length' 2>/dev/null) || { sleep 5; continue; }

      if [[ "$count" -gt 0 ]]; then
        latest_time=$(echo "$new_comments" | jq -r '[.[].createdAt] | max' 2>/dev/null) || { sleep 5; continue; }
        _set_last_comment_time "$id" "$latest_time"

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
    ;;

  *)
    echo "Usage: $0 {next-id|next-local-id|filename <id> <title>|plan-dir <id>|read-github <id>|save-metadata <id> <body>|metadata <id> <field>|write-github <id>|checkout-from-main <id>|commit <type> <scope> <id> <subject> <agent> <model-name> <model-email> [body]|commit-issue <id> <model-name> <model-email>|commit-plan <id> <model-name> <model-email>|create-branch <id>|draft-pr <id>|mark-ready <id>|cleanup-artifacts <id> <model-name> <model-email>|wait-ci <id>|merge-pr <id>|monitor-pr <id>}" >&2
    exit 1
    ;;
esac
