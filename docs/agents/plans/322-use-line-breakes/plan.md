# Plan: Render line breaks in character and game descriptions

Issue: [322-use-line-breakes.md](../issues/322-use-line-breakes.md)

## Overview
Three free-text fields (PC/NPC public description, PC/NPC private/DM description, and Game description) store line breaks that are currently not rendered visually because their container elements use normal `white-space` handling. Add a small reusable CSS utility class that preserves line breaks (`white-space: pre-wrap`) and apply it to the three container elements, avoiding any HTML injection (`dangerouslySetInnerHTML`).

## Context
- `CharacterInfoHelper#renderDescription` (`frontend/assets/js/components/elements/helpers/CharacterInfoHelper.jsx`) renders the public description inside a plain `<div className="mt-3 p-3 border rounded bg-light">`.
- `CharacterHelper#renderPrivateDescription` (`frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`) renders the private/DM description inside a plain `<div className="p-3 border rounded bg-light">`.
- `GameHelper#render` (`frontend/assets/js/components/pages/helpers/GameHelper.jsx`) renders the game description inside a plain `<p className="mt-3">`.
- The project has no existing `white-space: pre-wrap` utility class; Bootstrap (as used here) does not ship one by default either. `frontend/assets/css/main.scss` is the project's custom stylesheet and is the natural place to add a small reusable utility class.
- No API/serializer changes are needed — the data already contains the raw text with newlines; only rendering changes.

## Implementation Steps

### Step 1 — Add a `text-pre-wrap` utility class
In `frontend/assets/css/main.scss`, add a small utility class:

```scss
.text-pre-wrap {
  white-space: pre-wrap;
}
```

### Step 2 — Apply the utility class to the three description containers
- `CharacterInfoHelper#renderDescription`: add `text-pre-wrap` to the existing `className` on the description `<div>`.
- `CharacterHelper#renderPrivateDescription`: add `text-pre-wrap` to the existing `className` on the private description `<div>`.
- `GameHelper#render`: add `text-pre-wrap` to the existing `className` on the description `<p>`.

### Step 3 — Update/add Jasmine specs
Update the existing specs for `CharacterInfoHelper`, `CharacterHelper`, and `GameHelper` (or their consuming components' specs, whichever currently assert on these elements' `className`) to assert the `text-pre-wrap` class is present, and add a case with a multi-line description to confirm the newline characters are preserved in the rendered text content.

## Files to Change
- `frontend/assets/css/main.scss` — add the `.text-pre-wrap { white-space: pre-wrap; }` utility class.
- `frontend/assets/js/components/elements/helpers/CharacterInfoHelper.jsx` — add `text-pre-wrap` class to the public description container.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — add `text-pre-wrap` class to the private description container.
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — add `text-pre-wrap` class to the game description container.
- Corresponding Jasmine spec files under `frontend/assets/js/components/**/__tests__` (or sibling `.spec.jsx` files, following existing conventions) for the three helpers/components above.

## CI Checks
- `frontend`: `yarn install && npm run lint` (CI job: `frontend-checks`)
- `frontend`: `yarn install && npm run coverage` (CI job: `jasmine`)

## Notes
- No `dangerouslySetInnerHTML` or HTML injection — per the issue, this must remain a pure CSS fix since these are free-text fields with no HTML content precedent.
- Only one specialist agent (`frontend`) has work for this issue; no agent split or shared contracts are needed.
