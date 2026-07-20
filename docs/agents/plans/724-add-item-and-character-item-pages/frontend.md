# Frontend Plan: Add Item and Character Item pages

Main plan: [plan.md](plan.md)

## Shared contracts

- Must register hash routes `#/games/:game_slug/items/:id` (`gameItem`),
  `#/games/:game_slug/pcs/:character_id/items/:id` (`pcCharacterItem`), and
  `#/games/:game_slug/npcs/:character_id/items/:id` (`npcCharacterItem`).
- Must call the six backend endpoints from [plan.md](plan.md)'s "Shared contracts" table exactly
  as specified (path, permission-gated `.json`/`all.json` selection).
- Every new user-visible string must go through `Translator.t('<key>')` — no hardcoded English —
  per [translator.md](translator.md); coordinate exact key names with that file.

## Implementation Steps

### Step 1 — Register the three new routes

In `frontend/assets/js/utils/routing/HashRouteResolver.js`'s `ROUTES` table, add each new route
directly before its corresponding list route (matching the existing `treasures/:id` before
`treasures`, and `.../items/new` before `.../items` ordering convention):

```js
['/games/:game_slug/npcs/:character_id/items/:id', 'npcCharacterItem'],   // before npcCharacterItems
['/games/:game_slug/pcs/:character_id/items/:id', 'pcCharacterItem'],     // before pcCharacterItems
['/games/:game_slug/items/:id', 'gameItem'],                              // before gameItems
```

### Step 2 — Shared item-detail render helper

Add `frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx`, modeled
on `PlayerHelper.jsx` (issue #695) but simpler — no second column/pagination:

- `render(item, backHref)` — `PageActions` (back button) then a two-column row: left `col-md-4`
  with a photo (reuse `CardAvatar` or `ActionsOverlay`'s photo rendering, `photoType: 'item'` per
  `listTypeConfig`) and the item's `name` as an `<h1>`; right `col-md-8` with the `description`.
  Show the existing Hidden badge (`ItemCardHelper.buildInfoBarItems`, same as the list cards) on
  the photo when `item.hidden` is present and `true` (only ever present on the `/all.json`
  response shape).
- `renderLoading()` / `renderError(error)` — same shape as `PlayerHelper`.

### Step 3 — `GameItem` detail page

- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js` — mirrors
  `PlayerController.js`'s shape: `getParamsFromHash` (`/games/:game_slug/items/:id`), constructor
  taking `(setItem, setLoading, setError, client = new GenericClient())`, `buildEffect()` that
  resolves `AccessStore.ensureGamePermissions(gameSlug)` first (same permission source
  `fetchGameItems` in `listTypeConfig.js` uses), picks `/games/${gameSlug}/items/${id}.json` vs
  `/all.json` based on the resolved `can_edit` (fail-closed on rejection, matching
  `fetchPermissionGatedIndex`'s `.catch(() => false)`), then `client.fetch(path)` (the same
  single-object GET `GameController.js` uses for `/games/${gameSlug}.json`).
- `frontend/assets/js/components/resources/item/pages/GameItem.jsx` — thin page component:
  loading/error states via `ItemDetailHelper`, `backHref = #/games/${gameSlug}/items`, otherwise
  `ItemDetailHelper.render(item, backHref)`.

### Step 4 — `CharacterItem` detail page (shared PC/NPC component)

Follow the same "parameterized by `characterKind`" sharing precedent as
`CharacterItemNew.jsx`/`CharacterItems.jsx` (issue #714):

- `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js` —
  constructor `(characterKind, setItem, setLoading, setError, client = new GenericClient())`.
  `getParamsFromHash` extracts `game_slug`, `character_id`, `id` from
  `/games/:game_slug/${characterKind}/:character_id/items/:id`. `buildEffect()` resolves
  `AccessStore.ensureCharacterPermissions(characterKind, gameSlug, characterId)` (same source
  `buildFetchCharacterItems` uses), picks
  `/games/${gameSlug}/${characterKind}/${characterId}/items/${id}.json` vs `/all.json`, then
  `client.fetch(path)`.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterItem.jsx` — shared
  component taking `{ characterKind }`, same loading/error/effect plumbing as `PlayerDetail.jsx`,
  `backHref = #/games/${gameSlug}/${characterKind}/${characterId}/items`, renders via
  `ItemDetailHelper.render` (reused from Step 2 — no separate character-specific helper needed,
  since the layout is identical for game/PC/NPC items).
- `frontend/assets/js/components/resources/character/pages/PcCharacterItem.jsx`:
  `<CharacterItem characterKind="pcs" />`.
- `frontend/assets/js/components/resources/character/pages/NpcCharacterItem.jsx`:
  `<CharacterItem characterKind="npcs" />`.

### Step 5 — Register the three pages in `AppHelper.jsx`

Import `GameItem`, `PcCharacterItem`, `NpcCharacterItem` and add to the page-key map:
`gameItem: <GameItem />`, `pcCharacterItem: <PcCharacterItem />`,
`npcCharacterItem: <NpcCharacterItem />` — next to the existing `gameItems`/`pcCharacterItems`/
`npcCharacterItems` entries.

### Step 6 — Wire up existing non-clickable item cards

In `frontend/assets/js/components/common/list_types/listTypeConfig.js`:

- Replace `items`'s `buildItemHref: buildNullItemHref` with a new
  `buildGameItemHref(item, context) => \`#/games/${context.gameSlug}/items/${item.data.id}\`` —
  same shape as `buildPlayerItemHref` in `configs/playersListType.js`.
- For `pc-items`/`npc-items`, add a `buildCharacterItemItemHref(characterKind)` factory (name
  distinct from `characterListTypes.js`'s existing `buildCharacterItemHref`, which links to a
  *character's* page, not an *item's*) returning
  `(item, context) => \`#/games/${context.gameSlug}/${characterKind}/${context.characterId}/items/${item.data.id}\``.
  This needs `context.characterId`, which `ListPage`'s default context does **not** carry (only
  `gameSlug`/`canEdit` are merged in automatically) — so `CharacterItemsHelper.jsx`
  (`frontend/assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx`)
  must pass `context={{ characterId }}` into its `<ListPage>` call, alongside the existing
  `type`/`gameSlug`/`basePath`/`loadingMessage` props, so it flows through to `buildItemHref`.
- Remove the now-stale `buildNullItemHref`/its docstring reference to issue #658 once nothing
  references it (grep first — `items`/`pc-items`/`npc-items` are its only current callers).

### Step 7 — Tests

Add Jasmine specs mirroring the implementation files under `frontend/specs/` (same relative
paths as `frontend/assets/js/`): `GameItemController`, `CharacterItemDetailController`,
`ItemDetailHelper`, `GameItem`/`PcCharacterItem`/`NpcCharacterItem` page components, the
`HashRouteResolver` route table additions, and the `listTypeConfig`/`CharacterItemsHelper`
href-wiring changes (including the new `context={{ characterId }}` prop reaching `ListPage`).

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — three new routes.
- `frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx` — new.
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js` — new.
- `frontend/assets/js/components/resources/item/pages/GameItem.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js` — new.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterItem.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/PcCharacterItem.jsx`,
  `NpcCharacterItem.jsx` — new.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register the three new page keys.
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — replace `buildNullItemHref`
  with real href builders for `items`/`pc-items`/`npc-items`.
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx` —
  pass `characterId` through `ListPage`'s `context` prop.
- `frontend/specs/...` — new specs mirroring the files above.

## CI Checks

- `frontend`: `docker-compose run --rm frontend npm test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm frontend npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm frontend npm run check_i18n` (CI job: `frontend-checks`) —
  relevant once the translator's keys land.

## Notes

- `ItemDetailHelper` is intentionally shared by all three pages (game/PC/NPC) — the layout and
  fields (`name`, `description`, `photo_path`, optional `hidden`) are identical across all three
  response shapes, so there is no need for kind-specific rendering logic, only kind-specific
  data-fetching (handled by the two separate controllers).
- `GenericClient.fetch(path)` (not `fetchIndex`, which is pagination-specific) is the existing
  single-object GET method — already used by `GameController.js` for `/games/${gameSlug}.json` —
  and reads the auth token internally via `buildHeaders`, so no explicit token plumbing is needed
  (unlike `PlayerClient`, which predates this and threads `AuthStorage.getToken()` explicitly).
