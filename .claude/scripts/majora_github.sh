#!/usr/bin/env bash

# GitHub issue read/write sync for Majora issue management.
#
# Commands:
#   read-github <id>       — fetch GitHub issue JSON (number, title, body); numeric IDs only;
#                            also extracts metadata (tags) from the body and saves it via save-metadata
#   write-github <id>      — update GitHub issue from local file; skips silently for x-prefixed IDs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/majora_common.sh"
source "${SCRIPT_DIR}/majora_metadata.sh"

cmd_read_github() {
  local id=${1:?read-github requires an id}
  if _is_local_id "$id"; then
    echo "Error: '$id' is a local-only id — no GitHub counterpart" >&2
    exit 1
  fi
  local json
  json=$(gh issue view "$id" --repo "$REPO" --json number,title,body)
  cmd_save_metadata "$id" "$(echo "$json" | jq -r '.body')"
  echo "$json"
}

cmd_write_github() {
  local id=${1:?write-github requires an id}
  if _is_local_id "$id"; then
    exit 0
  fi
  local file
  file=$(_find_issue_file "$id")
  local title
  title=$(_extract_title "$file")
  local body
  body=$(_extract_body "$file")
  gh issue edit "$id" --repo "$REPO" --title "$title" --body "$body"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case ${1:-} in
    read-github)
      shift
      cmd_read_github "$@"
      ;;

    write-github)
      shift
      cmd_write_github "$@"
      ;;

    *)
      echo "Usage: $0 {read-github <id>|write-github <id>}" >&2
      exit 1
      ;;
  esac
fi
