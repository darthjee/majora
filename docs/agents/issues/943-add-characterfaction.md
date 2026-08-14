# Issue: Add CharacterFaction

## Description

Like `CharacterDocument`, `CharacterFaction` is a thin join model connecting a `Character` to a `GameFaction`. A character may be connected to several factions, each faction can have several characters, but a given character can never be added to the same faction twice (`unique_together`).

## Problem

- Faction membership currently has no functional representation. `Character.factions` (`backend/games/models/character/character.py:52`) is a plain `ManyToManyField('games.Faction', ...)` added in migration 0093 alongside `Faction` itself, but it was never wired into any serializer, view, or frontend — only a model-level default-value test references it.
- The `Faction` model itself is a naming outlier. Every other game-scoped catalog resource (`GameDocument`, `GameItem`, `GameTreasure`, `GamePossession`, and their `*Photo` counterparts) is named and located as `Game*` under `backend/games/models/game/`, while `Faction`/`FactionPhoto` live in their own `backend/games/models/faction/` folder without the `Game` prefix — even though parts of the codebase already assume the prefixed name (`GameFactionPermissionsSerializer`, the `game_faction` permissions-config folder, a `page_key='game_faction'` comment).
- There is no way for a player or DM to enlist/recruit a character into a faction, or to see which characters belong to a faction, anywhere in the UI. `GameFaction.jsx`'s own docstring notes it "renders no 'give'/acquisition modal."

## Expected Behavior

- **Character show page**: shows a shortlist of the character's factions (linking to the full list), plus a button/modal mirroring the existing exchange-item modals but relabeled — "enlist" opens it, the acquire tab reads "enlist," the remove tab reads "quit." Applies to both PCs and NPCs.
- **Faction show page**: gains a right-side column listing the characters connected to that faction through `CharacterFaction`, with real pagination synced to the URL hash (`/#/game/:game_slug/factions/:id?page=2&per_page=24`). A "recruit" button/modal — built like the give-modal on the document list page — lets a player/DM add characters to the faction directly from this page. Clicking a listed character navigates to that character's own page (PC or NPC, based on its type).
- **Endpoints**: a public `/game/:game_slug/factions/:id/characters.json` returning a faction's non-hidden characters (photo, name, id, type), and a DM/admin-only `/factions/:id/characters/all.json` that includes hidden ones.

## Solution

### Naming & Faction model rename

- `Faction` → `GameFaction`, `FactionPhoto` → `GameFactionPhoto`; both files move from `backend/games/models/faction/` to `backend/games/models/game/game_faction.py` / `game_faction_photo.py`, matching the other `Game*` models.
- Serializers renamed to match: `FactionListSerializer` → `GameFactionListSerializer` (file `faction_list.py` → `game_faction_list.py`), `FactionUpdateSerializer` → `GameFactionUpdateSerializer`, `FactionPhotoSerializer` → `GameFactionPhotoSerializer`.
- Test factory `FactionFactory` → `GameFactionFactory` (`backend/games/tests/factories/faction.py`).
- The `Faction` → `GameFaction` migration must use `RenameModel` (not drop/recreate) so the table and data survive.
- Views/URLs/permissions config already use the `game_faction_*` naming — only their imports need to follow the renamed model/serializers, no further renaming needed there.
- Frontend already mirrors the same convention `CharacterDocument` uses (top-level page components say `GameFaction`, inner helpers/elements say `Faction`) — no frontend renames needed.
- `Character.factions`, the unused plain M2M described in Problem above, is removed entirely and replaced by the new `CharacterFaction` through-model below.

### CharacterFaction model

Same shape as `CharacterDocument`: `character` FK (`games.Character`, `on_delete=CASCADE`), `game_faction` FK (`games.GameFaction`, `on_delete=CASCADE`), a `hidden` boolean field, `HistoricalRecords`, and `unique_together = ('character', 'game_faction')`.

### Enlist/quit endpoints & permission tiers

Mirrors `CharacterDocument`'s acquire/remove exchange exactly (`_document_exchange.py`, `game_pc_document`/`game_npc_document` permission config), reusing the shared `_CHARACTER_ROUTES` table (`backend/games/urls/_character_routes.py`) that already builds the parallel PC/NPC URL sets:

- Routes: `/factions.json`, `/factions/all.json`, `/factions/<int:faction_id>.json` (+`/full.json`), `/factions/available.json` (+`/available/all.json`), `/factions/acquire.json` (+`/acquire/all.json`), `/factions/remove.json` (+`/remove/all.json`) — for both `pcs` and `npcs`.
- New permission resources `game_pc_faction` / `game_npc_faction`, config shaped exactly like `game_pc_document`/`game_npc_document`'s `endpoints.yml`:
  - `regular.create: [staff, player]` — gates the plain `/acquire.json` / `/remove.json` (used by the character-side enlist/quit modal).
  - `restricted.create: [staff, owner]` — gates `/acquire/all.json` / `/remove/all.json` (DM/admin variant).
  - No extra `create_update` tier — `CharacterFaction` rows only ever come from acquire, never a standalone creation form (matches `document`, not `possession`).
- The recruit modal reuses these same acquire/remove endpoints, picking the `regular` vs `restricted` variant per request exactly like `GiveDocumentModalController`'s `canGiveHidden` flag does today.

### Recruit modal & endpoints

A new `RecruitModal` component, structurally a 1:1 copy of `GiveDocumentModal.jsx` + `GiveDocumentModalController.js` + `GiveDocumentModalHelper.jsx` (`frontend/assets/js/components/resources/document/pages/elements/`): left side browses a game's PCs/NPCs with a debounced server-side `name` search (tabs), picking a character adds it to a right-side "receiving" list (repeat click is a no-op), submit fires one `POST .../factions/acquire.json` per newly-picked character. Like documents (boolean membership, no quantity), an already-enlisted row stays in the list grayed out and is skipped on submit — no in-modal "quit"/remove tab; it's add-only, exactly like the give-document modal.

- New per-character "already enlisted" check endpoints, mirroring `game_pc_document_summary`/`game_npc_document_summary` (`games/<slug>/documents/<id>/pcs/<char_id>/summary.json`): `games/<slug>/factions/<id>/pcs/<char_id>/summary.json` (+ `npcs` variant), returning `{'enlisted': <bool>}` (boolean, same shape as document's `{'owned': <bool>}`), plus `/summary/all.json` DM/admin variants gated by the `restricted` tier — used by the modal to gray out already-enlisted rows.
- Submission picks the `regular` vs `restricted` acquire/remove variant via a `canRecruitHidden`-equivalent flag on `GameFactionController`, computed exactly like `GameDocumentController`'s `canGiveHidden` (superuser/dm/staff, dropping player) fixed in #833.
- "Recruit" is purely the button/modal label — no new endpoint verbs; it drives the same `factions/acquire.json` / `factions/acquire/all.json` character-side endpoints as "enlist," just initiated from the faction's side with the character being the variable instead of the faction.

### Faction show page character list component

`GameFaction.jsx` currently has no right column at all. This issue adds one:

- A new panel/component (name TBD at plan time) rendered in the show page's right column, fetching its data through `RequestStore` against the new `/factions/:id/characters.json` (or `/all.json` for DM/admin) endpoint.
- Pagination is real, not a capped preview: `page`/`per_page` are read directly from the current hash query string (the URL is the source of truth), rendered with the existing generic `Pagination` component (`frontend/assets/js/components/common/pagination/Pagination.jsx`), using its default `pageParam`/`perPageParam` (`'page'`/`'per_page'`) since it's the only pagination on the page.
- This is why it's "similar to `ShortList`, but not the same": `ShortList` caps at `maxItems` and links out to a separate "see all" page; this component instead paginates in place with no item cap — closer in shape to a full resource list page's card grid (e.g. `GameFactions.jsx`) embedded inside a show page's column.
- Each card is a new read-only component mirroring `PossessionPreviewCard`'s shape (photo + name, whole card links out) showing the photo, name, id, and type per the "Special endpoints" response shape below. The link href branches on `item.type` (`'pc'` → `#/games/:slug/pcs/:id`, `'npc'` → `#/games/:slug/npcs/:id`), the same convention `shortListResourceConfig`'s `pc`/`npc` entries already use.
- The recruit button/modal sits above this panel; a successful recruit purges the `faction` characters cache and re-triggers the panel's fetch, mirroring `GameDocument.jsx`'s give-modal wiring.
- **Out of scope for this issue**: the panel is read-only aside from the recruit button — no per-row "kick" control to remove a character from the faction directly from this panel. Split out to [#1106](https://github.com/darthjee/majora/issues/1106).

### Special endpoints

The endpoints to show characters that belong to a faction:

- **regular**: `/game/:game_slug/factions/:id/characters.json`
  - everyone can access
  - does not return hidden characters
  - `GameFaction` has no `hidden` concept — not introduced by this issue, so there's no faction-level 404 gate here (only individual hidden characters are excluded)
  - returns: the photo, the name, the id, the type (pc/npc)
  - sets no `X-Skip-Cache` header at all — its output is identical for every viewer, matching `game_documents`' regular-listing convention
- **restricted**: `/game/:game_slug/factions/:id/characters/all.json`
  - only for dm and admin
  - always sets `X-Skip-Cache: true` on the response unconditionally, matching `game_documents_all`'s restricted-listing convention

### Edge cases

- **Double-enlist**: acquiring a faction the character is already in → `422` (mirrors `CharacterDocument`'s `game_document_already_owned`).
- **Quit a faction you're not in**: remove on a non-existent `CharacterFaction` row → `404` (mirrors `character_document_remove`).
- **Hidden character on enlist/quit/available endpoints**: 404 for non-owners, same `_hidden_gate_response` gate every other character-exchange endpoint uses; `X-Skip-Cache` is set there exactly as it already is for the equivalent document endpoints (conditionally, when `character.hidden`), unrelated to the faction list endpoints' unconditional/no-header split above.
- **Cascade deletes**: deleting a `Character` or a `GameFaction` cascades and removes the `CharacterFaction` rows (`on_delete=CASCADE` on both FKs), same as `CharacterDocument`.
- **Cross-game recruit**: the faction lookup in acquire/remove is scoped to `game.factions` (not global `GameFaction.objects`), so a faction from another game can never be targeted — same scoping `_find_game_document` already does.
- **Empty faction**: the character-list panel needs its own "no characters yet" empty-state i18n key when a faction has zero members.
- **Out-of-range page**: reuses the existing `paginated_list_response` helper's standard behavior, no special-casing.
- **Slain characters**: included in the faction's character list by default, same as the main PC/NPC list endpoints (slain is only ever excluded via an explicit opt-in query param elsewhere, never on by default) — no slain-filtering query param added in this issue.

### Scope boundaries

**In scope:**
- `Faction` → `GameFaction` rename (model, photo model, serializers, factory) and removal of the unused `Character.factions` M2M.
- New `CharacterFaction` through-model and its migration.
- Enlist/quit modal + endpoints on the character show page, and the recruit modal + character-list panel on the faction show page — for **both PCs and NPCs**.
- The regular/restricted `/factions/:id/characters.json` (+`/all.json`) endpoints, and the per-character "already enlisted" summary endpoints (pc/npc, regular/restricted).
- i18n keys for the "enlist"/"quit"/"recruit" wording, tab labels, empty states, and errors.
- Backend and frontend automated test coverage for all of the above.

**Explicitly out of scope (deferred):**
- Any `hidden` concept on `GameFaction` itself, or a faction-level 404 gate.
- A per-row "kick"/remove control on the faction's character-list panel — split to [#1106](https://github.com/darthjee/majora/issues/1106).
- Any change to `GameFaction`'s own CRUD pages (list/create/edit) beyond the mechanical rename — no new fields, no new UI there.

## Benefits

- Finishes an already-half-adopted naming convention (`Faction` → `GameFaction`), removing an inconsistency the codebase had already started assuming was fixed.
- Replaces dead, unwired scaffolding (`Character.factions`) with a fully-featured, tested join model and UI.
- Gives players and DMs a working way to track and manage faction membership, consistent with how every other character-exchange resource (documents, items, possessions, treasures) already works.
- Reuses proven exchange/permission/pagination patterns end-to-end (acquire/remove tiers, give-modal shape, generic `Pagination` component), minimizing net-new design risk.
