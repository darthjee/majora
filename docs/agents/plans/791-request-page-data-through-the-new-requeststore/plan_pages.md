# Per-page breakdown

Main plan: [plan.md](plan.md)

Route list is the union of the issue's original "Affected pages" list plus the edit-page routes
found in `HashRouteResolver.js`/`AppHelper.jsx` during discussion of issue #791.

## Show pages (`single` quantity type) — Step 2

| Route | Page component | Controller | `resourceConfig` entry | Notes |
|---|---|---|---|---|
| `/#/games/:game_slug` | `Game.jsx` | `GameController.js` | `game.single` | Simplest case, matches the issue's own example — done |
| `/#/games/:game_slug/treasures/:id` | `Treasure.jsx` | `TreasureController.js` | `treasure.single` (new) | Resolved: `GET /treasures/:id.json` is `AllowAny` with no separate restricted/full variant (edit rights resolved separately via `/treasures/:id/permissions.json`) — added mirroring `sessionConfig.js`'s shape — done |
| `/#/games/:game_slug/items/:id` | `GameItem.jsx` | `GameItemController.js` | `item.single` (`kind: 'game'`, new path family) | Resolved: `GameItem` is a distinct backing model from `CharacterItem` — `itemConfig.js`'s `single` entry now branches on `kind` (`'game'` → `/games/:slug/items/:id[/full].json`, game-level `can_edit` via `ensureGamePermissions`; `'pcs'\|'npcs'` → unchanged character-owned shape) — done |
| `/#/games/:game_slug/pcs/:id` | `PcCharacter.jsx` | `PcCharacterController.js` → `CharacterController.js` | `pc.single` | Collapses `fetchCharacterFull` chain, see plan.md Context — done |
| `/#/games/:game_slug/npcs/:id` | `NpcCharacter.jsx` | `NpcCharacterController.js` → `CharacterController.js` | `npc.single` | Same collapse; `npcConfig`'s private permission is character-level `can_edit`, resolved via `ensureCharacterPermissions` — done |
| `/#/games/:game_slug/pcs/:id/items/:id` | `PcCharacterItem.jsx` | `CharacterItemDetailController.js` | `item.single` (`kind: 'pcs'`) | Collapses its own hand-rolled `full.json`-on-`can_edit` branch — done |
| `/#/games/:game_slug/npcs/:character_id/items/:id` | `NpcCharacterItem.jsx` | `CharacterItemDetailController.js` | `item.single` (`kind: 'npcs'`) | Same as above — done |

## List pages (`collection` quantity type) — Step 3

| Route | Page component | `listTypeConfig` key | `resourceConfig` entry |
|---|---|---|---|
| `/#/`, `/#/games` | `Games.jsx` | `games` (`configs/gamesListType.js`) | `game.collection` — done |
| `/#/games/:game_slug/treasures` | `GameTreasures.jsx` | `treasures` | `treasure.collection` (`kind: 'game'`, new path family) — done |
| `/#/games/:game_slug/items` | `GameItems.jsx` | `items` | `item.collection` (`kind: 'game'`, new path family, mirroring `single`'s existing game/character split) — done |
| `/#/games/:game_slug/pcs` | `GamePcs.jsx` | `pcs` (`configs/characterListTypes.js`) | `pc.collection` — done |
| `/#/games/:game_slug/npcs` | `GameNpcs.jsx` | `npcs` (`configs/characterListTypes.js`) | `npc.collection` — done |
| `/#/games/:game_slug/pcs/:id/treasures` | `PcCharacterTreasures.jsx` (`listType="pc-treasures"`) | `pc-treasures` (`configs/characterTreasureListTypes.js`) | `treasure.collection` (`kind: 'pcs'`) — done |
| `/#/games/:game_slug/npcs/:id/treasures` | `NpcCharacterTreasures.jsx` (`listType="npc-treasures"`) | `npc-treasures` | `treasure.collection` (`kind: 'npcs'`) — done |
| `/#/games/:game_slug/pcs/:id/items` | `PcCharacterItems.jsx` | `pc-items` | `item.collection` (`kind: 'pcs'`) — done |
| `/#/games/:game_slug/npcs/:character_id/items` | `NpcCharacterItems.jsx` | `npc-items` | `item.collection` (`kind: 'npcs'`) — done |
| `/#/games/:game_slug/pcs/:id/documents` | `PcCharacterDocuments.jsx` (`listType="pc-documents"`) | `pc-documents` (`configs/documentListTypes.js`) | `documentConfig.js` (`kind: 'pcs'`) — done |
| `/#/games/:game_slug/npcs/:id/documents` | `NpcCharacterDocuments.jsx` (`listType="npc-documents"`) | `npc-documents` | `documentConfig.js` (`kind: 'npcs'`) — done |

Page/component names and list-type keys for `GameItems`/`PcCharacterItems`/`NpcCharacterItems`
were confirmed against `AppHelper.jsx`/`listTypeConfig.js` at implementation time, matching this
table. The game-scoped, non-per-character `documents` list type (distinct from the
`pc-documents`/`npc-documents` rows above) was confirmed out of scope (not in the issue's
affected-page list) and left on `fetchPermissionGatedIndex`.

## Edit pages — Step 4

| Route | Page component | Controller | Delegates to (free ride?) |
|---|---|---|---|
| `/games/:game_slug/edit` | `GameEdit.jsx` | `GameEditController.js` | No — direct `gameClient.fetchGame` + `fetchWithAccess`, migrate directly — done |
| `/treasures/:id/edit` | `TreasureEdit.jsx` | `TreasureEditController.js` | No — migrate directly — done |
| `/games/:game_slug/treasures/:treasure_id/edit` | `GameTreasureEdit.jsx` | `GameTreasureEditController.js` | No — migrate directly — done, using a new game-scoped path (`gameSlug` param) on `treasureConfig.js`'s existing `single` entry, since `GET /games/:game_slug/treasures/:id.json` is a distinct endpoint from the standalone `/treasures/:id.json` |
| `/games/:game_slug/items/:id/edit` | `GameItemEdit.jsx` | `GameItemEditController.js` | No — extends `BasePageController`, not `BaseEditController`; mirrors `GameItemController`'s pattern, migrate the same way as its show-page counterpart — done |
| `/games/:game_slug/sessions/:id/edit` | `GameSessionEdit.jsx` | `GameSessionEditController.js` | No — migrate directly once `sessionConfig.js` exists (Step 1) — done |
| `/games/:game_slug/pcs/:character_id/edit` | `PcCharacterEdit.jsx` | `PcCharacterEditController.js` → `BaseCharacterEditController` | Yes — reuses `PcCharacterController` for loading — confirmed free ride via Step 2, `CharacterEditController/buildEffectSpec.js` already `RequestStore`-backed, no code change needed — done |
| `/games/:game_slug/npcs/:character_id/edit` | `NpcCharacterEdit.jsx` | `NpcCharacterEditController.js` → `BaseCharacterEditController` | Yes — reuses `NpcCharacterController` — confirmed free ride, same as above — done |
| `/games/:game_slug/pcs/:character_id/items/:id/edit` | `PcCharacterItemEdit.jsx` | `PcCharacterItemEditController.js` → `BaseCharacterItemEditController` | No — checked: does *not* delegate to `CharacterItemDetailController`, hand-rolls its own unconditional `full.json` fetch instead — migrated directly onto `item.single`'s `kind: 'pcs'` shape — done |
| `/games/:game_slug/npcs/:character_id/items/:id/edit` | `NpcCharacterItemEdit.jsx` | `NpcCharacterItemEditController.js` → `BaseCharacterItemEditController` | No — same as above, `kind: 'npcs'` — done |

`/staff/users/:id/edit` (`StaffUserEdit.jsx`) is intentionally excluded — not part of the
games/home domain the issue scopes to.

## Page-embedded components — Step 5

| Component | Currently fetched by | Target | Outcome |
|---|---|---|---|
| `GamePreviewSections.jsx` (pc/npc previews on Game show page) | `GameController#fetchPcsPreview`/`#fetchNpcsPreview` | `pc.collection`/`npc.collection` with `query: {per_page: MAX_PREVIEW_ITEMS}` | Done — for npcs also collapses the old token-presence-then-fallback logic onto `npcConfig`'s existing private/`can_edit` variant |
| `TreasureExchangeModal.jsx` Acquire tab | `TreasureExchangeModalController#fetchAcquirePage` | `treasure.collection`, `kind: 'game'` | Done — its existing `character.canEdit` branch already matched `RequestStore`'s own resolution for `kind: 'game'` |
| `TreasureExchangeModal.jsx` Sell tab | `TreasureExchangeModalController#fetchSellPage` | `treasure.collection`, `kind: 'pcs'\|'npcs'` | Skipped — always fetches the plain endpoint today, unlike the `npc-treasures` list page's own use of this same config, which elevates for an editor; migrating would change behavior. See plan.md Notes |
| `AddGameTreasureModal.jsx` (on `GameTreasures` list page) | `AddGameTreasureModalController#fetchMissingPage` | n/a | Skipped — `/games/:game_slug/treasures/missing.json` has no `treasureConfig.js` variant at all. See plan.md Notes |
| `CharacterController`'s treasures/items preview merge | `fetchAndMergeTreasures`/`fetchAndMergeItems` | `treasureConfig.collection`/`itemConfig.collection` | Skipped (optional) — same always-regular-never-elevated mismatch as the Sell tab. See plan.md Notes |
| `CharacterController`'s documents preview merge | `fetchAndMergeDocuments` | `documentConfig.collection` (Step 1) | Skipped (optional) — same mismatch. See plan.md Notes |
| `CharacterController`'s photos preview merge | `fetchAndMergePhotos` | Out of scope — no resource config for photos | Left as-is |
