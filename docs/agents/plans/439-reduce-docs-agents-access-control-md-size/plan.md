# Plan: Reduce docs/agents/access-control.md size

Issue: [439-reduce-docs-agents-access-control-md-size.md](../../issues/439-reduce-docs-agents-access-control-md-size.md)

## Overview

Rewrite `docs/agents/access-control.md` (currently ~1095 lines / ~73KB, 22 sections) to be
significantly smaller while remaining a lossless, authoritative source for every access
fact it currently documents. The `data-access` and `security` agents read this file as
ground truth on every relevant review, so this is a prose/redundancy trim, not a scope
cut: every current per-role, per-endpoint, per-field rule must still be derivable from the
rewritten doc.

## Context

The doc currently inflates its size in three ways (see issue for detail):
1. The same permission patterns (e.g. "GameMaster of that game, or superuser") are spelled
   out in full, inline, in dozens of places instead of being defined once.
2. Prose describes every single route/field individually even when a section's routes
   share one pattern.
3. Inline historical citations like "(issue #254)" / "as of issue #275" are scattered
   through the rules text.

The repo's actual permission classes (`source/games/permissions.py`) already give canonical
names for the most common patterns: `GameEditPermission`, `CharacterEditPermission`,
`NpcPlayerEditPermission`, `TreasureEditPermission`, `GameSessionEditPermission`,
`TaskEditPermission` (all subclasses of `_EditPermission`). These are good candidate names
for the shared rules extracted in Step 2 below, since they tie the doc's vocabulary
directly to the code that enforces it.

## Implementation Steps

### Step 1 — Build a facts inventory (working notes, not committed)

Read `docs/agents/access-control.md` top to bottom and extract every discrete access fact
into a scratch checklist: for each section, every `(role, action, endpoint-or-field,
outcome)` tuple currently stated. This is the correctness baseline used in Step 4 to verify
nothing was dropped — it does not get committed, it's a working aid.

### Step 2 — Define shared rules

Near the top of the doc (after "User Roles", before the per-model sections), add a compact
"Common Rules" section that defines each repeated permission pattern once, named after the
matching permission class where one exists (e.g. `GameEditPermission`: GameMaster of that
game, or superuser). Cover at minimum:
- `GameEditPermission` pattern
- `CharacterEditPermission` pattern (PC)
- `NpcPlayerEditPermission` pattern (NPC — adds "any player of that game")
- `TreasureEditPermission`, `GameSessionEditPermission`, `TaskEditPermission` patterns
- Any other pattern that recurs 3+ times verbatim across sections (e.g. "Anyone" /
  `AllowAny` reads, "Superuser only", "Staff only")

Each rule gets one precise sentence. Sections below reference these by name instead of
restating them.

### Step 3 — Rewrite each section

Go section by section (Game, GamePhoto, Upload, Character, GameMaster, Player, User,
CharacterPhoto, CharacterTreasure, GameTreasure, Link, CharacterLink, Health check,
Authentication, Treasure, GameSession, Task, Historical records, Adding a new model):
- Replace inline restatements of a Step 2 rule with a reference to it (e.g. "Update — see
  `CharacterEditPermission`").
- Collapse per-route prose into tables where a section's routes share a pattern; keep prose
  only for genuinely route-specific nuance (e.g. the `Upload` finalisation side-effect
  dispatch, the `is_player` caveat on the Game access-status endpoint).
- Remove inline "(issue #NNN)" / "as of issue #NNN" citations from the rules text — state
  current behavior only. Do not relocate them into a changelog section; just remove them
  (git history is the record).
- Shorten sentences; cut hedging and repeated phrasing.
- Keep exposed/write field lists, response shapes, and status-code call-outs (401/403/404)
  — these are exact facts the `data-access`/`security` agents depend on, not verbosity.
- Keep the current section topics/headings recognizable (e.g. "Treasure", "Game") since
  `docs/agents/product.md` refers to sections by name.

### Step 4 — Verify against the facts inventory

Diff the Step 1 inventory against the rewritten doc: every `(role, action,
endpoint-or-field, outcome)` tuple must still be stated or unambiguously derivable via a
Step 2 rule reference. Anything missing gets added back before finishing.

### Step 5 — Sanity-check cross-references

Re-check `docs/agents/product.md` and `docs/agents/architecture.md` for any text that
names a specific `access-control.md` section or phrase, and confirm the rewritten doc still
satisfies it (`grep -n "access-control.md" docs/agents/product.md docs/agents/architecture.md`).

## Files to Change
- `docs/agents/access-control.md` — full rewrite per Steps 2–4: add a "Common Rules"
  section, collapse repeated per-section prose into rule references and tables, drop inline
  issue-number citations.

## Notes
- No specialist agent owns `docs/agents/` — this is architect-only documentation work, no
  agent split.
- No CI job lints this file; verification is manual (Step 4's inventory diff) plus a final
  read-through.
- Out of scope: changing any actual permission logic in `source/games/permissions.py` or
  views/serializers — this issue is documentation-only.
