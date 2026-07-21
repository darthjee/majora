# Frontend Plan: CharacterItem creation should create an empty CharacterItem in favor of GameItem

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes the `backend`-renamed route: single-entity item detail with hidden fields moves from `.../items/:id/all.json` to `.../items/:id/full.json`. No response shape change — only the path string used when `canEdit` is true.
- Should land together with the `backend` route rename (same PR) so the app never briefly requests a path the backend no longer serves.

## Implementation Steps

### Step 1 — Update `GameItemController`

`frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js:95`:

```js
const path = canEdit ? `${base}/all.json` : `${base}.json`;
```

Change `${base}/all.json` to `${base}/full.json`. Also update the class docstring (lines 5-14), which describes "the full, hidden-inclusive `items/:id/all.json`" — reword to `items/:id/full.json`.

### Step 2 — Update `CharacterItemDetailController`

`frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js:94`, same change: `${base}/all.json` → `${base}/full.json`. Update the class docstring (lines 4-13), which also describes "`items/:id/all.json`" — reword to `items/:id/full.json`.

### Step 3 — Update Jasmine specs

- `frontend/specs/assets/js/components/resources/item/pages/controllers/GameItemControllerSpec.js:60` — `expect(client.fetch).toHaveBeenCalledWith('/games/demo/items/5/all.json');` → `.../5/full.json`.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterItemDetailControllerSpec.js:76` — `expect(client.fetch).toHaveBeenCalledWith(\`${base}/all.json\`);` → `` `${base}/full.json` ``.

### Step 4 — Confirm no other frontend references

`frontend/assets/js/client/config/skipCacheSuffixes.js` already lists both `/all.json` and `/full.json` as no-cache suffixes — no change needed there. `CharacterItemListItem.js`/`GameItemListItem.js` reference `/all.json` in comments, but that's the unrelated *collection* endpoint (`items/all.json`, no `:id`), which is unaffected by this rename — leave as-is.

## Files to Change

- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js` — path + docstring.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js` — path + docstring.
- `frontend/specs/assets/js/components/resources/item/pages/controllers/GameItemControllerSpec.js` — updated expectation.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterItemDetailControllerSpec.js` — updated expectation.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — runs the Jasmine specs including the two updated controller specs.
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — ESLint, to catch any docstring/formatting issues from the edits.

## Notes

- No component/template changes needed — this is purely the two hardcoded path strings plus their doc comments and specs.
