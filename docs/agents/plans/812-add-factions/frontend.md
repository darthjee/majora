# Frontend Plan: Add factions

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the endpoints/payload shapes/i18n key names from [plan.md](plan.md)'s "Shared
contracts" section as-is. Note the update (PATCH) endpoint is DM/staff-gated
(`permission: 'can_edit'`), while create and photo-upload are gated by the broader `regular`
(staff+player) tier server-side — mirror `permission: null` for those two client-side (same as
`sourceConfig.js` does for its staff-gated-server-side-only endpoints), since `RequestStore`'s
`permission` field only expresses simple `can_edit`-style checks, not the richer
staff-or-player-of-game check.

## Implementation Steps

### Step 1 — Request config

New `frontend/assets/js/utils/requests/config/factionConfig.js`. Faction has **no**
hidden/restricted concept at all (unlike `possessionConfig.js`), so this is closer to
`sourceConfig.js`'s shape: `regular`/`private` point at the exact same path object everywhere
(`resolveVariant.js` always reads `config.private.permission`, so `private` must still be
present even though it's never actually selected):

```js
const collection = { path: ({ gameSlug }) => `/games/${gameSlug}/factions.json`, permission: null };
const single = { path: ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}.json`, permission: null };
const update = { path: ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}.json`, permission: 'can_edit' };
const create = { path: ({ gameSlug }) => `/games/${gameSlug}/factions.json`, permission: null };
const photoUploadInit = { path: ({ gameSlug, id }) => `/games/${gameSlug}/factions/${id}/photo_upload.json`, permission: null };

export default {
  GET: {
    collection: { regular: collection, private: collection },
    single: { regular: single, private: single },
  },
  PATCH: {
    single: { regular: update, private: update },
  },
  POST: {
    collection: { regular: create, private: create },
    single: { regular: photoUploadInit, private: photoUploadInit },
  },
};
```

Register it in `frontend/assets/js/utils/requests/resourceConfig.js` (import + add
`faction: factionConfig` to `RESOURCES`).

### Step 2 — List-page card wiring

- New `frontend/assets/js/components/common/list_types/GameFactionListItem.js` — mirrors
  `GamePossessionListItem.js`/`GameItemListItem.js` but simpler: extends `BaseListItem`, **no**
  `hidden` getter (no hidden concept for Faction).
- New `frontend/assets/js/components/common/cards/CardFactionImage.jsx` — mirrors
  `CardPossessionImage.jsx`/`CardItemImage.jsx`, importing a new `default_faction.png`
  placeholder under `frontend/assets/images/placeholders/`. No source art was supplied with the
  issue — flag this rather than inventing artwork; fall back to a generic placeholder if
  blocked.
- Register `faction: CardFactionImage` in `ActionsOverlay.jsx`'s `PHOTO_COMPONENTS`, and extend
  its `type` prop JSDoc union.
- New `frontend/assets/js/components/resources/faction/pages/elements/FactionFilters.jsx` — a
  minimal filter bar with just a name text search + Query/Clear buttons, mirroring only the
  name-search portion of `NpcFilters.jsx` (drop its status/allegiance dropdowns — Faction has no
  analogous fields). Confirm during implementation whether `ListPage` supports a bare name
  search without a custom `filtersComponent` at all; if so, prefer that over a new component.
- In `frontend/assets/js/components/common/list_types/listTypeConfig.js`: add a
  `fetchGameFactions(gameSlug, hashResolver)` function mirroring `fetchGamePossessions`/
  `fetchGameItems` (`resource: 'faction'`, no `kind` branching), a
  `buildGameFactionHref(item, context)` mirroring `buildGameItemHref`
  (`#/games/${context.gameSlug}/factions/${item.data.id}`), and a `factions` entry:
  ```js
  factions: {
    fetchList: fetchGameFactions,
    wrapperClass: GameFactionListItem,
    filtersComponent: FactionFilters,
    photoType: 'faction',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: null,
    showCaption: true,
    buildItemHref: buildGameFactionHref,
    itemsPerRow: 6,
  },
  ```

### Step 3 — Routes

Add to `frontend/assets/js/utils/routing/HashRouteResolver.js`. **No** `/new` route — creation
is modal-based (see Step 4), matching `Source`'s pattern rather than `GamePossession`'s:

```js
['/games/:game_slug/factions/:id/edit', 'gameFactionEdit'],
['/games/:game_slug/factions/:id', 'gameFaction'],
['/games/:game_slug/factions', 'gameFactions'],
```

### Step 4 — Pages

New folder `frontend/assets/js/components/resources/faction/`, mirroring
`resources/source/`'s modal-creation structure for the list+create flow, and
`resources/possession/`'s structure for the show/edit pages (possession has an edit page, source
doesn't):

- `pages/GameFactions.jsx` + `controllers/GameFactionsController.js` +
  `helpers/GameFactionsHelper.jsx` — mirrors `GameItems.jsx`/`Sources.jsx` (renders
  `<ListPage type="factions" .../>`, holds `showNewModal` state, gates the "Create Faction"
  button, renders `<FactionNewModal show={showNewModal} onClose={...} .../>`)
- `pages/elements/FactionNewModal.jsx` + `pages/controllers/FactionNewController.js` +
  `pages/elements/helpers/FactionNewModalHelper.jsx` — mirrors `SourceNewModal.jsx`/
  `SourceNewController.js` exactly: a `name` field (no `url` field — Faction has none), a
  deferred `photoFile` staged via a nested `PhotoUploadModal`, `submitForm` POSTs the Faction via
  `RequestStore.mutate({resource:'faction', method:'POST', quantityType:'collection',
  body:{name}})`, then on success uploads the staged photo via `PhotoUploadSaga`/`UploadClient`
  (resolving the upload path via `RequestStore.resolvePath({resource:'faction', method:'POST',
  quantityType:'single', params:{id}})`), purges the `faction` cache on success, and supports
  `retryPhotoUpload`/skip on upload failure — same status-machine shape as
  `SourceNewController`. Unlike `Source`'s staff-only gate
  (`AccessStore.ensureStaffOrSuperUser()`), gate this on the game's regular create permission
  (however the project's simple `can_edit`-adjacent client-side check for `regular`-tier,
  staff-or-player actions is normally expressed — check how `GameItemNewController`/equivalent
  gates its own "Create Item" button for the actual pattern, since `regular` isn't a plain
  `can_edit` boolean).
- `pages/GameFaction.jsx` + `controllers/GameFactionController.js` +
  `helpers/FactionDetailHelper.jsx` — mirrors `Source.jsx`/`SourceController.js` (show page with
  inline photo-replace upload) and `GameItem.jsx` (game-scoped access checks)
- `pages/GameFactionEdit.jsx` + `controllers/GameFactionEditController.js` +
  `helpers/FactionEditHelper.jsx` — mirrors `GamePossessionEdit.jsx`/
  `GamePossessionEditController.js`/`PossessionEditHelper.jsx` (name + photo editable, DM/staff
  gated per the update-permission note in [plan.md](plan.md))
- `pages/elements/show/{FactionNameField,FactionNameHeading,FactionNewPhotoUploadFailedAlert,
  FactionPhoto,FactionSubmitButton,FactionTitle}.jsx` — mirror the equivalent `Item*.jsx`/
  `Possession*.jsx` files 1:1, dropping anything hidden-related

Register the three page components (`gameFaction`, `gameFactionEdit`, `gameFactions` — no
`gameFactionNew`, since creation is modal-based) in
`frontend/assets/js/components/helpers/AppHelper.jsx`, mirroring the `gameItem*`/`gamePossession*`
block shape.

### Step 5 — Nav entry

In `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`'s
`renderGameNavLinks`, add a `factions` link next to the existing `items`/`documents` ones:

```jsx
<NavDropdown.Item href={`#/games/${gameSlug}/factions`}>{Translator.t('game_page.factions')}</NavDropdown.Item>
```

## Files to Change

- `frontend/assets/js/utils/requests/config/factionConfig.js` — new
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `faction`
- `frontend/assets/js/components/common/list_types/GameFactionListItem.js` — new
- `frontend/assets/js/components/common/cards/CardFactionImage.jsx` — new
- `frontend/assets/images/placeholders/default_faction.png` — new (or flagged as blocked)
- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx` — register `faction` photo type
- `frontend/assets/js/components/resources/faction/pages/elements/FactionFilters.jsx` — new
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — add `factions` entry
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — add 3 routes
- `frontend/assets/js/components/resources/faction/**` — new (pages/controllers/helpers/elements, ~18 files, see Step 4)
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register the 3 page components
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — add nav link

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — new specs mirroring the `source/`
  spec suite (for the list+modal flow) and `possession/` spec suite (for show/edit) under
  `frontend/specs/`
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until translator's
  files land; coordinate ordering or land together

## Notes

- No `/new` route/page — creation only happens via the list-page modal, matching `Source`
  rather than `GamePossession`/`GameItem`.
- Confirm the client-side gating mechanism for the "Create Faction" button and the edit page
  (Step 4) — neither is a plain `can_edit` boolean; `regular` (staff+player) and DM/staff-only
  are two different, more specific checks that need the right existing helper/pattern, not a
  guessed one.
- No PC/NPC pages, no give/acquire modal, no `character_faction*` anything — the
  `Character.factions` M2M field exists in the backend but has no frontend UI in this issue.
