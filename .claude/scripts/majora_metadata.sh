#!/usr/bin/env bash

# Metadata read/write + tag check for Majora issue management.
#
# Commands:
#   save-metadata <id> <body>
#                          — parse a "Tags: :emoji: ..." line (case-insensitive) out of <body> and
#                            write {"issue_id": <id>, "tags": [...]} to .claude/state/metadata/issue_<id>.json
#   metadata <id> <field>  — read a field (e.g. pr_url, pr_number, tags) from
#                            .claude/state/metadata/issue_<id>.json
#   has-tag <id> <tag>     — exit 0 if <tag> is in the issue's metadata tags, exit 1 otherwise
#                            (e.g. `shipit` means the issue is pre-approved)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/majora_common.sh"

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

cmd_save_metadata() {
  local id=${1:?save-metadata requires an id}
  local body=${2:-}
  local tags_line
  tags_line=$(echo "$body" | grep -im1 '^tags:' || true)
  local tags_json="[]"
  if [[ -n "$tags_line" ]]; then
    tags_json=$(echo "$tags_line" \
      | grep -oE ':[a-zA-Z0-9_+-]+:' \
      | sed 's/^://;s/:$//' \
      | tr '[:upper:]' '[:lower:]' \
      | jq -R . | jq -s .)
  fi
  local file
  file=$(_ensure_metadata "$id")
  jq --arg id "$id" --argjson tags "$tags_json" '.issue_id = $id | .tags = $tags' \
    "$file" > "${file}.tmp"
  mv "${file}.tmp" "$file"
}

cmd_metadata() {
  local id=${1:?metadata requires an id}
  local field=${2:?metadata requires a field}
  _get_metadata_field "$id" "$field"
}

cmd_has_tag() {
  local id=${1:?has-tag requires an id}
  local tag=${2:?has-tag requires a tag}
  local file
  file=$(_metadata_file "$id")
  [[ -f "$file" ]] || exit 1
  local tag_lower
  tag_lower=$(echo "$tag" | tr '[:upper:]' '[:lower:]')
  jq -e --arg t "$tag_lower" '(.tags // []) | index($t) != null' "$file" > /dev/null
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case ${1:-} in
    save-metadata)
      shift
      cmd_save_metadata "$@"
      ;;

    metadata)
      shift
      cmd_metadata "$@"
      ;;

    has-tag)
      shift
      cmd_has_tag "$@"
      ;;

    *)
      echo "Usage: $0 {save-metadata <id> <body>|metadata <id> <field>|has-tag <id> <tag>}" >&2
      exit 1
      ;;
  esac
fi
