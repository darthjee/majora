# Refactor claude scripts

## Context

The scripts in `.claude/scripts` have grown organically and now mix several distinct responsibilities — issue lifecycle, GitHub interaction, metadata management, PR lifecycle, commit message templating, and queue management — inside a small number of large files. `majora_issue.sh` in particular has accumulated commands for issue/plan files, commits, PR creation/monitoring/merging, CI polling, and metadata read/write, all interleaved in one script. This makes the script harder to read, test, and extend safely.

## What needs to be done

- Identify the distinct responsibility groups currently living in `majora_issue.sh`:
  - Issue/plan file management (`filename`, `plan-dir`, `next-id`, `next-local-id`)
  - GitHub read/write (`read-github`, `write-github`)
  - Commit templating (`commit`, `commit-issue`, `commit-plan`)
  - Metadata read/write (`save-metadata`, `metadata`, `has-tag`)
  - PR lifecycle (`draft-pr`, `mark-ready`, `merge-pr`, `cleanup-artifacts`)
  - CI/PR monitoring (`wait-ci`, `monitor-pr`)
  - Branch management (`checkout-from-main`, `create-branch`)
- Infra: extract each group into its own script under `.claude/scripts/` (e.g. `majora_metadata.sh`, `majora_commit.sh`, `majora_pr.sh`, `majora_github.sh`), with clear, minimal shared helpers between them (avoid duplicating `_find_issue_file`, `_extract_section`, etc. — factor shared helpers into a small sourced lib if needed).
- Infra: update the skill files in `.claude/commands/` (`majora-new-issue.md`, `majora-plan-issue.md`, `majora-fix-issue.md`, `majora-fix-all.md`) to call the new script locations/commands.
- Preserve existing behavior — no functional changes to the pipeline unless a cleanup opportunity is explicitly called out and confirmed.

## Acceptance criteria

- [ ] `.claude/scripts/majora_issue.sh` responsibilities are split into multiple smaller, focused scripts
- [ ] Shared helpers are not duplicated across the new scripts
- [ ] All `.claude/commands/*.md` skills are updated to reference the new scripts/commands
- [ ] The full pipeline (new-issue → plan → fix → monitor → merge) still works end-to-end with no behavior change

---
See issue for details: https://github.com/darthjee/majora/issues/56
