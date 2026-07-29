# Plan: Reduce `access-control` docs

Issue: [900-reduce--access-control--docs.md](../../issues/900-reduce--access-control--docs.md)

## Overview
`docs/agents/access-control/` is already split by resource with shared reference files
(`principles.md`, `common-rules.md`, `user-roles.md`) — that structure stays untouched. This plan
rewrites every file in the set for concision: strip historical issue-number citations and
long-winded justification asides, and condense inline rationale down to a link to the relevant
shared-reference file wherever the rule is already stated there. No documented rule, endpoint,
or behavior changes — only how verbosely each is stated.

## Context
- The issue's originally proposed "split by resource + define principles" solution was already
  implemented in issues #446 and #468.
- 15 of the 28 files carry historical issue-number citations (106 occurrences total, e.g.
  `character.md` alone has 22, `upload.md` 12, `game-document.md` 10), which is the main source
  of the bloat this issue targets.
- Doc set totals ~2560 lines / ~230KB across 28 files; `character.md` (411 lines), `upload.md`
  (207 lines), and `character-item.md` (224 lines) are the largest.
- This is documentation-only work under `docs/agents/`; it does not touch backend, frontend,
  proxy, infra, or translation code, so it stays entirely with the architect — no specialist
  agent has scoped ownership of this folder.

## Implementation Steps

### Step 1 — Establish the target style inline as each file is rewritten
There's no separate style guide to write first; apply this consistently while editing every file
in Step 2:
- Remove citations like `issue #619`, `(issue #712)`, `(#852)` — `git log`/`git blame` already
  preserve this history; the reference doc doesn't need to carry it.
- Where a rule, pattern, or derivation is already stated in `principles.md`, `common-rules.md`,
  or `user-roles.md`, replace the inline re-derivation with a link to that file instead of
  restating it.
- Collapse multi-sentence rationale/justification asides (the "why this shape was chosen" prose)
  down to the rule itself. Keep a rationale only when it's load-bearing for a future reader (a
  genuinely non-obvious constraint) — most of the current asides just narrate implementation
  history, which is exactly what's being cut.
- Preserve every table, endpoint, field name, permission class name, and behavior exactly as
  documented — this is a rewrite for concision, not a content or accuracy change.

### Step 2 — Rewrite each file under `docs/agents/access-control/`
Go through all 28 files plus the top-level index, applying Step 1's rules. Suggested order,
highest-impact first (by citation count / size):
1. `character.md` (22 citations, 411 lines — largest file)
2. `upload.md` (12 citations, 207 lines)
3. `game-document.md` (10 citations, 185 lines)
4. `character-item.md` (8 citations, 224 lines)
5. `endpoints.md`, `common-rules.md` (7 citations each) — these are shared-reference files
   themselves; trim citations the same way, but keep the actual named-rule content since other
   files link here specifically to avoid re-deriving it
6. `conversation.md` (6), `player.md` (4), `user.md` / `game-item.md` / `character-document.md`
   (3 each), `staff-cache.md` / `game.md` (2 each), `poll.md` / `character-photo.md` (1 each)
7. Remaining files with no citations (`treasure.md`, `character-treasure.md`, `game-treasure.md`,
   `game-session.md`, `game-session-message.md`, `task.md`, `link.md`, `character-link.md`,
   `game-photo.md`, `principles.md`, `user-roles.md`, `versioning.md`) — still pass over these for
   long-winded asides even though they have no citations to strip
8. `docs/agents/access-control.md` (top-level index, 3 citations) — trim the same way; it's the
   entry point so double check its links to per-resource files still resolve correctly afterward

### Step 3 — Verify nothing was lost
After the rewrite, diff each file's rule content (tables, permission class names, endpoint paths,
field names) against the pre-rewrite version to confirm no actual rule was dropped or altered —
only prose length and citations changed. Confirm every internal markdown link (e.g.
`[Character](character.md)`, `[common-rules.md](common-rules.md)`) still resolves after any
section renames.

## Files to Change
- `docs/agents/access-control.md` — trim citations, keep index links intact
- `docs/agents/access-control/*.md` (all 27 files) — trim citations and rationale asides per
  Step 1, preserving all documented rules/behaviors

## Notes
- Documentation-only change; no code, tests, or CI are affected, and no CI job targets this
  folder specifically.
- Judgment call per file on which asides are "load-bearing" vs. narrative — when in doubt, prefer
  cutting; the shared-reference files (`principles.md`, `common-rules.md`) remain the place for
  any rationale that's genuinely reusable across resources.
- Do not further split any file (e.g. `character.md` stays one file) and do not change the
  folder structure — both are explicitly out of scope per the issue.
