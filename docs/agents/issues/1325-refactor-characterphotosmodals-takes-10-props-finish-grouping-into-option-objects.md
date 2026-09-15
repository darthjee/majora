# Issue: Refactor: CharacterPhotosModals takes 10 props — finish grouping into option objects

## Description

Codacy (Lizard, `parameter-count-medium`) flags `CharacterPhotosModals` in
`frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx:154`
for having 10 parameters, 2 over the configured limit of 8:

```jsx
function CharacterPhotosModals({
  character, alt, gameSlug, characterId, characterKind, uploadModal, profilePhotoActions, deleteFlow,
  selectedPhoto, setSelectedPhoto,
}) {
```

The component already groups three of its concerns into option objects
(`uploadModal`, `profilePhotoActions`, `deleteFlow`), following the pattern
used elsewhere in this codebase for trimming prop counts. The remaining 7
scalar props (`character`, `alt`, `gameSlug`, `characterId`, `characterKind`,
`selectedPhoto`, `setSelectedPhoto`) still push the total 2 over the limit.

## Solution

- Fold `selectedPhoto`/`setSelectedPhoto` into a `photoView` object
  (`{selectedPhoto, setSelectedPhoto}`), mirroring the existing
  `uploadModal`/`deleteFlow` grouping pattern in the same file.
- Group `character`, `gameSlug`, `characterId`, `characterKind` into a single
  option object passed as one prop, bringing the total prop count for
  `CharacterPhotosModals` to 6 (`characterContext`, `alt`, `photoView`,
  `uploadModal`, `profilePhotoActions`, `deleteFlow`), well under the limit
  of 8.
- Update the call site in `CharacterPhotos` (same file) to build and pass the
  new `photoView` and `characterContext` objects instead of the individual
  scalar props.
- No behavior change — this is a pure prop-shape refactor; update
  `frontend/specs/assets/js/components/resources/character/pages/CharacterPhotosSpec.js`
  only if it asserts on `CharacterPhotosModals`'s prop shape directly.

## Benefits

- Brings `CharacterPhotosModals` back under the Lizard parameter-count limit,
  clearing the Codacy finding.
- Keeps the prop-grouping style consistent across the whole component
  (`uploadModal`, `deleteFlow`, `profilePhotoActions`, `photoView`,
  `characterContext`), making future additions easier to place.
