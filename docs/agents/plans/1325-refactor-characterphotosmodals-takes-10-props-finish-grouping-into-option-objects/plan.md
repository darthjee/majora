# Plan: Refactor: CharacterPhotosModals takes 10 props — finish grouping into option objects

Issue: [1325-refactor-characterphotosmodals-takes-10-props-finish-grouping-into-option-objects.md](../../issues/1325-refactor-characterphotosmodals-takes-10-props-finish-grouping-into-option-objects.md)

## Overview

`CharacterPhotosModals` (in `CharacterPhotos.jsx`) has 10 parameters, 2 over
the Lizard `parameter-count-medium` limit. This is a frontend-only,
behavior-preserving prop-shape refactor: fold `selectedPhoto`/
`setSelectedPhoto` into a `photoView` object and `character`/`gameSlug`/
`characterId`/`characterKind` into a `characterContext` object, bringing the
component to 6 props.

See [frontend.md](frontend.md) for the full plan.
