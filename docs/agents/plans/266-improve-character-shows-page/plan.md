# Plan: Improve character shows page

Issue: [266-improve-character-shows-page.md](../../issues/266-improve-character-shows-page.md)

## Overview

Reorganize the character show and edit pages (PC and NPC) into a two-column
layout that groups identity/navigation content (photo, name, links) on the
left and descriptive content (role, description, DM notes, photo gallery) on
the right. Restyle `LinkList` — shared by the character show page, the game
show page, and (newly) the character edit page — as a stack of clickable
Bootstrap cards with a chain icon, using the new `bootstrap-icons` package.

## Context

- `CharacterHelper.render` (character show page) currently renders photo +
  info side by side in a `row`, then the private-description block, photo
  gallery, and `LinkList` stacked full-width below.
- `CharacterInfoHelper.render` renders name, role, and description together
  inside a single `col-md-8` — it does not currently separate name from
  role/description.
- `BaseCharacterEditHelper.render` (shared NPC/PC edit page) renders photo in
  `col-md-4` and the whole form (name, role, description, private
  description, submit) in `col-md-8`. The edit page never displays the
  character's links today.
- `CharacterEdit.jsx` (shared edit page container) loads the full character
  (via `applyLoadedCharacter`/`resolveLoadedCharacter` in
  `BaseCharacterEditController.js`) but does not currently pass
  `character.links` down to the edit helper's state.
- `LinkList` (`frontend/assets/js/components/elements/LinkList.jsx`) renders
  a plain `<ul>`/`<li>` list today. It is shared verbatim by `CharacterHelper`
  (character show) and `GameHelper` (game show) — restyling it as cards
  affects both pages, which matches the issue's intent (no icon library
  exists yet in the frontend).
- Existing card patterns to follow: `CharacterCardHelper.jsx` and
  `GameCardHelper.jsx` wrap a Bootstrap `card` in an `<a>` tag so the whole
  card is clickable, e.g.:
  ```jsx
  <a href={...} className="text-decoration-none text-dark">
    <div className="card h-100">...</div>
  </a>
  ```
- No icon library (Bootstrap Icons, FontAwesome, react-icons) is currently a
  frontend dependency. Global CSS is imported once in
  `frontend/assets/js/main.jsx` (alongside `bootstrap/dist/css/bootstrap.min.css`).

## Implementation Steps

### Step 1 — Add the `bootstrap-icons` dependency

Add `bootstrap-icons` to `frontend/package.json` `dependencies` (via
`docker-compose run` — never install directly on the host) and import its
stylesheet once globally in `frontend/assets/js/main.jsx`, next to the
existing Bootstrap CSS import:

```js
import 'bootstrap-icons/font/bootstrap-icons.css';
```

### Step 2 — Redesign `LinkList` as a stack of cards

Rewrite `frontend/assets/js/components/elements/LinkList.jsx` so each link
renders as its own Bootstrap `card`, stacked vertically (one per row, using
e.g. a wrapping `<div className="mb-2">` per card instead of `<ul>/<li>`),
with a `<i className="bi bi-link-45deg">` chain icon before the link text.
Wrap the whole card in the `<a>` tag (`target="_blank" rel="noreferrer"`,
preserved from today) so the entire card area is clickable, following the
`CharacterCardHelper`/`GameCardHelper` pattern. Keep the existing behavior of
rendering `null` when `links` is falsy or empty, and keep `link.url` as the
React key.

Update `frontend/specs/assets/js/components/elements/LinkListSpec.js` to
match the new markup (still assert href, anchor text, `target="_blank"`,
`rel="noreferrer"`, and the empty/undefined-links cases; add an assertion
for the presence of the `bi-link-45deg` icon class and the `card` class).

### Step 3 — Split `CharacterInfoHelper` so the name can move to the left column

Today `CharacterInfoHelper.render` renders name + role + description
together as a single `col-md-8` block, which is used only by
`CharacterHelper`. Since the name must move to the left column while role/
description stay on the right, refactor `CharacterInfoHelper` into two
pieces (or inline the split directly into `CharacterHelper`/`CharacterInfo`,
whichever keeps the helper's existing unit test coverage easiest to adapt):

- A left-column bit: `<h1>{name}</h1>` (no wrapping `col-md-*`, since the
  parent `CharacterHelper` now owns the column layout).
- A right-column bit: existing `#renderRole`/`#renderDescription` logic,
  still wrapped in `col-md-8`.

Update `CharacterInfo.jsx` accordingly if its prop contract changes, and
update `frontend/specs/assets/js/components/elements/CharacterInfoSpec.js`
and `.../helpers/CharacterInfoHelperSpec.js` to match.

### Step 4 — Rebuild `CharacterHelper.render`'s layout

Change `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` to
a single Bootstrap `row` with:

- `col-md-4` (left): `PhotoUploadOverlay` (unchanged), `<h1>{character.name}</h1>`,
  `LinkList links={character.links}`.
- `col-md-8` (right): role, public description (via the right-column part of
  Step 3), private-description block (`#renderPrivateDescription`, unchanged
  logic), and `CharacterPhotos`.

Update `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js`
to match the new structure (column classes, ordering, and that `LinkList`
now receives the same `character.links` prop as before but is rendered in
the left column).

### Step 5 — Pass `links` into the character edit page state

In `frontend/assets/js/components/pages/shared/CharacterEdit.jsx`, pass
`links: character.links` into the object handed to `EditHelper.render`
(read directly off the loaded `character`, the same way `profile_photo_path`
already is — no new `useState`/setter needed since links are read-only on
this page). Update
`frontend/specs/assets/js/components/pages/shared/CharacterEditSpec.js` if
it asserts the exact shape of that state object.

### Step 6 — Rebuild `BaseCharacterEditHelper.render`'s layout

Change `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx`
to:

- `col-md-4` (left): `PhotoUploadOverlay` (unchanged), the name `FormField`
  (moved out of the `<form>`'s right column — note the `<form>` element itself
  must still wrap all submitted fields, including the moved name field, so
  either widen the `<form>` to span both columns or keep name submission
  working via a `form` attribute; simplest is to keep a single `<form>`
  wrapping the whole `row` and place the two column `<div>`s inside it), and
  a read-only `LinkList links={state.links}` below the name field.
- `col-md-8` (right): role field, description field, private description
  field, submit button — unchanged.

Update
`frontend/specs/assets/js/components/pages/helpers/BaseCharacterEditHelperSpec.js`
(and any per-type spec files that assert on rendered structure, e.g.
`NpcCharacterEditHelperSpec.js`/`PcCharacterEditHelperSpec.js` if they
duplicate structural assertions) to match: name field in the left column,
`LinkList` present and fed `state.links`, form submission still works end to
end.

### Step 7 — Full regression pass

Read through `GameHelper.jsx`'s usage of `LinkList` once Step 2 is done to
confirm the restyled cards still look reasonable there (no layout change
required for the game page — only the shared `LinkList` component's markup
changes). No code change expected in `GameHelper.jsx` itself.

## Files to Change

- `frontend/package.json` / `frontend/yarn.lock` — add `bootstrap-icons` dependency (installed via `docker-compose run`).
- `frontend/assets/js/main.jsx` — import `bootstrap-icons/font/bootstrap-icons.css`.
- `frontend/assets/js/components/elements/LinkList.jsx` — restyle as stacked clickable cards with chain icon.
- `frontend/specs/assets/js/components/elements/LinkListSpec.js` — update assertions for new markup.
- `frontend/assets/js/components/elements/CharacterInfo.jsx` — adjust prop contract if the name/role+description split changes it.
- `frontend/assets/js/components/elements/helpers/CharacterInfoHelper.jsx` — split name rendering from role/description rendering.
- `frontend/specs/assets/js/components/elements/CharacterInfoSpec.js`, `.../helpers/CharacterInfoHelperSpec.js` — update for the split.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — two-column layout (left: photo/name/links, right: role/description/private description/photos).
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js` — update for new layout.
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx` — pass `links` from the loaded character into edit helper state.
- `frontend/specs/assets/js/components/pages/shared/CharacterEditSpec.js` — update if it asserts exact state shape.
- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` — two-column layout (left: photo/name/links read-only, right: role/description/private description/submit).
- `frontend/specs/assets/js/components/pages/helpers/BaseCharacterEditHelperSpec.js` (and `NpcCharacterEditHelperSpec.js`/`PcCharacterEditHelperSpec.js` if applicable) — update for new layout.

## CI Checks

- `frontend`: `npm run coverage` (or `npm run test`) (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — no translation keys are expected to change, but this must still pass.

## Notes

- No backend, proxy, infra, or translation changes are required — this issue is entirely frontend-scoped (React components/helpers + one new npm dependency).
- The edit page's `LinkList` usage is explicitly read-only per the issue ("links stay non-editable, out of scope for this issue") — no new edit/delete UI or API calls for links.
- Keep the `<form>` wiring intact when the name field moves to the left column and role/description/private description/submit remain in the form — the simplest approach is one `<form>` element wrapping the whole two-column `row`, per Step 6.
- The `bootstrap-icons` `bi-link-45deg` glyph is the icon named explicitly in the issue's Solution section — no design ambiguity there.
