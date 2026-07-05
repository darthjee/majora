# Plan: Add game-exclusive treasures

Issue: [296-add-game-exclusive-treasures.md](../issues/296-add-game-exclusive-treasures.md)

## Overview

Add a nullable `game` foreign key (`on_delete=CASCADE`) to `Treasure`, so a treasure can belong
exclusively to one game, alongside the untouched `Game.treasures` many-to-many relationship
(which continues to support linking any treasure to any number of games). The backend gains a
game-scoped create endpoint (`POST /games/<slug>/treasures.json`, reusing the existing route),
a new game-scoped detail/update endpoint (`GET/PATCH /games/<slug>/treasures/<id>.json`), and
DM-aware photo-upload permission for game-exclusive treasures — all gated by the existing
`GameEditPermission`/`Game.can_be_edited_by` (superuser or that game's DM), the exact same
mechanism already used for NPC creation. The global `/treasures.json` and `/treasures/<id>.json`
endpoints are otherwise unchanged and remain superuser-only for writes. The frontend adds a
"New Treasure" button and per-card "Edit" action to the game treasures page, plus new
create/edit pages, gated by the game's DM/admin access check (mirroring the existing NPC
create-page pattern) combined with an exact `game_slug` match on each treasure.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [proxy](proxy.md)
- [translator](translator.md)

## Shared contracts

### Model change

`Treasure.game` — nullable `ForeignKey('games.Game', on_delete=models.CASCADE, related_name='exclusive_treasures')`.

**Important collision to avoid:** `Game` already has `treasures = ManyToManyField('Treasure', blank=True)` with no explicit `related_name`, whose implicit reverse query name on `Treasure` is `game` (Django derives it from the lowercased related model name). Adding a *second*, unrelated field literally named `game` on `Treasure` clashes with that implicit reverse query name (`fields.E305`). Backend must give the M2M an explicit `related_name`/`related_query_name` (e.g. `linked_games`/`linked_game`) in the same migration/PR that adds the new FK — see `backend.md` Step 1.

### New/changed endpoints (backend produces, frontend consumes)

| Method | URL | Who can call | Notes |
|---|---|---|---|
| `GET` | `/treasures.json` | Anyone | Now filtered to `game__isnull=True` (global treasures only) |
| `GET` | `/games/<slug>/treasures.json` | Anyone | Unchanged shape, but now returns the union of the M2M-linked treasures **and** treasures whose `game` FK points at this game |
| `POST` | `/games/<slug>/treasures.json` | That game's DM, or superuser (`GameEditPermission`) | Body: `{"name": str, "value": int}`; `game` is set server-side from the resolved game, never from the payload |
| `GET`/`PATCH` | `/games/<slug>/treasures/<int:treasure_id>.json` | GET: anyone. PATCH: that game's DM, or superuser (`GameEditPermission`) | New endpoint. 404 if the treasure's `game` does not match the resolved game. Distinct from — and does not alter — the existing superuser-only `PATCH /treasures/<id>.json` |
| `POST` | `/treasures/<id>/photo_upload.json` | Superuser always; additionally that treasure's game's DM when `treasure.game_id` is set | Existing endpoint, permission check extended (see `backend.md`) |

### Field exposed (backend produces, frontend consumes)

`game_slug` (string, nullable, read-only) is added to both `TreasureListSerializer` and
`TreasureDetailSerializer` (`source='game.game_slug'`, `default=None` — same style already used
for `photo_path`). The frontend uses an **exact string match** against the current page's
`game_slug` (never a truthy-only check) to decide whether a treasure is exclusive to the game
currently being viewed, since `GameDetailSerializer` does not expose a numeric `id` to compare
against and no self-service endpoint exists to link a foreign game's exclusive treasure into
another game's M2M list.

`TreasureAccessSerializer`'s `can_edit` (`GET /treasures/<id>/access.json`) is extended to also
return `true` when the treasure has a `game_id` and that game's DM/superuser is asking — i.e. it
reports "can edit via *any* available path" (global superuser-only PATCH, or the new
game-scoped PATCH), without touching `Treasure.can_be_edited_by` itself (which stays
superuser-only and continues to gate only the global `PATCH /treasures/<id>.json`). See
`backend.md` Step 3.

### Frontend page/route contract

New hash routes (added to `HashRouteResolver`, registered **before** the existing
`/games/:game_slug/treasures` route, mirroring the NPC route ordering):

- `/games/:game_slug/treasures/new` → `gameTreasureNew` → new `GameTreasureNew` page
- `/games/:game_slug/treasures/:id/edit` → `gameTreasureEdit` → new `GameTreasureEdit` page

Both pages gate access the same way `GameNpcNew`/`GameNpcNewController` already do: fetch
`GameClient#fetchGameAccess(gameSlug, token)` on mount and redirect away when `can_edit` is
false. The existing `GameTreasuresController` (list page) is updated to do the same single
per-page access fetch (replacing its current `AdminAccess.isSuperUser` global check), and each
treasure card's "upload photo"/"edit" actions are shown only when `access.can_edit &&
treasure.game_slug === gameSlug`.

## Notes

- `product-owner` was consulted before writing this plan: reusing `GameEditPermission`/
  `Game.can_be_edited_by` (superuser or that game's DM) for the new game-scoped
  create/update/photo-upload paths is a direct, well-precedented reuse of the existing
  GameMaster model (the same shape already documented for NPCs, which have no player/owner of
  their own). The dual relationship on `Treasure` (exclusive FK vs. the pre-existing,
  untouched, non-exclusive M2M) is a new-enough ownership shape that `docs/agents/product.md`
  should get a short clarifying note — see `backend.md` Step 6.
- `data-access` review must be invoked once `backend` is done (new endpoint, new serializer
  fields, changed permission logic) — `docs/agents/access-control.md` must be updated in the
  same PR (see `backend.md` Step 6).
- `security` review should also be invoked once `backend`/`proxy` are done (new endpoints,
  changed cache-cleanup rules, user input handling on the new create/update bodies).
