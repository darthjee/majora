# Issue: Allow game links edit

## Description
Add a links-edit modal to the game edit page (`/#/games/:id/edit`), mirroring the one already on the PC edit page (`/#/games/:game_slug/pcs/:id/edit`). On the game show page (`/#/games/:game_slug`), move the links list from the right column to the left column, above the "Next Session" section.

While implementing this, two gaps surfaced that are part of this issue's scope:
- The backend has no write path for `GameLink` yet — only a read-only serializer.
- This is also the moment to split the game update endpoint into `regular` (staff/player) and `restricted` (dm/admin) tiers, mirroring the pattern that already exists for characters (`game_pc`/`game_npc`).

## Problem
- Editing a game's links today requires direct DB/admin access — there's no UI or write API for it, unlike characters.
- On the game show page, links sit in the right column below the description and PC/NPC lists — less prominent than "Next Session," despite links (music, diary, reference material, etc.) being just as relevant during play.
- The game edit endpoint (`GameUpdateSerializer`) is currently all-or-nothing: only dm/admin can PATCH anything on a game, with no narrower tier for staff/players to contribute lower-risk edits.

## Expected Behavior
- On the game edit page, an "Edit Links" button opens the same links-edit modal used on character edit pages, seeded with the game's current links; confirming commits the change with the rest of the edit form.
- On the game show page, the links list renders in the left column, above "Next Session" (previously in the right column).
- dm/admin can edit `name`, `description`, and `links` on a game (the `restricted` tier — unchanged from today's behavior).
- staff/players can edit `description` and `links` on a game, but not `name` (the new `regular` tier). A `name` value sent by a regular-tier request is silently ignored, matching how `CharacterRegularUpdateSerializer` already handles its own restricted-only fields.
- On the game edit page itself, a regular (non-full) editor can reach the page and edit `description`/links, but the `name` field is disabled/hidden for them.

## Solution

### Backend write support

`GameUpdateSerializer` currently only accepts `name`/`description` — there is no write path for `GameLink` yet (only the read-only `GameLinkSerializer`). Implementation mirrors the existing `CharacterLink` write pattern exactly, rather than extracting a shared base (keeps the change isolated from already-shipped character code, and matches the codebase's existing style of parallel, separate character/game serializers):

- Add `GameLinkWriteSerializer` (parallel to `CharacterLinkWriteSerializer` in `games/serializers/characters/character_link_write.py`): accepts `id` (optional, identifies an existing link to update/delete), `text`, `url`, `link_type`, and a transient `delete` flag. Same validation rules — `id` required when deleting, `url` required for a new (id-less), non-deleted entry.
- Add `GameLinksSync` (parallel to `CharacterLinksSync`): applies a validated list of entries to a game's `links` — create/update/delete per entry, wrapped in a transaction.
- Add a `validate_links_count` equivalent (or reuse the shared one if it's generic enough) to bound batch size (`MAX_LINKS`).
- Wire `links = GameLinkWriteSerializer(many=True, required=False)` into `GameUpdateSerializer`, with a `validate_links` hook and an `update()` override that pops `links` and applies `GameLinksSync` after the scalar-field update — same shape as `CharacterUpdateSerializer.update()`.

### Frontend edit-page wiring and show-page layout move

PCs already have a unified `{ Show, Edit }` slot for links (`CharacterLinksSlot.jsx` + `CharacterLinksField.jsx`, in the page's `left` column) that renders the same links block in both show and edit mode. Building the equivalent for games satisfies both the "add links editing to the game edit page" ask and the "move links above next session on the show page" ask in one piece of work — the show-mode half of the slot *is* the layout move.

Per the project's own documented convention (`docs/agents/frontend/pages-elements.md`, which explicitly calls out `LinksEditModal` as character-only *until* a second resource needs it): relocate the reusable pieces to `components/common/` now that games need them too, rather than duplicating them.

- Relocate `LinksEditModal` (+ `LinksEditModalController`/`LinksEditModalHelper`) and `CharacterLinksField` (+ `CharacterLinksFieldHelper`) from `character/pages/elements/` into `components/common/`, generalizing their naming away from "Character" (e.g. `LinksField`). Pure move/rename — no behavior change to existing character flows.
- Add `GameLinksSlot.jsx` under `resources/game/pages/elements/show/`, exporting `GameLinksShow` (wraps the shared `LinkList`) and `buildGameLinksField` (button + preview), mirroring `CharacterLinksSlot.jsx`.
- In `gameShowType.js`: remove the `right`-column `{ Show: LinkList }` entry; add `{ Show: GameLinksShow, Edit: gameLinksField }` to the `left` array, positioned before `GameNextSessionBlock`.
- `GameEdit.jsx`: add `links`/`showLinksModal` state (seeded from the loaded game's `links`), an `onOpenLinksModal` handler, and render `<LinksEditModal>` alongside `PhotoUploadModal`, matching `CharacterEdit.jsx`'s wiring.
- `GameEditController.submitForm`: include `links` in the PATCH body, matching the backend's new `links` field on `GameUpdateSerializer`.

### Split the game update endpoint into regular/restricted tiers

Mirroring the `game_pc`/`game_npc` `regular`/`restricted` pattern that already exists for characters:

- **`restricted`** (dm + admin) — full field set: `name`, `description`, `links`. This is exactly today's `check_game_edit` behavior (`games/permissions/config/game/endpoints.yml`'s `restricted.edit` list is already empty, i.e. admin/dm-shortcut-only), so no config change needed for this tier.
- **`regular`** (staff + player) — narrower field set: `description`, `links`. `name` (renaming the game) stays dm/admin-only, since it's a bigger, more identity-defining change than editing the blurb or reference links.

Implementation, mirroring `games/views/game/_regular.py` / `_full.py` / `_shared.py` (currently only wired for `game_pc`/`game_npc`):

- Add a `regular` block to `games/permissions/config/game/endpoints.yml`: `regular.regular_edit: [staff, player]` (no `owner` — that role is PC-scoped, not applicable at the game level).
- Add `GameRegularUpdateSerializer` (fields: `description`, `links`), parallel to `CharacterRegularUpdateSerializer`.
- `GameUpdateSerializer` (the `restricted`/full tier) keeps all three fields: `name`, `description`, `links`.
- Add view-layer dispatch for `game_detail`'s PATCH, choosing between the regular and restricted serializer/permission-check pair based on the requester's role, the same way `games/views/game/_shared.py` picks between PC/NPC regular vs full today.
- A regular-tier (staff/player) request that includes `name` anyway is silently ignored (DRF drops fields not declared on `GameRegularUpdateSerializer`) — no explicit rejection/400 needed.

#### Frontend consequence: `GameEdit.jsx` must distinguish "can reach edit page" from "can edit `name`"

Today `GameEdit.jsx` gates the whole page on a single `game.can_edit` (sourced from `AccessStore.ensureGamePermissions`, i.e. `games/permissions/config/game/ui.yml`'s `edit` key — currently empty, admin/dm-shortcut-only). Once `regular` exists, staff/player must be able to reach the page too, but only edit `description`/`links`, not `name` — same shape as the PC edit page (`canReachEditPage` = `can_edit || is_player || is_staff`; `isFullEditor` = `can_edit` alone, threaded down to gate the `name` field specifically, e.g. `pcShowType.js`'s `buildCharacterNameField({...}, true)`).

The building blocks already exist generically (`BaseAccessSerializer` exposes `is_dm`/`is_player`/`is_staff`/`is_owner` for every resource, games included) — `GameEditController` simply isn't fetching/merging the identity (`AccessStore.ensureGameAccess`) side yet, only the permissions (`can_edit`) side:

- `games/permissions/config/game/ui.yml`: add a second UI-permission action (e.g. `regular_edit: [staff, player]`, alongside the existing empty `edit: []`) so the frontend can request a `can_edit_regular`-style flag distinct from full `can_edit`, mirrored in `games/permissions/config/pages/game.yml`.
- `GameEditController.loadResource`: also merge `AccessStore.ensureGameAccess(gameSlug)` (for `is_player`/`is_staff`) alongside the existing `ensureGamePermissions` call.
- `GameEdit.jsx`: replace the `game.can_edit`-only reachability/redirect check with `canReachEditPage`-style logic (`can_edit || is_player || is_staff`), and thread an `isFullEditor` flag down so the `name` field renders read-only/disabled for regular (non-full) editors — mirroring `pcShowType.js`'s `buildCharacterNameField`.

### Test coverage

**Backend:**
- `GameLinkWriteSerializer` (mirrors `character_link_write_test.py`): valid with only `url`, `id` optional, `text` optional, `link_type` blank allowed, `delete` defaults to `False`, `url` required when not deleting, `url` not required when deleting, `id` required when deleting.
- `GameLinksSync` / `GameUpdateSerializer.update()` (mirrors `character_update_test.py`'s link cases): creates a new link without `id`, updates existing link fields, deletes when `delete: true`, omitting `links` leaves existing links untouched, accepts payload at `MAX_LINKS` cap, rejects payload over cap.
- `GameRegularUpdateSerializer` (mirrors `character_regular_update_test.py`): confirms its field set (`description`, `links` — no `name`); a `name` in the payload is silently dropped; `links` sync behaves identically to the restricted path.
- Permission config / view dispatch (mirrors `game_pc_permissions_test.py`'s shape): dm/admin can hit the restricted (full) endpoint; staff/player can hit the regular endpoint but not the restricted one; anonymous/unrecognized roles get neither.

**Frontend:**
- `GameLinksSlot` (new, mirrors `CharacterLinksSlot`'s coverage): show-mode renders `LinkList`, edit-mode renders the button + preview.
- `gameShowTypeSpec.js`: `left` now contains the links slot before `GameNextSessionBlock`; `right` no longer has the old `LinkList` entry.
- `GameEditSpec.js` / `GameEditHelperSpec.js` (mirrors `CharacterEditLinksSpec.js`): opening/confirming/cancelling the links modal, links included in the submit payload, `name` field disabled/hidden for a regular (non-full) editor.
- Relocated common components (`LinksEditModal` + controller/helper, `LinksField`): move their existing specs from `character/pages/elements/` to `components/common/`, updating import paths — behavior-neutral, no new cases needed.

## Benefits
- Consistent UX: games get the same links-editing experience PCs already have.
- The show page surfaces more time-relevant info ("Next Session") right after the links a player might want at hand, both now grouped in the prominent left column.
- Enables staff and players to collaboratively maintain a game's external links and description without requiring DM/admin involvement for every small edit.
- Establishes the regular/restricted permission split for games, extending a pattern already proven for characters, opening the door for finer-grained game-editing permissions in the future.
