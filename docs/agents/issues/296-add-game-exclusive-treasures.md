# Add game-exclusive treasures

## Context

Treasures currently are global entities: they can only be created and edited by superusers, and can optionally be linked to games through a many-to-many relationship (`Game.treasures`). There is no way to create a treasure that belongs exclusively to one game. Treasure creation and editing is currently superuser-only, with no Dungeon Master permission model (unlike Character, which allows the game's Dungeon Master). There is also no game-scoped treasure creation or edit flow in the frontend, and the global treasure list does not distinguish game-exclusive treasures from global ones.

## What needs to be done

This issue adds a new `game_id` field to Treasure so a treasure can be made exclusive to a single game, along with the frontend flow and permission changes needed to create, edit, and manage these game-exclusive treasures. The existing many-to-many `Game.treasures` relationship is unrelated and untouched by this change; it continues to support linking any treasure to any number of games.

- Backend: add a nullable `game` foreign key to the Treasure model with `on_delete=CASCADE`; add a migration. Add `POST` support to the existing `/games/<slug>/treasures.json` endpoint, setting `game` from the resolved game. Add a new game-scoped detail endpoint `PATCH /games/<slug>/treasures/<id>.json` whose permission check requires the treasure's `game_id` to match the resolved game AND the requesting user to be that game's Dungeon Master or a superuser — this is separate from (and does not alter) the existing `/treasures/<id>.json` endpoint, which remains superuser-only. Filter the existing `GET /treasures.json` to `game__isnull=True`. Update photo-upload permission checks similarly, allowing the game's Dungeon Master in addition to superusers for treasures with a `game_id`.
- Frontend: add a "new treasure" link/button to the `GameTreasures` page header; add a new game-scoped treasure creation route/page (`/#/games/:game_slug/treasures/new`) and edit route/page (`/#/games/:game_slug/treasures/:id/edit`); make the photo-upload and edit actions' visibility depend on `game_id` match and the user's Dungeon Master/admin role instead of superuser-only.

## Acceptance criteria

- [ ] `GET /treasures.json` only returns treasures where `game_id` is null (global treasures). The existing `Game.treasures` many-to-many relationship is unaffected.
- [ ] On `/#/games/:game_slug/treasures`, a link/button is added to the header that navigates to `/#/games/:game_slug/treasures/new`.
- [ ] The new page creates a treasure via `POST /games/:game_slug/treasures.json`; the created treasure's `game_id` is set automatically based on the resolved `game_slug` (no manual game selection).
- [ ] On `/#/games/:game_slug/treasures`, the "upload photo" action is shown only for treasures whose `game_id` matches the current game.
- [ ] On `/#/games/:game_slug/treasures`, an "edit" action is shown only for treasures whose `game_id` matches the current game, navigating to `/#/games/:game_slug/treasures/:id/edit`, which submits via `PATCH /games/:game_slug/treasures/:id.json`.
- [ ] Creating a game-exclusive treasure, uploading its photo, and editing it (through the new game-scoped edit page/endpoint) can be performed by the game's Dungeon Master or an admin, not only superusers. This permission is distinct from — and does not change — the existing superuser-only edit rule for `PATCH /treasures/:id.json`.
- [ ] Deleting a game cascades to delete its exclusive treasures (`game_id` treasures), same as it does for the game's characters.

Tags: :shipit:
