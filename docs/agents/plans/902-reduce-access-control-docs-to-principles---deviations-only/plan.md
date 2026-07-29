# Plan: Reduce access-control docs to principles + deviations only

Issue: [902-reduce-access-control-docs-to-principles---deviations-only.md](../issues/902-reduce-access-control-docs-to-principles---deviations-only.md)

## Overview

Add three named defaults to `docs/agents/access-control/principles.md` (resource CRUD pattern,
hidden-gated collection pattern, field-naming conventions), then rewrite every per-resource file
under `docs/agents/access-control/` to reference those defaults instead of restating them,
keeping only genuine deviations. Docs-only — no code changes, no file splitting/merging. This is
cross-cutting documentation work with no backend/frontend/infra/proxy/translation code touched,
so it stays entirely within the architect's own scope (no agent split).

## Context

#900 already removed issue-number citations and condensed prose in this doc set, but every
resource file still repeats near-identical CRUD/permission tables, and six-plus sub-resource
files (item/document/treasure/photo, per `Character` and `Game`) restate the same
plain-vs-`/all.json`/`full.json` hidden-gating shape almost verbatim. Full detail is in the issue
file; see it for the problem statement and the exact defaults agreed with the user.

## Implementation Steps

### Step 1 — Add the three defaults to `principles.md`

Add these as new top-level sections (exact anchor slugs matter — later steps link to them):

1. **`## Default resource CRUD pattern`**
   - List/Detail → `AllowAny`.
   - Create/Update → the resource's own `<Resource>Edit` permission (substituting the resource's
     actual named rule from `common-rules.md`, e.g. `GameEdit`, `CharacterEdit`,
     `GameSessionEdit`).
   - Delete → superuser-only, via Django admin; never an API route.
   - State explicitly: a resource file only needs a CRUD table/section when it deviates from
     this — otherwise a one-line reference suffices.

2. **`## Default hidden-gated collection pattern`** (for sub-resources like `CharacterItem`,
   `GameItem`, `CharacterDocument`, `GameDocument`, `CharacterTreasure`, `GameTreasure`):
   - Plain `list.json`/`detail.json` → `AllowAny`; excludes rows where `hidden=true`; response
     never includes a `hidden` field.
   - Restricted `all.json`/`full.json` → the resource's edit-level permission (e.g.
     `CharacterEdit`/`GameEdit`); includes hidden rows; response includes `hidden`.
   - Create/Update → the resource's own `*CreatePermission`.
   - Note that resource-specific extras (fallback-to-parent field resolution, `available.json`/
     `acquire.json`/`remove.json`-style extra actions, NPC-only hidden-visibility gates) are
     deviations to keep documenting per file.

3. **`## Field-naming conventions`**
   - `private_x` — real/restricted value, paired with a `public_x` counterpart (fold in the
     existing "Public vs regular attribute pattern" section here rather than duplicating it).
     Exposed, for both read and write, only on the resource's full/edit-level route; never on the
     partial/public route.
   - `id` / `<related>_id` — always safe to expose to anyone regardless of endpoint; never
     accepted in a create/update request payload (always server-assigned) — resource files no
     longer need to state this per endpoint.
   - `hidden` — restricted-only field exposure + row filter, exactly per the "Default
     hidden-gated collection pattern" above.
   - `incognito` — same restricted-visibility treatment as `hidden`, `Character`-specific, and
     cascades: an incognito (or hidden) NPC also gates its own nested sub-resources (documents,
     items, photos), not just its own fields. State the cascade once here; per-file mentions
     become a one-line pointer instead of a re-derivation (e.g. `character-document.md`'s
     existing "Incognito" prose collapses to a reference).
   - Keep the existing "Public/regular is distinct from hidden attributes" distinction, folded
     into this section (it already draws exactly this line, just needs relocating/merging rather
     than rewriting).

### Step 2 — Rewrite per-resource files to reference the defaults

For every file below, replace the restated CRUD/hidden-gating boilerplate with a short reference
to the relevant `principles.md` anchor, keeping *only* what's specific to that resource
(deviations, extra endpoints, field lists, validation rules, business logic). Do not touch
`principles.md`, `common-rules.md`, or `user-roles.md` themselves in this step (already handled
in Step 1), and do not touch `access-control.md`'s index beyond what Step 3 below covers.

Group by how much each file changes:

**A. Matches the default CRUD pattern almost exactly — collapse to a one-liner + deviations only:**
- `game-session.md` — one-liner for CRUD (Create/Update = `GameSessionEdit`, matches default
  once substituted), but *keep* the three-way list split (past/future/unscheduled instead of one
  plain list) and the "no separate access.json/permissions.json" note as deviations.
- `task.md` — already reads as a deviation (no public read at all); trim its boilerplate Delete
  row but keep everything about the no-public-read behavior, since that itself *is* the
  deviation from the default.
- `poll.md`, `player.md`, `conversation.md` — check each against the default; where their
  `PollPermission`/`PlayerPermission`-style rules diverge from a plain `<Resource>Edit`
  substitution (e.g. `PlayerPermission` allows any player/DM to read, not just edit-level roles),
  keep that as the stated deviation rather than forcing a false one-line match.

**B. Matches the default CRUD pattern with a clearly named deviation to state explicitly:**
- `game.md` — Create is "any authenticated user," not `AllowAny` like List/Detail; state that one
  deviation, drop the rest of the table. Keep `access.json`/`permissions.json`/`My Games list`
  sections as-is (they're resource-specific endpoints, not part of the default CRUD table).
- `treasure.md` — global-route Create/Update is "superuser or staff," not a per-resource
  `<Resource>Edit`; state that deviation explicitly (already partly documented in
  `common-rules.md`'s `TreasureEdit` row — cross-reference instead of re-deriving).
- `link.md`, `user.md`, `staff-cache.md` — confirm whether each is close enough to the default to
  warrant a one-liner-plus-deviation, or different enough (e.g. `user.md`'s Staff-or-superuser
  gate on every action) that it should stay a compact custom table instead of forcing the default
  template. Use judgment; the goal is concision, not a forced fit.

**C. Sub-resource files following the hidden-gated collection pattern — largest cut:**
- `character-item.md`, `game-item.md`, `character-document.md`, `game-document.md`,
  `character-treasure.md`, `game-treasure.md`, `character-photo.md`, `game-photo.md` — replace
  the restated plain/all/full table with a one-line reference to "Default hidden-gated collection
  pattern," then keep only:
  - Resource-specific extra endpoints (`available.json`/`acquire.json`/`remove.json` on
    `character-item.md`; buy/sell on `character-treasure.md`; upload/finalize flows on the photo
    docs — cross-reference `upload.md` rather than re-deriving).
  - Fallback-resolution rules (e.g. `CharacterItem` falling back to `GameItem`'s `name`/
    `description`/`hidden` when unset).
  - NPC-specific hidden-character-gate cascades (now a one-line pointer to the new `incognito`/
    `hidden` cascade rule in `principles.md`, per Step 1).
  - Exact field lists per endpoint (kept, per the issue's scope — only the permission/hidden
    boilerplate is cut, not the data-shape documentation).

**D. Leave essentially unchanged (no meaningful default-pattern duplication to cut):**
- `upload.md`, `versioning.md`, `endpoints.md`, `user-roles.md`, `game-session-message.md`,
  `character-link.md`, `game-photo.md` upload-init cross-references — skim each; only touch if a
  restated CRUD/hidden-field boilerplate is actually found. Don't force a rewrite where there's
  nothing to cut.

### Step 3 — Update the top-level index

`docs/agents/access-control.md`'s "Permission Principles" bullet (under "Shared reference")
should mention the three new named defaults (CRUD pattern, hidden-gated collection pattern,
field-naming conventions) alongside the existing access-level-hierarchy/partial-vs-full/public-
vs-hidden mentions, so a reader knows to check there before diving into per-resource files.

### Step 4 — Verify nothing was lost

Diff every rewritten file against its pre-rewrite version (via `git diff`) and confirm no actual
access rule, endpoint, field, or behavior was dropped — only the restated boilerplate. Where a
file's deviation-only version reads ambiguously without the full table, err on the side of
keeping a compact table rather than a lossy one-liner (matches the issue's "preserve every actual
access rule" constraint carried over from #900's own ground rule, restated here for this pass).

## Files to Change

- `docs/agents/access-control/principles.md` — add the three new default-pattern sections; fold
  in existing public/regular and hidden-attribute content rather than duplicating.
- `docs/agents/access-control/game.md`, `game-session.md`, `task.md`, `treasure.md`, `poll.md`,
  `player.md`, `conversation.md`, `link.md`, `user.md`, `staff-cache.md` — collapse CRUD tables
  to defaults + stated deviations (per Step 2 groups A/B).
- `docs/agents/access-control/character-item.md`, `game-item.md`, `character-document.md`,
  `game-document.md`, `character-treasure.md`, `game-treasure.md`, `character-photo.md`,
  `game-photo.md` — collapse to the hidden-gated collection default + resource-specific
  extras/deviations (Step 2 group C).
- `docs/agents/access-control/character.md` — apply the `private_x`/`hidden`/`incognito`
  field-naming-convention references in place of the inline derivations currently spread across
  its Allegiance/Slain/Hidden/Incognito sections; its partial-vs-full route structure itself is
  already covered by the existing "Partial vs full access pattern," not new in this issue.
- `docs/agents/access-control.md` — update the "Permission Principles" description (Step 3).
- Skim (touch only if boilerplate is found): `upload.md`, `versioning.md`, `endpoints.md`,
  `user-roles.md`, `game-session-message.md`, `character-link.md`.

## Notes

- No code changes anywhere — this plan touches only files under `docs/agents/access-control/`
  and `docs/agents/access-control.md`.
- Judgment calls (which files count as "close enough" to a default to collapse) are intentionally
  left to whoever implements this — the issue explicitly prioritizes concision over forcing every
  file into the same template; a resource with too many real deviations should keep a compact
  custom table rather than an artificially forced one-liner.
- Verify every internal cross-reference/anchor link still resolves after the rewrite (several
  files link to specific headings in `principles.md`/`common-rules.md` that this plan relocates
  or renames).
- This is documentation-only work with no natural owner among the specialist agents (backend,
  frontend, infra, proxy, translator) — it stays with the architect end-to-end, consistent with
  `docs/agents/architecture.md`'s "cross-cutting/documentation" routing.
