#!/usr/bin/env bash

# Helper script for Majora issue management.
#
# This is a thin dispatcher: the actual command implementations live in the
# split scripts below, each sourced as a function library. See those files
# for per-command documentation.
#
#   lib/majora_common.sh    — shared constants and helpers
#   majora_issue_files.sh   — issue/plan filename + ID commands
#   majora_metadata.sh      — metadata read/write + tag check
#   majora_github.sh        — GitHub issue read/write sync
#   majora_commit.sh        — commit message templating
#   majora_branch.sh        — branch checkout/creation
#   majora_pr.sh            — PR lifecycle, CI wait, PR monitoring
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
#   has-tag <id> <tag>     — exit 0 if <tag> is in the issue's metadata tags, exit 1 otherwise
#                            (e.g. `shipit` means the issue is pre-approved)
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/majora_common.sh"
source "${SCRIPT_DIR}/majora_issue_files.sh"
source "${SCRIPT_DIR}/majora_github.sh"
source "${SCRIPT_DIR}/majora_metadata.sh"
source "${SCRIPT_DIR}/majora_commit.sh"
source "${SCRIPT_DIR}/majora_branch.sh"
source "${SCRIPT_DIR}/majora_pr.sh"

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case ${1:-} in
    next-id) shift; cmd_next_id "$@" ;;
    next-local-id) shift; cmd_next_local_id "$@" ;;
    filename) shift; cmd_filename "$@" ;;
    plan-dir) shift; cmd_plan_dir "$@" ;;
    read-github) shift; cmd_read_github "$@" ;;
    save-metadata) shift; cmd_save_metadata "$@" ;;
    metadata) shift; cmd_metadata "$@" ;;
    has-tag) shift; cmd_has_tag "$@" ;;
    write-github) shift; cmd_write_github "$@" ;;
    checkout-from-main) shift; cmd_checkout_from_main "$@" ;;
    commit) shift; cmd_commit "$@" ;;
    commit-issue) shift; cmd_commit_issue "$@" ;;
    commit-plan) shift; cmd_commit_plan "$@" ;;
    create-branch) shift; cmd_create_branch "$@" ;;
    draft-pr) shift; cmd_draft_pr "$@" ;;
    mark-ready) shift; cmd_mark_ready "$@" ;;
    cleanup-artifacts) shift; cmd_cleanup_artifacts "$@" ;;
    wait-ci) shift; cmd_wait_ci "$@" ;;
    merge-pr) shift; cmd_merge_pr "$@" ;;
    monitor-pr) shift; cmd_monitor_pr "$@" ;;

    *)
      echo "Usage: $0 {next-id|next-local-id|filename <id> <title>|plan-dir <id>|read-github <id>|save-metadata <id> <body>|metadata <id> <field>|has-tag <id> <tag>|write-github <id>|checkout-from-main <id>|commit <type> <scope> <id> <subject> <agent> <model-name> <model-email> [body]|commit-issue <id> <model-name> <model-email>|commit-plan <id> <model-name> <model-email>|create-branch <id>|draft-pr <id>|mark-ready <id>|cleanup-artifacts <id> <model-name> <model-email>|wait-ci <id>|merge-pr <id>|monitor-pr <id>}" >&2
      exit 1
      ;;
  esac
fi
