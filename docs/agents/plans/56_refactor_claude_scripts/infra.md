# Infra Plan: Refactor claude scripts

Main plan: [plan.md](plan.md)

## Design

`majora_issue.sh` stays the single entrypoint every skill in `.claude/commands/` already calls — its CLI surface (every existing subcommand and argument order) must not change. Internally, it becomes a thin dispatcher: it sources a shared helper library plus the new split scripts (as function libraries), then a `case` statement routes each subcommand to the matching function.

Each split script:
- Defines its commands as functions named `cmd_<command_with_underscores>` (e.g. `draft-pr` → `cmd_draft_pr`).
- Sources `lib/majora_common.sh` and any other split script it depends on, so it stays independently runnable for manual testing.
- Guards its own CLI dispatch with `if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then ... fi`, so sourcing it from `majora_issue.sh` (or from another split script) only defines functions, without also executing a case statement.

## Tasks

1. Create `.claude/scripts/lib/majora_common.sh` (sourced only, no dispatch):
   - Constants: `ISSUES_DIR`, `REPO`, `STATE_DIR`.
   - Helpers: `_is_local_id`, `_find_issue_file`, `_extract_title`, `_extract_body`, `_extract_section`, `_pr_owner`.

2. Create `.claude/scripts/majora_issue_files.sh`:
   - Functions: `cmd_next_id`, `cmd_next_local_id`, `cmd_filename`, `cmd_plan_dir` (moved verbatim from the current `next-id`/`next-local-id`/`filename`/`plan-dir` cases).
   - Sources `lib/majora_common.sh`.
   - Own guarded CLI: `next-id`, `next-local-id`, `filename <id> <title>`, `plan-dir <id>`.

3. Create `.claude/scripts/majora_metadata.sh`:
   - Internal helpers (moved as-is): `_metadata_file`, `_ensure_metadata`, `_set_pr_metadata`, `_get_metadata_field`, `_set_last_comment_time`.
   - Functions: `cmd_save_metadata`, `cmd_metadata`, `cmd_has_tag` (moved from `save-metadata`/`metadata`/`has-tag`).
   - Sources `lib/majora_common.sh`.
   - Own guarded CLI: `save-metadata <id> <body>`, `metadata <id> <field>`, `has-tag <id> <tag>`.

4. Create `.claude/scripts/majora_github.sh`:
   - Functions: `cmd_read_github`, `cmd_write_github` (moved from `read-github`/`write-github`; `read-github` still calls `cmd_save_metadata` directly instead of `bash "$0" save-metadata ...`).
   - Sources `lib/majora_common.sh` and `majora_metadata.sh`.
   - Own guarded CLI: `read-github <id>`, `write-github <id>`.

5. Create `.claude/scripts/majora_commit.sh`:
   - Functions: `cmd_commit`, `cmd_commit_issue`, `cmd_commit_plan` (moved from `commit`/`commit-issue`/`commit-plan`; internal `bash "$0" commit ...` calls become direct calls to `cmd_commit`, and `bash "$0" plan-dir ...` becomes `cmd_plan_dir`).
   - Sources `lib/majora_common.sh` and `majora_issue_files.sh`.
   - Own guarded CLI: `commit ...`, `commit-issue <id> <model-name> <model-email>`, `commit-plan <id> <model-name> <model-email>`.

6. Create `.claude/scripts/majora_branch.sh`:
   - Functions: `cmd_checkout_from_main`, `cmd_create_branch` (moved from `checkout-from-main`/`create-branch`; the `bash "$0" plan-dir ...` call in `create-branch` becomes `cmd_plan_dir`).
   - Sources `lib/majora_common.sh` and `majora_issue_files.sh`.
   - Own guarded CLI: `checkout-from-main <id>`, `create-branch <id>`.

7. Create `.claude/scripts/majora_pr.sh`:
   - Functions: `cmd_draft_pr`, `cmd_mark_ready`, `cmd_cleanup_artifacts`, `cmd_wait_ci`, `cmd_merge_pr`, `cmd_monitor_pr` (moved from `draft-pr`/`mark-ready`/`cleanup-artifacts`/`wait-ci`/`merge-pr`/`monitor-pr`). Replace internal `bash "$0" plan-dir ...` with `cmd_plan_dir`, and the `cleanup-artifacts` internal commit call with `cmd_commit`.
   - Sources `lib/majora_common.sh`, `majora_issue_files.sh`, `majora_metadata.sh`, `majora_commit.sh`.
   - Own guarded CLI: `draft-pr <id>`, `mark-ready <id>`, `cleanup-artifacts <id> <model-name> <model-email>`, `wait-ci <id>`, `merge-pr <id>`, `monitor-pr <id>`.

8. Rewrite `.claude/scripts/majora_issue.sh` as the dispatcher:
   - Keep the header usage comment (update paths/grouping if helpful, but keep every subcommand name and argument order identical).
   - Source `lib/majora_common.sh`, `majora_issue_files.sh`, `majora_github.sh`, `majora_metadata.sh`, `majora_commit.sh`, `majora_branch.sh`, `majora_pr.sh`.
   - Replace the body of the big `case` statement with one-line routes to the matching `cmd_*` function (e.g. `draft-pr) shift; cmd_draft_pr "$@" ;;`), preserving the existing `*) usage; exit 1 ;;` fallback.

9. Manually verify no behavior changed:
   - `bash .claude/scripts/majora_issue.sh <command> ...` still works for every command listed in the usage line.
   - Each split script also runs standalone for its own commands (e.g. `bash .claude/scripts/majora_metadata.sh has-tag 5 shipit`).
   - Re-run the smoke tests used earlier in this pipeline: `save-metadata` merge behavior, `commit` template output, `has-tag` exit codes, `metadata` getter, PR metadata round-trip — in a scratch git repo, the same way they were validated before this refactor.

## Files

| File | Change |
|------|--------|
| `.claude/scripts/lib/majora_common.sh` | New — shared constants and helpers |
| `.claude/scripts/majora_issue_files.sh` | New — issue/plan filename + ID commands |
| `.claude/scripts/majora_metadata.sh` | New — metadata read/write + tag check |
| `.claude/scripts/majora_github.sh` | New — GitHub issue read/write sync |
| `.claude/scripts/majora_commit.sh` | New — commit message templating |
| `.claude/scripts/majora_branch.sh` | New — branch checkout/creation |
| `.claude/scripts/majora_pr.sh` | New — PR lifecycle, CI wait, PR monitoring |
| `.claude/scripts/majora_issue.sh` | Rewritten — thin dispatcher sourcing the scripts above |
