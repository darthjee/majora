# Plan: Fix button layout in character photos page

Issue: [294-fix-button-layout-in-character-photos-page.md](../../issues/294-fix-button-layout-in-character-photos-page.md)

## Overview

Replace the duplicated inline `<button className="btn btn-secondary">` upload button in
`GamePhotosHelper.jsx`, `PcCharacterPhotosHelper.jsx`, and `NpcCharacterPhotosHelper.jsx` with a
new shared `UploadButton` component, styled consistently with the existing `EditButton` /
`NewButton` components (`btn btn-secondary mb-3`), so the upload button visually matches the
rest of the app's page-action buttons.

## Context

`EditButton.jsx` and `NewButton.jsx` (in `frontend/assets/js/components/elements/`) are small
shared components rendering an `<a>` styled as `btn btn-secondary mb-3` / `btn btn-primary mb-3`
respectively, driven by an `href` prop, used inside `PageActions` next to the back button on
pages like `CharacterHelper.jsx`, `GameHelper.jsx`, `GamesHelper.jsx`, etc.

The three photos helpers (`GamePhotosHelper.jsx`, `PcCharacterPhotosHelper.jsx`,
`NpcCharacterPhotosHelper.jsx`) each define an identical private `#renderUploadButton(canEdit,
handlers)` method that renders a raw `<button type="button" className="btn btn-secondary"
onClick={handlers.onOpenUploadModal}>` — missing the `mb-3` spacing class and not reusing any
shared component, unlike the rest of the app's page-action buttons. The button opens an upload
modal via `handlers.onOpenUploadModal`, so (unlike `EditButton`/`NewButton`) it must be
`onClick`-based rather than `href`-based.

## Implementation Steps

### Step 1 — Add the shared `UploadButton` component

Create `frontend/assets/js/components/elements/UploadButton.jsx`, modeled directly on
`EditButton.jsx`/`NewButton.jsx` but rendering a `<button type="button">` instead of an `<a>`:

```jsx
import React from 'react';

/**
 * Secondary "upload" action button rendered as a button element.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onClick - Click handler invoked when the button is pressed.
 * @param {React.ReactNode} props.children - Label text or child elements.
 * @returns {React.ReactElement} Upload button element.
 */
export default function UploadButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-secondary mb-3">
      {children}
    </button>
  );
}
```

### Step 2 — Add a Jasmine spec for `UploadButton`

Create `frontend/specs/assets/js/components/elements/UploadButtonSpec.js`, mirroring
`EditButtonSpec.js`'s structure (using `renderToStaticMarkup` since the component has no
internal state), adapted for a button element and an `onClick` handler:

- renders a `<button>` with `btn-secondary` and `mb-3` classes
- renders the children as button label
- invokes the `onClick` prop when clicked (use `react-dom/test-utils` `Simulate.click`, or
  render into a jsdom container and dispatch a click event — check how other `onClick`-based
  components in this suite are tested, if any, and follow the same pattern for consistency;
  otherwise assert the `onClick` prop is wired to the rendered button via a DOM render +
  `Simulate.click`).

### Step 3 — Use `UploadButton` in the three photos helpers

In each of `GamePhotosHelper.jsx`, `PcCharacterPhotosHelper.jsx`, and
`NpcCharacterPhotosHelper.jsx`:

- Import `UploadButton` from `'../../elements/UploadButton.jsx'`.
- Replace the private `#renderUploadButton` method's `<button>` JSX with
  `<UploadButton onClick={handlers.onOpenUploadModal}>{Translator.t('<page>.upload')}</UploadButton>`,
  keeping the `if (!canEdit) return null;` guard and the method's existing signature (so the
  call sites `GamePhotosHelper.#renderUploadButton(canEdit, handlers)` etc. stay unchanged) —
  or, if simpler and equally clear, inline `UploadButton` directly into `render()` guarded by
  `canEdit &&` and drop the now-trivial private method. Either approach is acceptable as long as
  the duplicated raw `<button>` JSX is gone from all three helpers.
- Do not change the translation keys (`game_photos_page.upload`, `pc_character_photos_page.upload`,
  `npc_character_photos_page.upload`) or any other prop wiring.

### Step 4 — Update existing specs

Update `GamePhotosHelperSpec.js`, `PcCharacterPhotosHelperSpec.js`, and
`NpcCharacterPhotosHelperSpec.js` only if any assertion depends on the exact previous markup
(e.g. asserts `btn-secondary` without `mb-3`, or asserts on `<button` markup rather than on the
translated label / click behavior). Read each spec first; if assertions are already
implementation-agnostic (checking the translated label text and that
`onOpenUploadModal` fires on click), no changes are needed beyond confirming they still pass.

## Files to Change

- `frontend/assets/js/components/elements/UploadButton.jsx` — new shared upload button component
- `frontend/specs/assets/js/components/elements/UploadButtonSpec.js` — new spec for the component
- `frontend/assets/js/components/pages/helpers/GamePhotosHelper.jsx` — use `UploadButton`
- `frontend/assets/js/components/pages/helpers/PcCharacterPhotosHelper.jsx` — use `UploadButton`
- `frontend/assets/js/components/pages/helpers/NpcCharacterPhotosHelper.jsx` — use `UploadButton`
- `frontend/specs/assets/js/components/pages/helpers/GamePhotosHelperSpec.js` — update only if needed
- `frontend/specs/assets/js/components/pages/helpers/PcCharacterPhotosHelperSpec.js` — update only if needed
- `frontend/specs/assets/js/components/pages/helpers/NpcCharacterPhotosHelperSpec.js` — update only if needed

## CI Checks

- `frontend`: `docker-compose run --rm frontend npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm frontend npm run coverage` (CI job: `jasmine`)

## Notes

- No backend, proxy, infra, or translation changes are needed — all existing i18n keys stay as
  they are.
- Single agent involved (`frontend`); no agent split or shared contracts needed.
