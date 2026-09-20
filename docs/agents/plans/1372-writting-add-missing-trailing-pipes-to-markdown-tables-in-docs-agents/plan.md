# Plan: Writting: restore truncated Markdown table rows (and their trailing pipes) in docs/agents/

Issue: [1372-writting-add-missing-trailing-pipes-to-markdown-tables-in-docs-agents.md](../../issues/1372-writting-add-missing-trailing-pipes-to-markdown-tables-in-docs-agents.md)

## Overview
Restore the full cell text of the 8 table rows that the docs splits (#906, #908) truncated to ~205 characters with a literal `[...]`. Restoring the original text also puts back the closing pipe on the 3 rows Codacy flags under `MD055`. Docs-only change, no code or behavior touched. There is no specialist agent for `docs/agents/`, so the `architect` owns the work.

## Context
The truncated rows, with their line numbers on `main` at planning time:

- `docs/agents/frontend/pages-elements.md:6` and `:7` — cut off, no closing pipe.
- `docs/agents/product/entities/ownership-and-roles.md:166` (Player roster List) — cut off, no closing pipe.
- `docs/agents/product/entities/ownership-and-roles.md:160-164` (Player PC ownership, Staff role, NPC narrow player PATCH, NPC photo upload (init/finalize), PC photo upload (init)) — cut off at `[...]`, with a closing ` |` appended after the marker, so `MD055` does not flag them.

The originals are recoverable from git, and the prefix of every truncated row still matches its original exactly:

- `git show 19fe515b^:docs/agents/frontend.md` (rows starting `| **Element (resource-specific)**` and `| **Element (shared)**`)
- `git show 70d415ea^:docs/agents/product.md` (rows starting with the six labels above)

Rows elsewhere in `docs/agents/` that contain `[...]` (`specs/loot-crawling/source-to-collections.md`, `external/navi-client/samples/push-config-and-start.md`, `access-control/game-document.md`) are legitimate content and must not be touched.

## Implementation Steps

### Step 1 — Restore the two rows in `pages-elements.md`
Replace lines 6 and 7 of `docs/agents/frontend/pages-elements.md` with the full original rows from `19fe515b^:docs/agents/frontend.md` (the 270- and 231-character versions), each ending `... sub-folders when non-trivial. |`. Nothing has touched these rows since the split except the #1165 whitespace-only lint fix, so no reconciliation should be needed, but re-read the surrounding rows to confirm the table still matches the current `pages/elements/` and `common/` layout.

### Step 2 — Restore the six rows in `ownership-and-roles.md`
For each of lines 160-164 and 166 of `docs/agents/product/entities/ownership-and-roles.md`, replace the truncated row with the full original row from `70d415ea^:docs/agents/product.md`, matching by the row label. Before writing each row, reconcile it against later changes:

- Read `git log -p 70d415ea..HEAD -- docs/agents/product/entities/ownership-and-roles.md` to see what changed after the split (#915, #1023, #1151, #1368, and any others).
- The row's tail (the part that was lost) must not contradict the current text of the same row's head, or the neighbouring rows and sections. In particular check the Staff role row (its tail lists the "named read-only exceptions") against the Player roster List and PC photo upload rows, and the NPC/PC photo upload rows against any later photo-upload changes.
- Where an original tail is stale, edit it to match current behavior, rather than restoring outdated text or leaving `[...]` in.

Leave row 165 (Character money edit) as is: it was rewritten in #915 and is already complete.

## Files to Change
- `docs/agents/frontend/pages-elements.md` — restore rows 6 and 7 in full, each with a trailing pipe.
- `docs/agents/product/entities/ownership-and-roles.md` — restore rows 160-164 and 166 in full, each with a trailing pipe.

## CI Checks
- Repo root: `yarn lint_md` (CI job: `markdownlint`; locally via `docker-compose run markdownlint`)

## Notes
- `.markdownlint-cli2.jsonc` only enables `MD012`, `MD022` and `MD032`. `MD055` is not enforced by the CI job, so `yarn lint_md` passing does not prove the finding is fixed. Verify `MD055` locally by running markdownlint with `MD055` enabled ad hoc (for example `npx markdownlint-cli2 --config` pointing at a temporary config with `"MD055": true`, scoped to the two files), and confirm the Codacy finding clears once the PR is analyzed.
- Sanity check after editing: `grep -nF '[...]' docs/agents/frontend/pages-elements.md docs/agents/product/entities/ownership-and-roles.md` must return nothing, and every table row in both files must start and end with `|`.
- Line numbers drift: locate rows by their label, not by the numbers above.
- Do not change the legitimate `[...]` occurrences in the other three docs listed in Context.
