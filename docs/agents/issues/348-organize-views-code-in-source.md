# Organize views code in source

## Context

Views are organized inconsistently under `source/games/views/`. `characters/` is the worst
offender: 22 files flatly holding both PC and NPC endpoints (list, detail, full, access,
photos, photo upload, photo set, treasures, slain-set) plus shared private helpers, making
it hard to find the file responsible for a given route. Other folders mix concerns too —
e.g. `games/` holds both the top-level games resource (`games.json`, `games/<slug>.json`)
and game-scoped sub-resources (`games/<slug>/treasures.json`, `games/<slug>/photos.json`),
while `game_sessions/` and `game_masters/` sit as unrelated top-level folders even though
their routes are nested under a single game too. `source/games/tests/views/` mirrors the
same layout.

## What needs to be done

Adopt one folder convention and document it so it can be applied to every view folder that
has id-nested or member routes (not just `characters/`), so the file responsible for a
route is always predictable from its path:

1. A plural-named folder (`games/`, `treasures/`, `pcs/`, `npcs/`, ...) holds that resource's
   own actions: list/create and single-item detail/update.
2. When a route nests a *different* resource under a specific item
   (`games/:slug/pcs`, `games/:slug/npcs`, `games/:slug/treasures`, `games/:slug/sessions`,
   `games/:slug/game-masters`, `games/:slug/access`, `games/:slug/photos`), those live in the
   sibling singular folder `game/`, one subfolder per nested resource — e.g. `game/pcs/`,
   `game/treasures/`, `game/sessions/`, `game/game_masters/`.
3. When a route adds a *member action* on the same single item rather than a separate
   resource (e.g. `pcs/:id/full`, `pcs/:id/access`, `pcs/:id/photo_upload`,
   `pcs/:id/treasures`, `npcs/:id/slain`, `treasures/:id/access`,
   `staff/users/:id/recovery-link`), it lives in a `detail/` subfolder inside that resource's
   own folder.
4. This nests recursively where needed — e.g. `pcs/:id/photos/:photo_id/set.json` is a
   member action on a specific photo, so it lives at
   `game/pcs/detail/photos/game_pc_photo_set.py`.
5. Filenames keep their current descriptive names (e.g. `game_pc_full.py`,
   `treasure_access.py`) — only their folder location changes. No renaming to generic names
   like `index.py`/`show.py`.
6. `source/games/tests/views/` mirrors the identical tree, one test file per view file.
7. `auth/` and `password_reset/` are excluded: every route there is a flat action on the
   current user with no id-nesting or member routes, so the convention adds nothing.

### Worked examples

- `games.json`, `games/:slug.json` stay in `games/` (games' own list/detail).
- `games/:slug/pcs.json` => `source/games/views/game/pcs/game_pcs.py`
- `games/:slug/pcs/:id.json` => `source/games/views/game/pcs/game_pc_detail.py`
- `games/:slug/pcs/:id/full.json` => `source/games/views/game/pcs/detail/game_pc_full.py`
- `games/:slug/pcs/:id/access.json` => `source/games/views/game/pcs/detail/game_pc_access.py`
- `games/:slug/pcs/:id/photos/:photo_id/set.json` =>
  `source/games/views/game/pcs/detail/photos/game_pc_photo_set.py`
- `games/:slug/treasures/:id.json` =>
  `source/games/views/game/treasures/game_treasure_detail.py`
- `treasures/:id/access.json` (top-level treasure, not game-scoped) =>
  `source/games/views/treasures/detail/treasure_access.py`
- `staff/users/:id/recovery-link.json` =>
  `source/games/views/staff/detail/staff_user_recovery_link.py`

Every affected import (`urls.py`, package `__init__.py` re-exports) must be updated to match
the new paths wherever a slice below is actually carried out.

### Delivery

This touches nearly every view file, every `__init__.py`, `urls.py`, and the whole test
tree, so it should be split into smaller follow-up issues/PRs rather than done as one
change, for example:

1. `characters/` => `game/pcs/` + `game/npcs/` (the folder that motivated this issue).
2. `games/`'s nested sub-resources (`access`, `treasures`, `photos`, `photo_upload`) =>
   `game/`.
3. `game_sessions/` => `game/sessions/`, `game_masters/` => `game/game_masters/`.
4. `treasures/` and `staff/` detail-nesting for their member routes (`access`,
   `photo_upload`, `recovery-link`).

**This issue's own scope is limited to documenting the convention** (e.g. in
`docs/agents/architecture.md`) so it is available for reference; each slice above should be
filed as its own follow-up issue referencing this one, rather than implemented here.

## Benefits

Smaller, homogeneous folders; the file responsible for any route becomes predictable from
its path alone; one consistent convention instead of several ad-hoc ones; less time spent
scanning directories, for humans and AI agents alike.

## Acceptance criteria

- [ ] `docs/agents/architecture.md` documents the view-folder convention described above
      (plural resource folder, sibling `game/` folder for nested resources, `detail/`
      subfolder for member actions, recursive nesting, filename stability, test-tree
      mirroring, and the `auth/`/`password_reset/` exclusion).
- [ ] The worked examples above are included or referenced in the documentation so the
      convention is unambiguous for future contributors/agents.
- [ ] No production or test code under `source/` is restructured as part of this issue —
      that is deferred to the follow-up issues listed under "Delivery".

Tags: :shipit:
