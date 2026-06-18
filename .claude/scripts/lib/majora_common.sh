#!/usr/bin/env bash

# Shared constants and helpers for the majora_* scripts.
# This file is sourced only — it defines no CLI dispatch of its own.

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
