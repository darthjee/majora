# Frontend Plan: Add item list

Main plan: [plan.md](plan.md)

## Shared contracts

Consume the six endpoints and exact field names listed in [plan.md](plan.md)'s "Shared
contracts" section — `name`/`description`/`photo_path` on `CharacterItem` list items arrive
already fallback-resolved; no client-side fallback logic is needed. Reference the i18n keys
listed there as-is (see [translator.md](translator.md) for who adds them).

## Implementation Steps

### Step 1 — Preview sections on PC/NPC show pages

- `frontend/assets/js/components/common/characterPreviewConstants.js` — add an `items` entry
  to `PREVIEW_LIST_TYPES` alongside the existing treasures entry (`MAX_PREVIEW_ITEMS` is
  already shared/generic).
- New `ItemPreviewCard` component (mirroring `TreasureCardHelper`/`TreasurePreviewCard`) to
  render a `CharacterItem` preview entry.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` — wire
  a second `PreviewSection` beneath the treasure one (both PC and NPC show pages use this
  shared helper already), `emptyText={Translator.t('character_items_preview.empty')}`, "see
  more" icon `box2-heart-fill`.

### Step 2 — Reusable list-page wiring (new `items` list types)

Extend `frontend/assets/js/components/common/listTypes/listTypeConfig.js` — this currently
has only one entry (`treasures`, powering the per-game Treasures page). This issue is the
first consumer to extend the pattern to **character-scoped** lists (PC/NPC), which don't
exist there yet — treat this as new ground, not pure copy-paste:

- `items` entry: `fetchList` hits `/games/:slug/items.json` or `/all.json` (mirroring
  `fetchTreasures`'s canEdit-based path selection), `wrapperClass: GameItemListItem`,
  `photoType: 'game-item'` (or whatever new `ActionsOverlay` photo type is appropriate —
  check `PHOTO_COMPONENTS` in `ActionsOverlay.jsx`), no filters component (issue doesn't ask
  for filtering, unlike `TreasureFilters`).
- `pc-items` / `npc-items` entries (naming: follow whatever convention emerges once you check
  how `pcs`/`npcs` full-list entries — currently unwired placeholders per the comment in
  `listTypeConfig.js` — are expected to be keyed): `fetchList` hits
  `/games/:slug/pcs/:character_id/items.json` (or npc equivalent) / `/all.json`,
  `wrapperClass: CharacterItemListItem`.
- New wrapper classes `GameItemListItem`/`CharacterItemListItem` (mirroring
  `TreasureListItem.js`, extending `BaseListItem`) normalizing the raw API fields from the
  Shared Contracts section.
- `buildActionBarProps`/`buildInfoBarItems`/`buildItemHref` per entry, mirroring
  `TreasureListItem`'s equivalents — but simpler, since there's no upload/edit affordance in
  scope for this issue (read-only), so `buildActionBarProps` can likely return
  `{ canEdit: false, secondaryButtons: [] }` unconditionally for now.

### Step 3 — New pages

- `frontend/assets/js/components/resources/item/pages/GameItems.jsx` — Game Items page, built
  on `ListPage` with `type="items"`, mirroring `GameTreasures.jsx` minus the
  add/upload-modal state (out of scope).
- `frontend/assets/js/components/resources/character/pages/PcCharacterItems.jsx` /
  `NpcCharacterItems.jsx` — built on `ListPage` with `type="pc-items"`/`"npc-items"`.
- Register all three in `frontend/assets/js/components/helpers/AppHelper.jsx` (mirrors the
  `treasures: <Treasures />` entry).

### Step 4 — Routes

`frontend/assets/js/utils/routing/HashRouteResolver.js` — register:
- `/games/:game_slug/items` → `gameItems`
- `/games/:game_slug/pcs/:character_id/items` → `pcCharacterItems`
- `/games/:game_slug/npcs/:character_id/items` → `npcCharacterItems`

### Step 5 — Nav entries

`frontend/assets/js/components/common/helpers/HeaderHelper.jsx` — add a per-character nav
entry (mirroring the `character_page.treasures_title` dropdown item) linking to the new
character items page. No global/header-level nav entry is needed (no cross-game item
registry, unlike `header.nav_treasures`); check whether the game show page itself links out
to `game_treasures_page` anywhere and mirror that for items if so.

### Step 6 — Tests

Add Jasmine specs mirroring the existing treasure specs for every new component/controller/
helper (list item wrapper, list type config entries, page components, preview card).

## Files to Change

- `frontend/assets/js/components/common/characterPreviewConstants.js`
- `frontend/assets/js/components/common/helpers/CharacterHelper.jsx` (or wherever
  `CharacterHelper.jsx` actually lives — confirm exact path)
- `frontend/assets/js/components/resources/item/` (new: `pages/GameItems.jsx`,
  `pages/helpers/`, preview card component)
- `frontend/assets/js/components/resources/character/pages/PcCharacterItems.jsx`,
  `NpcCharacterItems.jsx` (new)
- `frontend/assets/js/components/common/listTypes/listTypeConfig.js`
- `frontend/assets/js/components/common/listTypes/GameItemListItem.js`,
  `CharacterItemListItem.js` (new)
- `frontend/assets/js/components/helpers/AppHelper.jsx`
- `frontend/assets/js/utils/routing/HashRouteResolver.js`
- `frontend/assets/js/components/common/helpers/HeaderHelper.jsx`
- Mirrored spec files under `frontend/specs/`

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- This is the first feature to extend the new `ListPage`/`listTypeConfig` pattern (from #665)
  to character-scoped lists — coordinate with whatever the eventual PC/NPC-treasure-list
  migration issue does, since both will be establishing the `pc-*`/`npc-*` key convention for
  the first time. If that migration lands first, follow its convention instead of inventing a
  new one.
- Confirm `box2-heart-fill` exists in `frontend/assets/js/utils/ui/Icons.js` (or add it) before
  wiring the preview "see more" link.
