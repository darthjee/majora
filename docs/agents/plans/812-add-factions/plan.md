# Plan: Add factions

Issue: [812-add-factions.md](../issues/812-add-factions.md)

## Overview

Add `Faction` — a game-scoped, name+photo entity a `Character` can belong to (0 or many, via a
new `Character.factions` M2M field) — by combining two existing patterns: the catalog-style
CRUD/permissions/nav/list-page shape of `GameItem`/`GamePossession` (game-owned, `regular`
staff+player tier for create/photo-upload), and the **modal-based creation flow** of
`miniatures.Source` (`SourceNewModal`/`SourceNewController`, deferred photo upload) rather than
a dedicated `/new` page. Scope is deliberately narrow: no delete, no hidden/visibility concept,
and no Character↔Faction association UI (model field only) — all confirmed during
issue enhancement.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [cache](cache.md)
- [translator](translator.md)

## Shared contracts

**Backend → Frontend/Cache — endpoints** (all under `/games/<slug>/factions...`, mirroring
`backend/games/urls/games.py`'s `items` block but simplified — no hidden concept, so no
`/all.json` or `/full.json` variants):

| Method | Path | Purpose |
|---|---|---|
| GET | `/games/<slug>/factions.json` | paginated list, open to any game participant |
| POST | `/games/<slug>/factions.json` | create — `regular` tier (staff + any player) |
| GET | `/games/<slug>/factions/<id>.json` | detail, open to any game participant |
| PATCH | `/games/<slug>/factions/<id>.json` | update — **DM/staff only**, see permissions note below |
| POST | `/games/<slug>/factions/<id>/photo_upload.json` | init photo upload — `regular` tier (staff + any player) |

**Backend → Frontend — payload shapes** (single flat shape everywhere — no separate list vs.
detail serializer needed, since there's no extra field the detail view exposes beyond what the
list already shows):

- List item / detail / create response / update response (`FactionListSerializer`, reused for
  all four): `{ id, name, photo_path }`
- Create payload: `{ name }` → `201` with the shape above
- Update payload (PATCH): `{ name }` → the shape above

**Backend → Frontend — permissions (important correction vs. the issue text)**: the issue's
"Permissions" section says create/edit/photo-upload should all use the `regular` (staff +
player) tier, "matching Items". Deeper research during planning found this only holds for
`GameItem`'s **create**/**photo_upload** (`backend/permissions/config/game_item/endpoints.yml`,
`regular: {create: [staff, player], photo_upload: [staff, player]}`). `GameItem`'s **update**
(PATCH) actually goes through `check_game_edit` (`backend/games/views/common.py:24-32`), i.e.
`EndpointPermission(...).check(request, 'game', 'restricted', 'edit')` — **DM/staff only**, not
open to any player. The earlier research (during issue enhancement) that found a `player`-inclusive
"create_update" check was looking at `game_pc_item`/`game_npc_item` (character-owned items),
which is a different resource from the game-level `GameItem` catalog — the wrong analog for
Faction, which has no PC/NPC split. Faction should follow `GameItem`'s actual catalog-level
behavior: **create and photo-upload use the `regular` (staff+player) tier; update (PATCH) uses
`check_game_edit` (DM/staff only)**. Flagged here rather than silently changed on the issue —
worth a quick sanity check with the user if it matters for the product intent.

**Backend → Translator/Frontend — i18n keys** (mirrors `source_new_page.yaml`'s naming
convention exactly, since faction creation is modal-based like `Source`, not a dedicated `/new`
page like `GamePossession`):

- `game_factions_page.{title,loading,new_faction}`
- `faction_new_page.{title,name_label,submit,error,photo_upload_failed,retry_photo_upload,skip_photo_upload}`
- `faction_edit_page.{title,name_label,submit,error}`
- `faction_page.{loading}`
- `game_page.factions` — new key added to the *existing* `game_page.yaml`, alongside its
  existing `items`/`documents`/`treasures` keys

**Backend → Cache — endpoints to warm** (mirrors `navi/resources/games.yml`'s `game_items`/
`paginated_game_items`/`game_item_detail` block; the `photo_upload.json` POST and the `PATCH`
update are **not** warmed, same as every other resource's mutation endpoints):

- `GET /games/{:slug}/factions.json` (+ its paginated variant)
- `GET /games/{:slug}/factions/{:id}.json`

## Notes

- No delete, no hidden/visibility field, no description field — confirmed during issue
  enhancement; keep the model to exactly `game`, `name`, `photo`.
- `Character.factions = models.ManyToManyField('games.Faction', related_name='characters',
  blank=True)` is in scope (model field only); the UI to assign/remove a character's factions is
  explicitly deferred to a future issue.
- Faction lives inside the existing `games` app (`backend/games/models/faction/faction.py`),
  following the same convention as `Character`/`CharacterPhoto`/`GameItem` — not a new top-level
  Django app.
- `name` is unique per game (`unique_together`/`UniqueConstraint` on `(game, name)`), not
  globally unique like `miniatures.Source`.
