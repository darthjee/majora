# Plan: Improve Characters Index Pages (PCs and NPCs)

## Overview

Frontend-only. Add Bootstrap card layouts, avatar fallback, and pagination to the PCs and
NPCs index pages, and improve the Character detail page. Introduces `CardAvatar`,
`CharacterCard`, and shared `GameCharactersHelper` following the three-layer architecture.

## Context

- `GamePcs` and `GameNpcs` controllers already exist and fetch data correctly.
- `CharacterController` already exists and fetches detail data correctly.
- `CharacterListSerializer` returns `{ id, name, avatar_url }`.
- `CharacterDetailSerializer` returns `{ id, name, avatar_url, character_class, level, description, is_pc, photos }`.
- `default_character.png` already exists at `frontend/assets/images/default_character.png`.
- `CardPhoto` (same pattern) and `GameCard`/`GameCardHelper` serve as direct implementation references.
- The gameSlug is not passed down from the controller; pages derive it from the hash using
  the already-exported `getGameSlugFromPcsHash` / `getGameSlugFromNpcsHash` utility functions.

## Implementation Steps

### Step 1 — `CardAvatar` element

Create `frontend/assets/js/components/elements/CardAvatar.jsx`.
Same pattern as `CardPhoto`: imports `default_character.png`, renders
`<img src={url || defaultCharacterPhoto} className="card-img-top img-fluid" alt={alt} />`.

### Step 2 — `CharacterCard` + `CharacterCardHelper`

Create `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`:
- Static `render(character, gameSlug)` — Bootstrap card with `CardAvatar`, character name,
  link to `#/games/${gameSlug}/characters/${character.id}`.

Create `frontend/assets/js/components/elements/CharacterCard.jsx`:
- Thin delegator: receives `{ character, gameSlug }`, calls `CharacterCardHelper.render(...)`.

### Step 3 — `GameCharactersHelper` (shared for PCs and NPCs)

Create `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx`:
- `render(characters, pagination, basePath, title)` — Bootstrap grid of `CharacterCard` +
  `Pagination`. `title` is shown as a page heading (e.g. "Player Characters").
- `renderLoading()` — loading message.
- `renderError(error)` — Bootstrap danger alert.

### Step 4 — Refactor `GamePcs.jsx`

Import `getGameSlugFromPcsHash` from the controller and `GameCharactersHelper`.
Derive `gameSlug` from `window.location.hash` to build the pagination basePath.
Delegate all rendering to `GameCharactersHelper`:
- loading → `GameCharactersHelper.renderLoading()`
- error → `GameCharactersHelper.renderError(error)`
- render → `GameCharactersHelper.render(pcs, pagination, \`#/games/${gameSlug}/pcs\`, 'Player Characters')`

### Step 5 — Refactor `GameNpcs.jsx`

Same as Step 4 using `getGameSlugFromNpcsHash` and title `'Non-Player Characters'`.

### Step 6 — `CharacterHelper`

Create `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`:
- `render(character)` — shows avatar (large), name, class, level, description, photos gallery.
- `renderLoading()` — loading message.
- `renderError(error)` — danger alert.

### Step 7 — Refactor `Character.jsx`

Delegate all rendering to `CharacterHelper`.

### Step 8 — Specs

- `CardAvatarSpec.js` — same shape as `CardPhotoSpec`: URL present renders img, null/undefined
  renders fallback img with `default_character.png`.
- `CharacterCardSpec.js` — delegation smoke test.
- `CharacterCardHelperSpec.js` — renders name, link, avatar.
- `GameCharactersHelperSpec.js` — renders character cards, pagination, title, loading, error.
- `CharacterHelperSpec.js` — renders name, class, level, description, photos, loading, error.

## Files to Change

**New:**
- `frontend/assets/js/components/elements/CardAvatar.jsx`
- `frontend/assets/js/components/elements/CharacterCard.jsx`
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`
- `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx`
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`
- `frontend/specs/.../elements/CardAvatarSpec.js`
- `frontend/specs/.../elements/CharacterCardSpec.js`
- `frontend/specs/.../elements/helpers/CharacterCardHelperSpec.js`
- `frontend/specs/.../pages/helpers/GameCharactersHelperSpec.js`
- `frontend/specs/.../pages/helpers/CharacterHelperSpec.js`

**Updated:**
- `frontend/assets/js/components/pages/GamePcs.jsx`
- `frontend/assets/js/components/pages/GameNpcs.jsx`
- `frontend/assets/js/components/pages/Character.jsx`

### Step 9 — Review all pages and components for extraction opportunities

After all new code is in place, review the full set of helpers and components — both new and
existing — and extract any repetitive or complex HTML blocks into reusable elements.

Candidates to evaluate:
- Loading and error states: `renderLoading` and `renderError` appear in every page helper
  with nearly identical markup — consider a shared `LoadingMessage` and `ErrorAlert` element.
- Photo/avatar column layout in `GameHelper` (`col-md-4` + `CardPhoto`) may match a pattern
  used in `CharacterHelper`.
- Any other repeated Bootstrap structures across helpers.

Only extract when the block is genuinely reused in two or more places or is complex enough to
warrant its own component. Add specs for any new elements extracted.

## CI Checks

Before opening a PR:
- `frontend/`: `yarn test && yarn lint`
