# Frontend Plan: Add GameItem and CharacterItem edit/update page

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes `PATCH /games/:game_slug/items/:id.json`, `PATCH /games/:game_slug/pcs/:character_id/items/:id.json`, `PATCH /games/:game_slug/npcs/:character_id/items/:id.json` — partial body `{name?, description?, hidden?}`, no `photo` field. Data for the edit form is loaded from the existing `.../full.json` detail-all route (same one the show page already uses).
- Submitting a cleared `name`/`description` field as `''` is fine — the backend converts blank to `null` for `CharacterItem`. No special frontend-side null-coercion needed.
- Shared opacity constant: `frontend/assets/css/main.scss`'s dimmed-photo rule changes from `opacity: 0.8` to `opacity: 0.6` — affects existing Character usages (NPC edit, NPC creation, NPC list-card) too, not just the new item pages, since they all share the same CSS class.

## Implementation Steps

### Step 1 — Register the three new routes

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — add to the `ROUTES` array (before their non-edit siblings, same ordering convention as the existing character-edit entries):
  - `['/games/:game_slug/items/:id/edit', 'gameItemEdit']`
  - `['/games/:game_slug/pcs/:character_id/items/:id/edit', 'pcCharacterItemEdit']`
  - `['/games/:game_slug/npcs/:character_id/items/:id/edit', 'npcCharacterItemEdit']`
- `frontend/assets/js/components/helpers/AppHelper.jsx` — add a `PAGES` entry + import for each of the three new page keys above, following the existing pattern for `npcCharacterEdit`/`pcCharacterEdit`.

### Step 2 — New controllers

- `frontend/assets/js/components/resources/item/pages/controllers/GameItemEditController.js` — new, for the game-scoped route. Loads via the existing `.../items/:id/full.json` path, PATCHes `.../items/:id.json`, redirects to the show page on success, surfaces field errors on 400 — follow the fetch/submit/redirect shape of `BaseCharacterEditController.js` (`frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js`).
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js` — new shared base for the two character-scoped item edit routes (mirrors the existing `BaseCharacterEditController.js`/subclass split).
- `frontend/assets/js/components/resources/character/pages/controllers/PcCharacterItemEditController.js` / `NpcCharacterItemEditController.js` — new thin subclasses supplying the pcs/npcs path segments, mirroring `PcCharacterEditController.js`/`NpcCharacterEditController.js`.

### Step 3 — New shared edit helper (visual)

`frontend/assets/js/components/resources/item/pages/helpers/ItemEditHelper.jsx` — new, reused by both the game-item and character-item edit pages (same visual, only the controller's fetch/submit target differs). Left/right layout matching the existing show page (`ItemDetailHelper.jsx`):
- Left: `ActionsOverlay` (`frontend/assets/js/components/common/misc/ActionsOverlay.jsx`, `type="item"`) with an upload action button, `dimmed={state.hidden}`, plus a switch controlling `hidden`.
- Right: `name` text input, `description` textarea.

`ActionsOverlay` already accepts a `dimmed` prop and is type-parameterized (`type="item"` vs `type="character"`) — no new avatar/photo component needed, this is purely new wiring of an existing mechanic onto the item type.

### Step 4 — Update the shared opacity rule

`frontend/assets/css/main.scss` — locate the dimmed-photo rule (base `opacity: 0.8` and its `&:hover { opacity: 1; }` companion, near lines 115-124 — confirm exact lines at implementation time) and change the base value to `opacity: 0.6`.

### Step 5 — Jasmine specs

- New spec files for `GameItemEditController`, `PcCharacterItemEditController`, `NpcCharacterItemEditController`, and `ItemEditHelper`, mirroring the existing `GameItemControllerSpec.js` / `CharacterItemDetailControllerSpec.js` / character-edit-controller specs for fetch/submit/redirect/error-handling coverage.

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — 3 new route entries.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — 3 new `PAGES` entries + imports.
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemEditController.js` — new.
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js` — new.
- `frontend/assets/js/components/resources/character/pages/controllers/PcCharacterItemEditController.js` — new.
- `frontend/assets/js/components/resources/character/pages/controllers/NpcCharacterItemEditController.js` — new.
- `frontend/assets/js/components/resources/item/pages/helpers/ItemEditHelper.jsx` — new.
- `frontend/assets/css/main.scss` — opacity `0.8` → `0.6`.
- New spec files under `frontend/specs/assets/js/components/resources/item/pages/controllers/`, `.../item/pages/helpers/`, and `.../character/pages/controllers/`.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — runs the new controller/helper specs.
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — ESLint.

## Notes

- No new "ItemAvatarField" component is needed — `ActionsOverlay` is already generic enough to cover items, it's just never had `dimmed` wired in for `type="item"` before.
- Photo upload keeps using its existing dedicated action/endpoint — not part of this PATCH form.
