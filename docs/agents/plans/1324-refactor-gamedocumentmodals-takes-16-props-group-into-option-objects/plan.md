# Plan: Refactor: GameDocumentModals takes 16 props — group into option objects

Issue: [1324-refactor-gamedocumentmodals-takes-16-props-group-into-option-objects.md](../../issues/1324-refactor-gamedocumentmodals-takes-16-props-group-into-option-objects.md)

## Overview

`GameDocumentModals` takes 16 flat props, tripping Lizard's parameter-count check (limit 8). Group each modal's own show flag, path(s), and handlers into an option object — `uploadModal`, `fileUploadModal`, `giveDocumentModal` — mirroring the pattern already used by `CharacterPhotosModals`'s `uploadModal` prop, while keeping `document`, `gameSlug`, `selectedPhoto`, and `onSelectPhoto` as plain shared props. This is frontend-only work.

See [frontend.md](frontend.md) for the full plan.
