# Plan: Remove duplicated per-file doc summaries

Issue: [952-remove-some-summaries-duplication.md](../issues/952-remove-some-summaries-duplication.md)

## Overview

Remove the inline `> **Agent Summary:** ...` blockquote that commit `cfeffe5a` (#934/#935) added
right after the H1 heading in 5 docs under `docs/agents/`, now that commit `ba747141` (#939/#940)
introduced `docs/agents/summary.md` as the sanctioned, centralized place for this kind of abstract.
For the 2 files whose blockquote duplicates an existing description in their hub page, this is a
pure deletion. For the 3 files that had no other summary anywhere, backfill a short description in
the relevant hub page first, so removing the blockquote causes no loss of discoverability.

## Context

Exactly 5 files still carry the inline blockquote (verified via `grep -rl "Agent Summary" docs/`):

- `docs/agents/access-control/character.md`
- `docs/agents/access-control/common-rules.md`
- `docs/agents/access-control/principles.md`
- `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md`
- `docs/agents/product/entities/ownership-and-roles.md`

A sixth file that originally got one, `docs/agents/external/HOW_TO_USE_NAVI.md`, already lost it in
the unrelated "Fix #937 — Split navi config" commit — no change needed there.

Of the 5, `common-rules.md` and `principles.md` are true duplicates: `docs/agents/access-control.md`
already describes both in its "Shared reference" list. The other 3 have no equivalent elsewhere:

- `character.md` is a bare link in `access-control.md`'s "Models / resources" list.
- `HOW_TO_USE_DARTHJEE-TENT.md` isn't mentioned in `docs/agents/summary.md`'s "External tooling"
  section (only Cache Warmer, Frontend i18n, and How to Use Navi are listed there).
- `ownership-and-roles.md` isn't mentioned anywhere outside its own file; `docs/agents/product.md`
  only points at the `product/entities/` directory in general, with no per-entity description.

No non-doc code is touched. Nothing else from commit `cfeffe5a` (permission-class doc
restructuring, links to config YAML files, etc.) is reverted.

## Implementation Steps

### Step 1 — Delete the two true-duplicate blockquotes

In `docs/agents/access-control/common-rules.md` and `docs/agents/access-control/principles.md`,
delete the `> **Agent Summary:** ...` blockquote (the full quoted paragraph, including the
blank line that follows it) right after the H1 heading. Leave everything else in each file as-is.

### Step 2 — Backfill a description for `character.md`, then delete its blockquote

In `docs/agents/access-control.md`, under "Models / resources", change the bare
`- [Character (PC and NPC)](access-control/character.md)` line into a described entry (matching
the style already used for `Player`, `Upload`, etc. in that same list), summarizing: PC/NPC access
control, regular vs restricted routes, and the narrow player-facing PATCH/create field sets.

Then delete the blockquote from the top of `docs/agents/access-control/character.md`.

### Step 3 — Backfill a description for `HOW_TO_USE_DARTHJEE-TENT.md`, then delete its blockquote

In `docs/agents/summary.md`, under "External tooling", add a new bullet for
`[How to Use darthjee/tent](external/HOW_TO_USE_DARTHJEE-TENT.md)` right before the existing
"How to Use Navi" entry, mirroring that entry's style: what it's a hub for, and when to read it in
full (configuring the Tent reverse proxy / routing / middlewares / caching, or debugging proxy
behavior) vs. when Majora's own use of Tent is covered elsewhere (`flow.md`).

Then delete the blockquote from the top of `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md`.

### Step 4 — Backfill a description for `ownership-and-roles.md`, then delete its blockquote

In `docs/agents/product.md`, expand the "Core Entities" section so the pointer to
`docs/agents/product/entities/` also calls out `ownership-and-roles.md` specifically — summarizing:
the character ownership chain (`character.player.user`), the GameMaster/DM and Staff roles, and the
full character-editing rule set. Keep the existing list of other per-entity files as a plain
mention (do not describe every entity file — only add the one this issue actually removes coverage
for).

Then delete the blockquote from the top of `docs/agents/product/entities/ownership-and-roles.md`.

### Step 5 — Sanity check

Run `grep -rn "Agent Summary" docs/` and confirm it returns no results. Skim each of the 5 edited
files to confirm the H1 heading is now followed directly by the file's normal body content (no
leftover blank-line artifacts).

## Files to Change

- `docs/agents/access-control/character.md` — remove inline Agent Summary blockquote.
- `docs/agents/access-control/common-rules.md` — remove inline Agent Summary blockquote.
- `docs/agents/access-control/principles.md` — remove inline Agent Summary blockquote.
- `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md` — remove inline Agent Summary blockquote.
- `docs/agents/product/entities/ownership-and-roles.md` — remove inline Agent Summary blockquote.
- `docs/agents/access-control.md` — add a short description next to the `character.md` link.
- `docs/agents/summary.md` — add an entry for `HOW_TO_USE_DARTHJEE-TENT.md` under "External tooling".
- `docs/agents/product.md` — call out `ownership-and-roles.md` specifically under "Core Entities".

## Notes

- This is a docs-only change; no specialist agent split applies (the architect owns
  `docs/agents/` documentation directly), so this is a single, unsplit plan.
- No CI job runs against `docs/agents/**` content, so no `## CI Checks` section applies.
- Keep the backfilled descriptions short (1-3 lines), matching the existing style in each hub file
  — this is deliberately not a re-introduction of the same long blockquote text, just enough for an
  agent to decide whether to open the file.
