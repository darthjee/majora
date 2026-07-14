# Views Folder Organization

This document defines the target folder convention for `backend/games/views/` (and its
mirrored `backend/games/tests/views/` tree). It exists so the file responsible for any given
route is always predictable from its path alone.

> **Status:** this convention is documented but **not yet fully applied** across the
> codebase — see [Adoption status](#adoption-status) below. New view files should follow
> it; existing folders are migrated incrementally via dedicated follow-up issues, each
> referencing [issue #348](issues/348-organize-views-code-in-source.md).

## The convention

1. A plural-named folder (`games/`, `treasures/`, `pcs/`, `npcs/`, ...) holds that
   resource's own actions: list/create and single-item detail/update.
2. When a route nests a *different* resource under a specific item — e.g.
   `games/:slug/pcs`, `games/:slug/npcs`, `games/:slug/treasures`, `games/:slug/sessions`,
   `games/:slug/game-masters`, `games/:slug/access`, `games/:slug/photos` — those live in
   the sibling singular folder `game/`, one subfolder per nested resource: `game/pcs/`,
   `game/treasures/`, `game/sessions/`, `game/game_masters/`, etc.
3. When a route adds a *member action* on the same single item rather than a separate
   resource — e.g. `pcs/:id/full`, `pcs/:id/access`, `pcs/:id/photo_upload`,
   `pcs/:id/treasures`, `npcs/:id/slain`, `treasures/:id/access`,
   `staff/users/:id/recovery-link` — it lives in a `detail/` subfolder inside that
   resource's own folder.
4. This nests recursively where needed — e.g. `pcs/:id/photos/:photo_id/set.json` is a
   member action on a specific photo, so it lives at
   `game/pcs/detail/photos/game_pc_photo_set.py`.
5. Filenames keep their current descriptive names (e.g. `game_pc_full.py`,
   `treasure_access.py`) — only their folder location changes. No renaming to generic
   names like `index.py`/`show.py`.
6. `backend/games/tests/views/` mirrors the identical tree, one test file per view file.
7. `auth/` and `password_reset/` are excluded: every route there is a flat action on the
   current user with no id-nesting or member routes, so the convention adds nothing.

## Worked examples

| Route | File |
|---|---|
| `games.json`, `games/:slug.json` | stays in `games/` (games' own list/detail) |
| `games/:slug/pcs.json` | `backend/games/views/game/pcs/game_pcs.py` |
| `games/:slug/pcs/:id.json` | `backend/games/views/game/pcs/game_pc_detail.py` |
| `games/:slug/pcs/:id/full.json` | `backend/games/views/game/pcs/detail/game_pc_full.py` |
| `games/:slug/pcs/:id/access.json` | `backend/games/views/game/pcs/detail/game_pc_access.py` |
| `games/:slug/pcs/:id/photos/:photo_id/set.json` | `backend/games/views/game/pcs/detail/photos/game_pc_photo_set.py` |
| `games/:slug/treasures/:id.json` | `backend/games/views/game/treasures/game_treasure_detail.py` |
| `treasures/:id/access.json` (top-level treasure, not game-scoped) | `backend/games/views/treasures/detail/treasure_access.py` |
| `staff/users/:id/recovery-link.json` | `backend/games/views/staff/detail/staff_user_recovery_link.py` |

Every affected import (`urls.py`, package `__init__.py` re-exports) must be updated to
match the new paths whenever a slice is actually carried out.

## Adoption status

The convention is not yet applied to the existing tree. Today, `views/` groups files into
flat per-resource packages (`characters/`, `games/`, `treasures/`, `game_sessions/`,
`game_masters/`, `staff/`, `auth/`, `password_reset/`) without distinguishing a resource's
own actions from nested sub-resources or member actions on a single item — e.g.
`characters/` alone holds both PC and NPC endpoints (list, detail, full, access, photos,
photo upload, photo set, treasures, slain-set) in ~29 flat files.

Migrating the existing tree is deferred to smaller follow-up issues/PRs, each referencing
[issue #348](issues/348-organize-views-code-in-source.md):

1. `characters/` => `game/pcs/` + `game/npcs/` (the folder that motivated this convention).
2. `games/`'s nested sub-resources (`access`, `treasures`, `photos`, `photo_upload`) =>
   `game/`.
3. `game_sessions/` => `game/sessions/`, `game_masters/` => `game/game_masters/`.
4. `treasures/` and `staff/` detail-nesting for their member routes (`access`,
   `photo_upload`, `recovery-link`).
