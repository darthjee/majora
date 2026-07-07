# Frontend Plan: Add link icon

Main plan: [plan.md](plan.md)

## Shared contracts

- Each link object in the `links` arrays consumed by `LinkList` (from game, character, and character-edit state) will include a `link_type` field (string, possibly `''`/`null`/`undefined` for existing links).
- When `link_type` is falsy, keep rendering `bi-link-45deg` (unchanged fallback).
- When `link_type` is `'lootstudio'` (or any other value), render `frontend/assets/images/links/<link_type>.png` as an `<img>` instead of the `<i>` icon.

## Implementation Steps

### Step 1 — Reorganize `frontend/assets/images/`
Create subfolders and move files:
- `frontend/assets/images/placeholders/default_character.png`
- `frontend/assets/images/placeholders/default_game.png`
- `frontend/assets/images/placeholders/default_treasure.png`
- `frontend/assets/images/icons/` — move any other existing icon-like assets here if applicable (review `favicon.png`, `my_account.svg` and use judgment: `favicon.png` is referenced by the HTML entrypoint, not a component import, so confirm its reference path before moving it; `my_account.svg` looks like an icon and is a reasonable candidate for `icons/`).
- `frontend/assets/images/links/` — new folder for link-type icons.

### Step 2 — Add the placeholder LootStudio icon
Generate a plain black placeholder PNG at a reasonable icon size (e.g. 64x64) and save it as `frontend/assets/images/links/lootstudio.png`.

### Step 3 — Update existing image imports
Update the three components that import placeholder images directly under `assets/images/`:
- `frontend/assets/js/components/elements/CardAvatar.jsx` — update the `defaultCharacterPhoto` import path to `.../images/placeholders/default_character.png`.
- `frontend/assets/js/components/elements/CardPhoto.jsx` — update the `defaultGamePhoto` import path to `.../images/placeholders/default_game.png`.
- `frontend/assets/js/components/elements/CardTreasureImage.jsx` — update the `defaultTreasurePhoto` import path to `.../images/placeholders/default_treasure.png`.

### Step 4 — Render the link icon in `LinkList`
Edit `frontend/assets/js/components/elements/LinkList.jsx`:
- For each `link`, if `link.link_type` is set, dynamically resolve and render `frontend/assets/images/links/<link_type>.png` as an `<img>` (small, inline height matching the current icon's visual size) instead of the `<i className="bi bi-link-45deg">` element.
- If `link.link_type` is falsy, keep the current `<i className="bi bi-link-45deg">` fallback exactly as-is.
- Since Vite needs static-analyzable import paths (or `import.meta.glob`) rather than fully dynamic string concatenation for bundled assets, use `import.meta.glob('../../../images/links/*.png', { eager: true })` (or equivalent already-used pattern in this codebase, if any) to build a `link_type -> url` map, then look up `link.link_type` in it, falling back to the chain icon if not found (covers unknown/future values gracefully, not just the unset case).

### Step 5 — Update the test factory and specs
- `frontend/specs/support/factories.js`: optionally extend `buildLink` to accept a `link_type` override (default stays unset, i.e. no `link_type` key, to preserve existing spec behavior).
- `frontend/specs/assets/js/components/elements/LinkListSpec.js`: add cases for
  - a link with `link_type: 'lootstudio'` rendering the `lootstudio.png` image instead of `bi-link-45deg`.
  - a link with no `link_type` still rendering `bi-link-45deg` (already covered, keep it green).
  - a link with an unrecognized `link_type` falling back to `bi-link-45deg`.

## Files to Change
- `frontend/assets/images/placeholders/default_character.png` — moved from `frontend/assets/images/default_character.png`
- `frontend/assets/images/placeholders/default_game.png` — moved from `frontend/assets/images/default_game.png`
- `frontend/assets/images/placeholders/default_treasure.png` — moved from `frontend/assets/images/default_treasure.png`
- `frontend/assets/images/links/lootstudio.png` — new placeholder icon
- `frontend/assets/images/icons/` — relocated non-placeholder icon assets, if applicable
- `frontend/assets/js/components/elements/CardAvatar.jsx` — updated import path
- `frontend/assets/js/components/elements/CardPhoto.jsx` — updated import path
- `frontend/assets/js/components/elements/CardTreasureImage.jsx` — updated import path
- `frontend/assets/js/components/elements/LinkList.jsx` — render type-specific icon when `link_type` is set
- `frontend/specs/support/factories.js` — optional `link_type` support in `buildLink`
- `frontend/specs/assets/js/components/elements/LinkListSpec.js` — new coverage for icon-by-type behavior

## CI Checks
- `frontend/`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes
- Confirm whether `favicon.png` is referenced from an HTML file (outside the `assets/images` React import graph) before deciding whether it belongs in `icons/` — moving it could break an unrelated reference if it's not.
- The image reorganization only needs to update the three import sites named in the issue; grep for any other importers of `default_character.png`/`default_game.png`/`default_treasure.png` before finishing to avoid missing one.
