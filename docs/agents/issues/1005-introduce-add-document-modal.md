# Issue: Introduce Add document modal

## Description

Add a "Give Document" modal on the game document detail page
(`/#/games/:game_slug/documents/:document_id`), mirroring the existing "Give Item" (PR #990, issue
#827, commit `0b9cb00`) and "Give Treasure" (PR #1002, issue #1001, commit `65cd548`) features.
Unlike treasure/item, `CharacterDocument` has no `quantity` — ownership is boolean
(`unique_together = ('character', 'game_document')`) — so a character who already owns the
document must be shown grayed out in the receiving list and must not be re-triggered by another
click.

## Problem

- There is no "does this character already own this document" endpoint (unlike
  `CharacterTreasure`, which got a `quantity` summary in issue #1001).
- There is no entry point on the document detail page to give the document to characters.
- The existing "Give Item" and "Give Treasure" buttons are unconditionally visible today, even
  though a role-check helper (`canUploadPhoto`, already present on `GameItemController` and
  `GameDocumentController`) exists and is simply never wired to them — button visibility is
  inconsistent across the three "Give X" pages.
- Document acquire/remove endpoints have only one permission tier (`restricted.create`: staff or
  PC owner; staff only for NPC) — there is no `regular` tier, so a non-owning player cannot
  acquire a document for someone else's PC or for any NPC even through the "regular" endpoint.
  This blocks the new Give Document button from working for the exact players/dm/staff/admin it's
  meant to be visible to.

## Expected Behavior

- A "Give Document" button appears on the document detail page for users who are superuser,
  staff, dm, or a player of the game (`is_superuser || is_staff || is_dm || is_player`); users
  with none of these roles for the game don't see it.
- Clicking it opens a modal with a browse pane (PC/NPC tabs, search, pagination) on the left and a
  receiving list on the right — same layout as Give Treasure/Give Item.
- Clicking a character in the browse pane adds them to the receiving list if not already there;
  clicking an already-listed character is a no-op (no quantity to increment/decrement).
- Once a character is added, their ownership is fetched once (`.../summary.json`); if already
  owned, that receiving-list row renders grayed out / disabled.
- Submitting fires one acquire request per **non-grayed** row only; already-owned rows are skipped
  client-side and never trigger a request (the backend's existing 422 "already owned" response
  remains a safety net, not the primary guard).
- The same permission gate (superuser/staff/dm/player) is retroactively applied to the existing
  "Give Item" and "Give Treasure" buttons, fixing their current unconditional visibility.
- Any staff member or player of the game (not just the PC's owner) can now use the regular
  acquire/remove endpoints for documents; the restricted (`/all.json`) variant is tightened to the
  PC's owning player (or dm/admin) for PCs, and dm/admin only for NPCs.

## Solution

### Backend: document summary endpoint

New endpoints mirroring the treasure summary pattern (`_treasure_summary.py`,
`game_npc_treasure_summary(_all)` / `game_pc_treasure_summary(_all)`), but boolean instead of a
count, since `CharacterDocument` is a plain join with no `quantity` field:

- `GET /games/<slug>/documents/<document_id>/pcs/<id>/summary.json` — **AllowAny**
- `GET /games/<slug>/documents/<document_id>/npcs/<id>/summary.json` — **AllowAny**, plus the
  hidden-NPC gate
- `GET /games/<slug>/documents/<document_id>/pcs/<id>/summary/all.json` — `restricted.create`
  (staff, or the PC's owning player), bypasses the hidden-document gate
- `GET /games/<slug>/documents/<document_id>/npcs/<id>/summary/all.json` — `restricted.create`
  (staff only), bypasses the hidden-document gate

Response: `{"owned": true|false}`, backed by
`CharacterDocument.objects.filter(character=character, game_document=document).exists()`. Reuses
the existing `_find_game_document` hidden-document gate (from `_document_exchange.py`) and the
existing `game_pc_document`/`game_npc_document` permission config resources. Update
`docs/agents/access-control/character-document.md` with the new endpoints, matching the "Treasure
quantity summary endpoints" section's shape in `character-treasure.md`.

### Frontend: interaction model

Mirrors `GiveTreasureModal`'s browse-pane (left) / receiving-list (right) / batched-submit flow
(`GiveTreasureModalController`, `GiveTreasureModalHelper`, `TwoColumnLayout`, `BrowsePager`), with
the quantity concept dropped since `CharacterDocument` is boolean ownership:

- **Browse pane (left)**: unchanged — paginated/searched PC/NPC list (`pc.collection` /
  `npc.collection`), no ownership indicator shown here; the summary is only fetched lazily, once a
  character is picked, avoiding a summary call per browse-page row.
- **Click a character**: adds them to the receiving list (right side) if not already listed
  (mirrors `addCharacter`'s `findRow` dedup). Unlike treasure, a repeat click on an already-listed
  character is a no-op — no `pendingQuantity` to increment.
- **On add**, fetch `.../documents/<document_id>/pcs|npcs/<id>/summary.json` once for that
  character (mirrors `fetchSummary`). If `owned: true`, render that receiving-list row **grayed /
  disabled**.
- **Receiving-list rows drop the quantity +/- controls** entirely (no `onIncrement`/`onDecrement`
  equivalent) — just character name/avatar + owned-state.
- **Submit** fires one `POST .../acquire.json` per **non-grayed** row only — already-owned rows are
  skipped client-side and never trigger a request, even though the backend's
  `character_document_acquire` already 422s `"already owned"` as a safety net.

### Frontend: entry point + button visibility (all 3 "Give X" pages)

Add a "Give Document" primary button on `GameDocument.jsx`'s detail page
(`DocumentDetailHelper`), same placement as the existing Edit button, opening the new
`GiveDocumentModal`.

While reviewing this, we found the button visibility should be gated consistently, and currently
isn't — scope expanded to fix all three "Give X" buttons (Item, Treasure, Document) together:

- Gate on `is_superuser || is_staff || is_dm || is_player` (via `AccessStore.ensureGameAccess`) —
  `is_dm`/`is_player` already cover a game's DM and regular players/owners; `is_superuser` is the
  admin bypass. A logged-in user with none of these roles for the game (e.g. someone with no
  relation to it) should not see the button.
- **GameItem** and **GameDocument** already compute this exact condition today as `canUploadPhoto`
  (`GameItemController`/`GameDocumentController`'s `#canUploadPhoto` static helper) — it's just
  never wired to their "Give Item" button, which is currently unconditionally rendered
  (`ItemDetailHelper.#renderPageActions`'s doc comment literally says "unconditionally visible").
  Reuse the same `canUploadPhoto` value to also gate the Give button.
- **GameTreasure** has no equivalent flag yet (`GameTreasureController` currently only merges
  `AccessStore.getTreasurePermissions` (`can_edit`) onto the treasure). Add a new flag mirroring
  `#canUploadPhoto`'s shape (same `AccessStore.ensureGameAccess` call, same boolean condition),
  and use it to gate `GameTreasureHelper`'s "Give Treasure" button (currently unconditional, per
  its own doc comment "no permission gate").
- **GameDocument**'s new "Give Document" button uses the same `canUploadPhoto` flag from the
  start, consistent with the fixed Item/Treasure behavior.

### Naming / i18n

Mirrors the treasure precedent exactly, under `document/pages/elements/...`:

- `GiveDocumentModal.jsx`
- `controllers/GiveDocumentModalController.js`
- `helpers/GiveDocumentModalHelper.jsx`
- `helpers/DocumentReceivingRowHelper.jsx` (mirrors `TreasureReceivingRowHelper.jsx`)

i18n namespace `give_document_modal.*`: `title` ("Give Document"), `pc_tab`, `npc_tab`,
`search_placeholder`, `cancel`, `clear`, `submit`, `already_owned_tooltip`,
`remove_character_tooltip`, `loading`, `load_error`, `result_success` ('Document given to
{{name}}.'), `result_failure` ('Unable to give document to {{name}}.'). Drops
`give_treasure_modal`'s quantity-only keys (`pending_quantity_tooltip`, `increment_tooltip`,
`decrement_tooltip`, `remaining_units`, `partially_fulfilled`) — no equivalent concept for a
boolean document.

`documentConfig.js`: add a new `GET.summary` entry mirroring `treasureConfig.js`'s
`summary`/`summaryAll` shape (`regular`/`private` variants, `skipCache: true` on both, path
`/games/:gameSlug/documents/:documentId/:kind/:id/summary.json` and `.../summary/all.json`).

### Permissions (server-side, confirmed — no changes needed)

The `restricted.create` permission tiers the new `/summary/all.json` endpoints need already exist
and match the treasure precedent exactly:

- `game_pc_document/endpoints.yml`: `restricted.create` → `staff`, `owner`
- `game_npc_document/endpoints.yml`: `restricted.create` → `staff`

Both are reused unchanged by `check_document_summary_all_permission` (mirroring
`check_treasure_summary_all_permission`) — no new permission config file needed.

### Permissions (server-side, acquire/remove) — regular/restricted split needed

Found a real gap while reviewing this: `character_document_acquire`'s permission check
(`_check_document_create` in `_document_exchange.py`) currently checks the *same* `restricted.create`
tier for both the plain `/acquire.json` endpoint and the DM-only `/acquire/all.json` endpoint —
there is no `regular` tier at all today, and no `player` role listed anywhere for document
acquire (only `staff`/`owner` for PC, `staff` for NPC). That means a non-owning player currently
cannot acquire a document for someone else's PC, or for any NPC, even through the "regular"
endpoint — clashing with the Give Document button now being visible to any player/dm/staff/admin.

Fix: split the permission check into `regular`/`restricted` tiers, mirroring the
`regular`/`private` (`restricted`) naming convention already used elsewhere (e.g.
`documentConfig.js`'s GET variants). Applies to **both** acquire and remove.

`game_pc_document/endpoints.yml`:
```yaml
regular:
  create:
    - staff
    - player
restricted:
  create:
    - owner
```

`game_npc_document/endpoints.yml`:
```yaml
regular:
  create:
    - staff
    - player
restricted:
  create: []
```

`dm`/`admin` are never listed explicitly — both roles always bypass via `BasePermission`'s
built-in shortcut (`_shortcut_allows`: `is_admin() or is_dm()`) regardless of tier. So in effect:
`/acquire.json`/`/remove.json` (regular) → staff, any player of the game, or dm/admin.
`/acquire/all.json`/`/remove/all.json` (restricted) → PC: the PC's owning player, or dm/admin
only (staff excluded). NPC: dm/admin only (no explicit role at all).

Implementation: thread a tier selector (mirroring `allow_hidden`) through `_check_document_create`
(rename/split as needed) so the regular acquire/remove views check `regular.create` and the
`/all.json` views check `restricted.create`, instead of both hitting the same check today.

## Benefits

- Feature parity: documents can be handed out from the UI the same way items and treasures
  already can.
- Fixes a pre-existing inconsistency where "Give X" buttons were unconditionally visible to any
  logged-in user regardless of their relation to the game.
- Closes a permission gap that currently blocks regular players from acquiring/removing documents
  through the standard endpoint, aligning server-side permissions with the new client-side
  visibility rules.
