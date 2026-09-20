# Issue: Writting: restore truncated Markdown table rows (and their trailing pipes) in docs/agents/

## Description
Codacy's markdownlint scan (`MD055`, CodeStyle, Info severity) flags 3 table rows in `docs/agents/` that are missing a trailing `|` (leading-only pipe style instead of the project's leading-and-trailing convention). Investigation shows the missing pipe is a symptom of a larger problem: the docs splits in #906 (`frontend.md` → `frontend/*`) and #908 (`product.md` → `product/entities/*`) truncated long table cells to ~205 characters and inserted a literal `[...]`, losing content.

## Problem
Eight table rows contain a truncated cell ending in a literal `[...]`:

- `docs/agents/frontend/pages-elements.md:6` and `:7` — cut off, no closing pipe (flagged by `MD055`). Original text ended with "...sub-folders when non-trivial. |".
- `docs/agents/product/entities/ownership-and-roles.md:166` ("Player roster List") — cut off, no closing pipe (flagged by `MD055`).
- `docs/agents/product/entities/ownership-and-roles.md:160-164` ("Player PC ownership", "Staff role", "NPC narrow player PATCH", "NPC photo upload (init/finalize)", "PC photo upload (init)") — also cut off at `[...]`, but with a closing ` |` appended after the marker, so `MD055` does not flag them.

The full original text is recoverable from git: the pre-split `docs/agents/frontend.md` (`19fe515b^`) and `docs/agents/product.md` (`70d415ea^`). The prefix of every truncated row still matches its original row exactly. Adding only the trailing pipe would silence the linter but leave the lost content, and the literal `[...]`, in the docs.

## Expected Behavior
- [ ] The 8 truncated rows (2 in `pages-elements.md`, 6 in `ownership-and-roles.md`) contain their full cell text, with no literal `[...]` truncation marker left in these two files.
- [ ] Every restored row has both a leading and a trailing pipe, and both tables still render correctly.
- [ ] Restored text is reconciled against later edits (e.g. #915 money-edit removal, #1368) so no stale statement is reintroduced.
- [ ] Codacy's markdownlint `MD055` finding clears for these files.
- [ ] Other legitimate `[...]` occurrences (`source-to-collections.md`, `push-config-and-start.md`, `game-document.md`) are left untouched.

## Solution
For each of the 8 rows, take the original row from the pre-split source (`git show 19fe515b^:docs/agents/frontend.md` and `git show 70d415ea^:docs/agents/product.md`), check it against the current state of the docs/code and any later edits to that row's subject, and replace the truncated row in place. Docs-only change; no code or behavior is touched.

## Benefits
- Recovers documentation content that was silently lost when the docs were split.
- Clears the `MD055` finding for the right reason instead of masking the truncation with a bare trailing pipe.
- Removes misleading half-sentences (e.g. rows ending mid-word at `trea[...]`) that agents reading these docs would otherwise trust.
