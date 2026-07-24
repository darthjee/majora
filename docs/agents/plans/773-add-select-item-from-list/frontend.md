# Frontend Plan: Add select item from list

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md) for the full endpoint table. Key points for this agent:

- `GET items/available.json` / `available/all.json` — same response shape as the existing
  `items.json`/`items/all.json` (`GameItemListSerializer`/`GameItemAllListSerializer`:
  `{id, name, photo_path[, hidden]}`), just pre-filtered server-side to exclude already-owned
  `GameItem`s. **Gated at the game level** (dm/admin only, no owner) — different from
  `items.json`'s character-level gate.
- `POST items/acquire.json` / `acquire/all.json` — body `{game_item_id, hidden?}`; `201` with
  `{id, game_item_id, name, photo_path, description, hidden}`; `400 {errors: {game_item_id:
  [...]}}` if already owned.
- `POST items/remove.json` / `remove/all.json` — body `{game_item_id}`; `204` on success.
- No quantity anywhere in this flow — items are binary owned/not-owned.
- Two independent `canEdit`-like flags gate the `/all` routing, **do not conflate them**:
  - **Acquire** → game-level `can_edit` (`character.gameCanEdit`, mirrors
    `CharacterTreasures.jsx`'s existing `buildExchangeCharacter`'s `canEdit`).
  - **Remove** → character-level `can_edit` (`character.can_edit`, already computed by
    `CharacterContextController` alongside `game_can_edit` — just also thread it through to
    the modal, which today only reads `game_can_edit` via the `character.canEdit` prop key).
- Translator produces `item_exchange_modal.*` i18n keys (see [translator.md](translator.md));
  reference them from the new tab config/components in the same PR.

## Implementation Steps

### Step 1 — Generalize the exchange modal shell

Rename `frontend/assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx`
to `ResourceExchangeModal.jsx` (same directory), and its helper
`helpers/TreasureExchangeModalHelper.jsx` to `helpers/ResourceExchangeModalHelper.jsx`. Change
the component to accept `tabs` and `defaultTab` as props instead of hardcoding
`treasureExchangeTabs`/`'buy'`:

```jsx
export default function ResourceExchangeModal({
  show, character, tabs, defaultTab, ownedTreasures = [], gameType = 'dnd', onClose, onSuccess,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return ResourceExchangeModalHelper.render(
    show, { activeTab, tabs, character, ownedTreasures, gameType, onSuccess }, { onClose, onTabChange: setActiveTab },
  );
}
```

Update `CharacterTreasures.jsx`'s single usage to pass `tabs={treasureExchangeTabs}
defaultTab="buy"` explicitly (behavior unchanged). Update the corresponding spec file(s) and
any other references (e.g. Storybook-style fixtures, if any exist — grep for
`TreasureExchangeModal` repo-wide to be sure nothing is missed).

Leave `ownedTreasures` as an optional, treasure-specific prop (it defaults to `[]` and the
new Item tabs simply never pass it — no need to generalize its name, since only the Buy tab
consumes it and items have no equivalent "already owned quantity" cross-reference to show,
already excluded server-side instead).

### Step 2 — Generalize `CharacterContextController`

`frontend/assets/js/components/resources/character/pages/controllers/CharacterContextController.js`
hardcodes `/games/:game_slug/${characterKind}/:character_id/treasures` in `#getParams()`. Add a
constructor param (e.g. `pagePath = 'treasures'`) so `CharacterItems.jsx` can reuse this exact
controller unchanged otherwise — it already resolves and merges both `can_edit`
(character-level) and `game_can_edit` (game-level) onto the character object, which is exactly
what both new tabs need. Update `CharacterTreasures.jsx`'s instantiation to keep passing
`'treasures'` explicitly (or rely on the default) so its behavior is unchanged.

### Step 3 — `itemConfig.js`: new `availableCollection`

In `frontend/assets/js/utils/requests/config/itemConfig.js`, add path builders and a new
top-level `GET.availableCollection` entry, mirroring `collection`'s shape:

```js
const availablePath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/available.json`;
const availableAllPath = ({ gameSlug, kind, id }) => `/games/${gameSlug}/${kind}/${id}/items/available/all.json`;

// added into the exported GET object, alongside collection/single:
availableCollection: {
  regular: { path: availablePath, permission: null },
  private: { path: availableAllPath, permission: 'can_edit' },
},
```

Update the file's top doc comment to describe this third shape and its game-level gating (see
Step 4).

### Step 4 — `RequestPermissionResolvers.js`: resolve `availableCollection` at game level

In `frontend/assets/js/utils/requests/RequestPermissionResolvers.js`, add an
`availableCollection` resolver under the existing `item` entry, **unconditionally** using
`AccessStore.ensureGamePermissions` (unlike `item.collection`/`item.single`, which branch on
`kind`) — this is the mechanism that makes `available/all.json`'s elevation game-level-gated
even though the endpoint itself is character-URL-scoped:

```js
item: {
  collection: ({ gameSlug, kind, id }) => (kind === 'game'
    ? AccessStore.ensureGamePermissions(gameSlug)
    : AccessStore.ensureCharacterPermissions(kind, gameSlug, id)),
  single: (...) => (...),
  availableCollection: ({ gameSlug }) => AccessStore.ensureGamePermissions(gameSlug),
},
```

Update this file's class-level doc comment to mention the new shape and why it diverges from
`item.collection`'s per-kind branching (see [plan.md](plan.md)'s "two distinct permission
scopes" note — copy that reasoning here so a future reader doesn't "fix" this into matching
`collection`'s branching).

Note the Remove tab does **not** need a new resolver entry — it reuses `item.collection`
(`kind: 'pcs'|'npcs'`) exactly as-is; that already resolves via
`ensureCharacterPermissions`/character-level `can_edit`, which — per this file's own existing
doc comment — already matches `remove/all.json`'s intended PC-owner-inclusive /
NPC-owner-exclusive split.

### Step 5 — `CharacterClient.js`: new item exchange methods

Add four methods mirroring `acquireTreasure`/`acquireTreasureAll`/`removeTreasure`'s shape
(`frontend/assets/js/client/CharacterClient.js`):

```js
acquireItem(characterKind, gameSlug, characterId, token, fields) {
  return this.postJson(`/games/${gameSlug}/${characterKind}/${characterId}/items/acquire.json`, token, fields);
}
acquireItemAll(characterKind, gameSlug, characterId, token, fields) {
  return this.postJson(`/games/${gameSlug}/${characterKind}/${characterId}/items/acquire/all.json`, token, fields);
}
removeItem(characterKind, gameSlug, characterId, token, fields) {
  return this.postJson(`/games/${gameSlug}/${characterKind}/${characterId}/items/remove.json`, token, fields);
}
removeItemAll(characterKind, gameSlug, characterId, token, fields) {
  return this.postJson(`/games/${gameSlug}/${characterKind}/${characterId}/items/remove/all.json`, token, fields);
}
```

### Step 6 — New tab config: `itemExchangeTabs.js`

New file `frontend/assets/js/components/resources/character/pages/elements/itemExchangeTabs.js`,
mirroring `treasureExchangeTabs.js` but with only two entries (`acquire`, `remove`), referencing
the new components from Step 7 and the translator's `item_exchange_modal.*` keys.

### Step 7 — New tabs: `AcquireItemTab`/`RemoveItemTab` + controllers + helpers

New directory `frontend/assets/js/components/resources/character/pages/elements/tabs/` gets
`AcquireItemTab.jsx`, `RemoveItemTab.jsx`, `controllers/AcquireItemTabController.js`,
`controllers/RemoveItemTabController.js`, `helpers/AcquireItemTabHelper.jsx`,
`helpers/RemoveItemTabHelper.jsx` — modeled directly on the Treasure tab quartet, with these
differences:

- **No quantity state/UI anywhere** — drop `quantity`/`setQuantity`/`onQuantityChange` and the
  numeric input entirely.
- **No `ordering` query param** — treasure's `ordering: 'desc'` sorts by value, which items
  don't have; the item controllers' `buildBrowseParams`-equivalent only sends
  `page`/`per_page`/`search`.
- **`AcquireItemTabController.fetchPage`** goes through `RequestStore` with `resource: 'item'`,
  `quantityType: 'availableCollection'`, `params: { gameSlug, kind, id: characterId }` (Step 3).
  No `ownedByGameItemId` cross-reference is needed (unlike Acquire-treasure's
  `ownedByTreasureId`) — already-owned items never appear in the list at all.
- **`AcquireItemTab`** adds a "hidden" switch to its selection/confirm UI, initialized from the
  selected browse entry's own `hidden` field (only present when browsing via `available/all.json`
  as a dm/admin — the regular `available.json` never returns hidden entries at all, so the
  switch simply defaults to `false`/unchecked for a public user, matching "no access to hidden
  items" rather than needing special-casing). Confirm posts `{game_item_id: selected.id, hidden}`.
- **`AcquireItemTabController.acquire`** routes to `acquireItem`/`acquireItemAll` based on
  `character.gameCanEdit` (game-level — thread a `gameCanEdit` key through the character context
  the modal receives, distinct from the existing `canEdit`/character-level key described next).
- **`RemoveItemTabController.fetchPage`** goes through `RequestStore` with `resource: 'item'`,
  `quantityType: 'collection'` (reuse, not `ownedCollection` — see Step 4's note), `params: {
  gameSlug, kind, id: characterId }` — this is the existing `items.json`/`items/all.json` pair,
  auto-elevating for a dm/admin(/owner for PCs) exactly like the page's own list already does.
- **`RemoveItemTabController.remove`** posts `{game_item_id: selected.game_item_id}` (the field
  already present on `CharacterItemSerializer` list entries) to `removeItem`/`removeItemAll`,
  routed by `character.canEdit` (character-level — the existing key, unchanged meaning).
- Both controllers' `#parseActionResponse` simplify: acquire resolves `{ok: true, ...data}` on
  `201`/`ok:false` on `400` (surface `errors.game_item_id` → an "already owned" translated
  error key); remove resolves `{ok: true}` on `204` with no body to parse.
- `onSuccess` payloads drop `quantity`/`money`/`acquired` — item exchange doesn't touch money.
  Simplify `CharacterItems.jsx`'s success handler accordingly (Step 8) — there's no equivalent
  of `mergeOwnedTreasures` to write, since the Remove/Acquire tabs' own `reload()` (already
  present in the treasure pattern) is sufficient to refresh their own browse lists, and the
  page's `ListPage` grid refresh (`refresh()`) covers the visible item list.

### Step 8 — Wire the modal into `CharacterItems.jsx`

Restructure `frontend/assets/js/components/resources/character/pages/shared/CharacterItems.jsx`
to match `CharacterTreasures.jsx`'s shape: add `CharacterContextController` (Step 2, with
`pagePath: 'items'`) to load `character` (for `gameCanEdit`/`canEdit`), plus
`showExchangeModal` state and a `refreshToken`-driven `refresh()` exactly like
`CharacterTreasures.jsx` does. Keep the existing `CharacterItemsAccessController` /
`canCreateItem` wiring untouched (still gates the old "Create Item" button). Add a new
"Exchange Items" button, gated on the **same** `canCreateItem` flag (see
[plan.md](plan.md)'s "Frontend permission wiring" — no new permission field needed), that opens
`ResourceExchangeModal` with `tabs={itemExchangeTabs}` `defaultTab="acquire"`.

`CharacterItemsHelper.jsx` gets a second button next to `#renderNewButton` (e.g.
`#renderExchangeButton`), both inside the same `PageActions`.

### Step 9 — Specs

Add/extend Jasmine specs for every new/changed file: the renamed modal + helper, the
generalized `CharacterContextController` (new `pagePath` param, default preserved), the new
`itemConfig.js`/`RequestPermissionResolvers.js` entries, the four new `CharacterClient` methods,
`itemExchangeTabs.js`, the four new tab/controller/helper files, and `CharacterItems.jsx`/
`CharacterItemsHelper.jsx`'s new modal wiring + button.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx`
  → renamed `ResourceExchangeModal.jsx`
- `frontend/assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx`
  → renamed `ResourceExchangeModalHelper.jsx`
- `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx` —
  update to pass `tabs`/`defaultTab` explicitly
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterContextController.js`
  — generalize `pagePath`
- `frontend/assets/js/utils/requests/config/itemConfig.js` — new `availableCollection`
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — new resolver entry
- `frontend/assets/js/client/CharacterClient.js` — four new methods
- `frontend/assets/js/components/resources/character/pages/elements/itemExchangeTabs.js` (new)
- `frontend/.../elements/tabs/AcquireItemTab.jsx` (new)
- `frontend/.../elements/tabs/RemoveItemTab.jsx` (new)
- `frontend/.../elements/tabs/controllers/AcquireItemTabController.js` (new)
- `frontend/.../elements/tabs/controllers/RemoveItemTabController.js` (new)
- `frontend/.../elements/tabs/helpers/AcquireItemTabHelper.jsx` (new)
- `frontend/.../elements/tabs/helpers/RemoveItemTabHelper.jsx` (new)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterItems.jsx`
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx`
- corresponding spec files for everything above, plus renames for the modal's existing specs

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — passes once translator's new
  keys land in the same PR

## Notes

- `ResourceExchangeModal` is a suggested name — pick whatever reads best, but it must not stay
  `Treasure`-prefixed once it's genuinely shared; update this plan's file references if a
  different name is chosen.
- Do not give the Acquire tab's hidden switch a tri-state/indeterminate look — it's a plain
  boolean, just pre-filled from the selected item's own `hidden` (or `false` when browsing the
  public catalog, which never exposes a hidden entry to pre-fill from anyway).
- `RemoveItemTab`'s reuse of `item.collection` (not a new `ownedCollection`) is a deliberate
  simplification versus the treasure precedent (`ownedCollection` was added by #811
  specifically to *avoid* elevation) — items want elevation for Remove, so no such split is
  needed. Do not "fix" this into adding an unnecessary `ownedCollection` for items.
