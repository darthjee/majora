# Frontend Plan: Refactor: CharacterPhotosModals takes 10 props — finish grouping into option objects

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Group `photoView` and `characterContext`, update `CharacterPhotosModals`'s signature and body

In `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx`:

- Change `CharacterPhotosModals`'s destructured props from
  `{ character, alt, gameSlug, characterId, characterKind, uploadModal, profilePhotoActions, deleteFlow, selectedPhoto, setSelectedPhoto }`
  to `{ characterContext, alt, photoView, uploadModal, profilePhotoActions, deleteFlow }` (6 props).
  - `characterContext` shape: `{ character, gameSlug, characterId, characterKind }`.
  - `photoView` shape: `{ selectedPhoto, setSelectedPhoto }`.
  - `alt` stays a standalone prop (it's a derived display string, not part of
    the character's identity/scope).
- Update the function body to read through the new objects:
  `characterContext.character`, `characterContext.gameSlug`,
  `characterContext.characterId`, `characterContext.characterKind`,
  `photoView.selectedPhoto`, `photoView.setSelectedPhoto`.
- Update the JSDoc block above `CharacterPhotosModals` to document
  `props.characterContext` (with its 4 nested fields) and `props.photoView`
  (with its 2 nested fields) in place of the 6 separate `@param` entries they
  replace, keeping the same style as the existing `props.uploadModal` /
  `props.deleteFlow` doc entries.

No other function in this file (`useDeletePhotoFlow`,
`buildCharacterPhotosHandlers`, `useCharacterPhotosLoad`, etc.) changes — this
refactor is scoped strictly to `CharacterPhotosModals`'s own parameter list,
per the issue.

### Step 2 — Update the call site in `CharacterPhotos`

In the same file, where `CharacterPhotos` renders `<CharacterPhotosModals ... />`:

- Build the two option objects inline at the call site (no new top-level
  variable needed elsewhere in `CharacterPhotos`, since nothing else in that
  component currently needs them bundled):
  ```jsx
  <CharacterPhotosModals
    characterContext={{
      character, gameSlug, characterId, characterKind,
    }}
    alt={alt}
    photoView={{ selectedPhoto, setSelectedPhoto }}
    uploadModal={uploadModal}
    profilePhotoActions={profilePhotoActions}
    deleteFlow={deleteFlow}
  />
  ```
- `CharacterPhotos`'s own local variables (`character`, `gameSlug`,
  `characterId`, `characterKind`, `selectedPhoto`, `setSelectedPhoto`) stay as
  they are — only the JSX call site changes, per the issue's scoping answer.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — regroup `CharacterPhotosModals`'s props into `characterContext` and `photoView`, update its JSDoc, and update the call site in `CharacterPhotos`.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`) — Lizard/ESLint parameter-count check.
- `frontend`: `npm run coverage` (CI job: `jasmine`) — existing Jasmine specs, notably `frontend/specs/assets/js/components/resources/character/pages/CharacterPhotosSpec.js`, must keep passing unmodified (it renders `CharacterPhotos` and doesn't assert on `CharacterPhotosModals`'s internal prop shape).

## Notes

- Pure prop-shape refactor — no behavior change, no new tests expected. If Codacy/ESLint still flags anything after this change, double check the exact prop/param count reported (6 expected here) rather than reopening the grouping decision.
- `alt` was deliberately kept out of `characterContext` (per the issue's discussion) since it's a display string derived from `character.name` in the parent, not part of the character's identity/scope.
