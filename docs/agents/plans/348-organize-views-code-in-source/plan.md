# Plan: Organize views code in source

Issue: [348-organize-views-code-in-source.md](../../issues/348-organize-views-code-in-source.md)

## Overview

This issue's own scope is limited to documenting a folder-organization convention for
`source/games/views/` (and its mirrored `source/games/tests/views/` tree) — no production
or test code is restructured here. The convention itself will be applied incrementally by
separate follow-up issues (one per "Delivery" slice listed in the issue). This plan covers
only the documentation work, and is entirely within the architect's own scope
(`docs/agents/`), so there is no agent split.

## Context

Views under `source/games/views/` currently mix concerns inconsistently — e.g.
`characters/` flatly holds 22 files for both PC and NPC endpoints, `games/` mixes the
top-level games resource with game-scoped sub-resources, and `game_sessions/`/
`game_masters/` sit as unrelated top-level folders despite being nested under a single
game. The issue proposes one convention (plural resource folder for a resource's own
actions; sibling singular `game/` folder for resources nested under a specific game;
`detail/` subfolder for member actions on a single item; recursive nesting; stable
filenames; mirrored test tree; `auth/`/`password_reset/` excluded) and asks that it be
written down so future slices (and future issues) can apply it consistently.

`docs/agents/architecture.md` is the existing source of truth for the backend's folder
layout — it currently describes `views/` in a single line (see line 60: "one file per
view/route, grouped into per-resource packages (`characters/`, `games/`, `treasures/`,
`game_masters/`, `auth/`, `password_reset/`)"). That line needs to be expanded/replaced by a
dedicated convention writeup.

## Implementation Steps

### Step 1 — Add a dedicated views-organization doc

Create `docs/agents/views-organization.md` containing:
- The rule set from the issue (numbered points 1–7), written as the authoritative
  convention for organizing `source/games/views/` (and its mirrored
  `source/games/tests/views/` tree).
- The worked examples from the issue (games/pcs/treasures/staff paths), reproduced or
  lightly adapted, so the mapping from a route to a file path is unambiguous.
- A short "Status" note stating the convention is documented but not yet fully applied
  across the codebase, and that adoption happens incrementally via follow-up issues (list
  the four "Delivery" slices from the issue as open work, with a note to file each as its
  own issue referencing #348 when tackled).

### Step 2 — Link the new doc from `architecture.md`

Update the `views/` bullet under `docs/agents/architecture.md`'s `### games/` section to
reference the new doc instead of (or in addition to) its current one-line description,
e.g.:

> `views/` — Function-based API views using `@api_view`, one file per view/route. Folder
> layout follows the convention documented in
> [views-organization.md](views-organization.md); shared auth/validation/pagination/access
> helpers live in `views/common.py`.

Keep the sentence accurate to the current (not-yet-migrated) state — the doc describes the
target convention, not necessarily what every folder looks like today, so phrase both
documents to make that distinction clear.

### Step 3 — Cross-check with the current tree

Before finalizing wording, do a quick pass over `source/games/views/` and
`source/games/tests/views/` to confirm the worked examples and folder names used in the new
doc match real, existing files/routes (e.g. confirm `characters/` really holds ~22 files,
confirm `games/`, `game_sessions/`, `game_masters/`, `treasures/`, `staff/` exist as
described) so the documentation doesn't misstate the current layout.

## Files to Change

- `docs/agents/views-organization.md` — new file documenting the views folder convention,
  worked examples, and delivery/follow-up status.
- `docs/agents/architecture.md` — update the `views/` bullet under `### games/` to link to
  the new doc.

## Notes

- No `source/` code changes in this issue — restructuring is explicitly deferred to
  follow-up issues per the issue's own "Delivery" section.
- No specialist agent (backend/frontend/infra/proxy/translator) has work here; this is
  pure `docs/agents/` documentation, squarely the architect's own scope.
- The issue itself has a `shipit` tag/pre-approval, so no review loop is expected before
  merge, but CI should still be confirmed green (this repo doesn't appear to run a docs-only
  CI job, so likely only whatever job(s) trigger unconditionally, if any).
