#!/usr/bin/env bash

# Helper script for Majora issue management.
#
# ID conventions:
#   numeric (1, 5, 42)  — issue has a counterpart on GitHub
#   x-prefixed (x01)    — local-only issue, no GitHub counterpart
#
# Commands:
#   next-id             — next numeric ID from existing issue files
#   next-local-id       — next x-prefixed ID (x01, x02, ...) from existing issue files
#   filename <id> <title> — canonical path: docs/agents/issues/<id>_<slug>.md
#   read-github <id>    — fetch GitHub issue JSON (number, title, body); numeric IDs only
#   write-github <id>   — update GitHub issue from local file; skips silently for x-prefixed IDs

set -euo pipefail

ISSUES_DIR="docs/agents/issues"
REPO="darthjee/majora"

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
  tail -n +2 "$file" | sed '/^$/d' | head -1 > /dev/null
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

  *)
    echo "Usage: $0 {next-id|next-local-id|filename <id> <title>|read-github <id>|write-github <id>}" >&2
    exit 1
    ;;
esac
