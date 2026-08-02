# Issue: Remove duplicated per-file doc summaries

## Description
PR #935 (issue #934, commit `cfeffe5a`) added an inline blockquote (`> **Agent Summary:** ...`) right after the H1 heading of several docs under `docs/agents/`. Later, PR #940 (issue #939, commit `ba747141`) introduced a dedicated, centralized abstract file at `docs/agents/summary.md`, which is now the sanctioned mechanism for letting an agent decide whether to open a doc before loading it.

Having both mechanisms is redundant. This issue removes the inline blockquote summaries, keeping only the centralized `docs/agents/summary.md`/hub-page-description approach — backfilling a short description where the inline blockquote was the only summary that existed.

## Problem
The inline `> **Agent Summary:**` blockquote survives today at the top of exactly 5 files:

- `docs/agents/access-control/character.md`
- `docs/agents/access-control/common-rules.md`
- `docs/agents/access-control/principles.md`
- `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md`
- `docs/agents/product/entities/ownership-and-roles.md`

(A sixth file that originally got one, `docs/agents/external/HOW_TO_USE_NAVI.md`, already lost its inline summary in a later, unrelated commit — Fix #937 — so it needs no change here.)

For `common-rules.md` and `principles.md`, the inline blockquote is a true duplicate: `docs/agents/access-control.md` already gives each a short description next to its link (in the "Shared reference" list). But for the other 3 files, the inline blockquote is currently the *only* summary that exists anywhere — their parent hub page only lists them as a bare link with no description, and they aren't mentioned in `docs/agents/summary.md` either:

- `character.md` is listed bare in `access-control.md`'s "Models / resources" list.
- `HOW_TO_USE_DARTHJEE-TENT.md` isn't mentioned in `summary.md`'s "External tooling" section at all (only Cache Warmer, Frontend i18n, and How to Use Navi are).
- `ownership-and-roles.md` isn't mentioned anywhere outside its own file; `product.md` just points at the `product/entities/` directory in general.

## Expected Behavior
- All 5 files no longer carry a top-of-file `> **Agent Summary:**` blockquote.
- No other content introduced by commit `cfeffe5a` (permission-class doc restructuring, links to config YAML files, etc.) is touched or reverted.
- `character.md`, `HOW_TO_USE_DARTHJEE-TENT.md`, and `ownership-and-roles.md` each still have a short (1-3 line) summary discoverable from their hub page, so removing the inline blockquote causes no loss of discoverability.

## Solution
1. Delete the `> **Agent Summary:** ...` blockquote from the top of each of the 5 files listed above, leaving the rest of each file unchanged.
2. Backfill a short description (matching the style already used for `common-rules.md`/`principles.md` in `access-control.md`) in:
   - `docs/agents/access-control.md` — add a one-line description next to the `character.md` link in "Models / resources".
   - `docs/agents/summary.md` — add an entry for `HOW_TO_USE_DARTHJEE-TENT.md` under "External tooling", mirroring the existing "How to Use Navi" entry.
   - `docs/agents/product.md` (or the relevant entities index, if one exists) — add a short mention of `ownership-and-roles.md`'s content.

## Benefits
- Removes redundant/duplicated documentation-about-documentation for `common-rules.md` and `principles.md`.
- Keeps a single, authoritative place per doc for agents to decide whether to open it, without losing discoverability for the 3 files that had no other summary.
