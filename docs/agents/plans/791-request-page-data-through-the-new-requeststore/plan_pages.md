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
| `/#/`, `/#/games` | `Games.jsx` | `games` (`configs/gamesListType.js`) | `game.collection` |
| `/#/games/:game_slug/treasures` | `GameTreasures.jsx` | `treasures` | `treasure.collection` |
| `/#/games/:game_slug/items` | `GameItems.jsx` | `items` | needs a game-scoped item collection — confirm `itemConfig.js`'s `collection` entry covers game-owned (not just character-owned) items, or whether a separate config/entry is needed |
| `/#/games/:game_slug/pcs` | `GamePcs.jsx` | `pcs` (`configs/characterListTypes.js`) | `pc.collection` |
| `/#/games/:game_slug/npcs` | `GameNpcs.jsx` | `npcs` (`configs/characterListTypes.js`) | `npc.collection` |
| `/#/games/:game_slug/pcs/:id/treasures` | `PcCharacterTreasures.jsx` (`listType="pc-treasures"`) | `pc-treasures` (`configs/characterTreasureListTypes.js`) | `treasure.collection` (`kind: 'pcs'`) |
| `/#/games/:game_slug/npcs/:id/treasures` | `NpcCharacterTreasures.jsx` (`listType="npc-treasures"`) | `npc-treasures` | `treasure.collection` (`kind: 'npcs'`) |
| `/#/games/:game_slug/pcs/:id/items` | `PcCharacterItems.jsx` | `pc-items` | `item.collection` (`kind: 'pcs'`) |
| `/#/games/:game_slug/npcs/:character_id/items` | `NpcCharacterItems.jsx` | `npc-items` | `item.collection` (`kind: 'npcs'`) |
| `/#/games/:game_slug/pcs/:id/documents` | `PcCharacterDocuments.jsx` (`listType="pc-documents"`) | `pc-documents` (`configs/documentListTypes.js`) | new `documentConfig.js` (`kind: 'pcs'`) |
| `/#/games/:game_slug/npcs/:id/documents` | `NpcCharacterDocuments.jsx` (`listType="npc-documents"`) | `npc-documents` | new `documentConfig.js` (`kind: 'npcs'`) |

Confirm exact page/component names for `GameItems`/`PcCharacterItems`/`NpcCharacterItems` and
their list-type keys against `AppHelper.jsx`/`listTypeConfig.js` at implementation time — not all
were directly re-verified during planning beyond `pc-items`/`npc-items`/`items`.

## Edit pages — Step 4

| Route | Page component | Controller | Delegates to (free ride?) |
|---|---|---|---|
| `/games/:game_slug/edit` | `GameEdit.jsx` | `GameEditController.js` | No — direct `gameClient.fetchGame` + `fetchWithAccess`, migrate directly |
| `/treasures/:id/edit` | `TreasureEdit.jsx` | `TreasureEditController.js` | No — migrate directly |
| `/games/:game_slug/treasures/:treasure_id/edit` | `GameTreasureEdit.jsx` | `GameTreasureEditController.js` | No — migrate directly |
| `/games/:game_slug/items/:id/edit` | `GameItemEdit.jsx` | `GameItemEditController.js` | No — extends `BasePageController`, not `BaseEditController`; mirrors `GameItemController`'s pattern, migrate the same way as its show-page counterpart |
| `/games/:game_slug/sessions/:id/edit` | `GameSessionEdit.jsx` | `GameSessionEditController.js` | No — migrate directly once `sessionConfig.js` exists (Step 1) |
| `/games/:game_slug/pcs/:character_id/edit` | `PcCharacterEdit.jsx` | `PcCharacterEditController.js` → `BaseCharacterEditController` | Yes — reuses `PcCharacterController` for loading, verify free ride |
| `/games/:game_slug/npcs/:character_id/edit` | `NpcCharacterEdit.jsx` | `NpcCharacterEditController.js` → `BaseCharacterEditController` | Yes — reuses `NpcCharacterController`, verify free ride |
| `/games/:game_slug/pcs/:character_id/items/:id/edit` | `PcCharacterItemEdit.jsx` | `PcCharacterItemEditController.js` → `BaseCharacterItemEditController` | Check whether this delegates to `CharacterItemDetailController`; migrate directly if not |
| `/games/:game_slug/npcs/:character_id/items/:id/edit` | `NpcCharacterItemEdit.jsx` | `NpcCharacterItemEditController.js` → `BaseCharacterItemEditController` | Same check as above |

`/staff/users/:id/edit` (`StaffUserEdit.jsx`) is intentionally excluded — not part of the
games/home domain the issue scopes to.

## Page-embedded components — Step 5

| Component | Currently fetched by | Target |
|---|---|---|
| `GamePreviewSections.jsx` (pc/npc previews on Game show page) | `GameController#fetchPcsPreview`/`#fetchNpcsPreview` | `pc.collection`/`npc.collection` with `query: {per_page: MAX_PREVIEW_ITEMS}` |
| `TreasureExchangeModal.jsx` (browse/sell lists on PC/NPC show pages) | `TreasureExchangeModalController.js` | Evaluate against `treasureConfig.js`; may not fit — see plan.md Notes |
| `AddGameTreasureModal.jsx` (on `GameTreasures` list page) | `AddGameTreasureModalController.js` | Evaluate against `treasureConfig.js`; may not fit — see plan.md Notes |
| `CharacterController`'s treasures/items preview merge | `fetchAndMergeTreasures`/`fetchAndMergeItems` | Optional — `treasureConfig.collection`/`itemConfig.collection` |
| `CharacterController`'s documents preview merge | `fetchAndMergeDocuments` | Optional — new `documentConfig.collection` (Step 1) |
| `CharacterController`'s photos preview merge | `fetchAndMergePhotos` | Out of scope — no resource config for photos |
