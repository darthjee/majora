# Plan: Reorganize frontend files (#670)

## Context

`frontend/assets/js/components/common/` currently holds ~50 flat `.jsx` component files,
plus separate `controllers/`, `helpers/`, and `listTypes/` subfolders holding their matching
controller/helper files (file-type split, documented in
[frontend.md](../../frontend.md)'s "Directory Structure" section). This plan regroups
`common/` into themed subfolders, each carrying its component(s) together with their own
controller/helper, per issue #670.

Only the `frontend` agent has code work here (everything lives under `frontend/`). The plan
also requires updates to root-level docs (`docs/agents/frontend.md`, `docs/agents/pagination.md`,
`docs/agents/i18n.md`), which the architect handles directly as part of finishing this issue —
no second agent's implementation work is needed, so this plan is not split.

Imports in this codebase use relative paths, not aliases (confirmed via grep) — every file
that imports something from `common/` needs its relative import path updated to match the new
location, in both `frontend/assets/js/` and its mirrored `frontend/specs/assets/js/` tree.

## Target structure

Create these subfolders under `frontend/assets/js/components/common/`, each with its own
`controllers/`/`helpers/` sub-subfolders only when it actually has controller/helper files
(no empty subfolders):

| Subfolder | Components | Controllers | Helpers |
|---|---|---|---|
| `base/` | — | `BasePageController.js`, `BaseEditController.js` | — |
| `buttons/` | `BackButton.jsx`, `EditButton.jsx`, `LoadMoreButton.jsx`, `NewButton.jsx`, `SubmitButton.jsx`, `UploadButton.jsx` | — | `BackButtonHelper.jsx` |
| `modals/` | `LoginModal.jsx`, `MoneyEditModal.jsx`, `PhotoUploadModal.jsx`, `PhotoViewModal.jsx`, `ProfilePhotoSetModal.jsx`, `TaskDetailModal.jsx`, `ViewAsModal.jsx` | `LoginModalController.js`, `MoneyEditModalController.js`, `PhotoUploadModalController.js`, `ViewAsModalController.js` | `LoginModalHelper.jsx`, `MoneyEditModalHelper.jsx`, `PhotoUploadModalHelper.jsx`, `PhotoViewModalHelper.jsx`, `ProfilePhotoSetModalHelper.jsx`, `TaskDetailModalHelper.jsx`, `ViewAsModalHelper.jsx` |
| `cards/` | `CardAvatar.jsx`, `CardHoverTooltip.jsx`, `CardItemImage.jsx`, `CardPhoto.jsx`, `CardTreasureImage.jsx`, `CharacterPreviewCard.jsx` (+ `characterPreviewConstants.js`), `ItemPreviewCard.jsx`, `PreviewSection.jsx`, `SeeAllCard.jsx`, `TreasureCard.jsx`, `TreasurePreviewCard.jsx` | — | `CardPhotoHelper.jsx`, `CharacterPreviewCardHelper.jsx`, `ItemPreviewCardHelper.jsx`, `PreviewSectionHelper.jsx`, `SeeAllCardHelper.jsx`, `TreasureCardHelper.jsx`, `TreasurePreviewCardHelper.jsx` |
| `badges/` | `Badge.jsx`, `InfoBadgeList.jsx`, `TooltipBadge.jsx` | — | — |
| `forms/` | `FieldErrors.jsx`, `FormField.jsx`, `TextareaField.jsx` | — | — |
| `header/` | `Header.jsx` | `HeaderController.js`, `HeaderGameAccessController.js`, `HeaderRouteResolver.js`, `HeaderViewAsController.js` | `HeaderHelper.jsx`, `HeaderNavHelper.jsx` |
| `pagination/` | `Pagination.jsx`, `PageLink.jsx` | `PaginationController.js`, `PaginationBuilder.js` | `PaginationHelper.jsx` |
| `list_page/` | `ListPage.jsx`, `PageActions.jsx` | `ListPageController.js` | `ListPageHelper.jsx` |
| `list_types/` | (existing `listTypes/` folder — keep contents, just rename/nest here) | — | move `ItemCardHelper.jsx`, `CharacterDeceptionBadges.js`, `CharacterStatusBadges.js`, `SlainSecondaryButtons.js` in here too — confirmed via grep to be consumed only by `listTypes/configs/*` and each other, not by any root component |
| `misc/` | `ActionBar.jsx`, `ActionsOverlay.jsx`, `Avatar.jsx`, `ConditionalComponent.jsx`, `DescriptionBox.jsx`, `ErrorAlert.jsx`, `InfoBar.jsx`, `LanguageSelector.jsx`, `LinkIcon.jsx`, `LinkList.jsx`, `LoadingMessage.jsx`, `ResilienceIndicator.jsx`, `Table.jsx`, `TreasureMoney.jsx` | `LanguageSelectorController.js`, `ResilienceIndicatorController.js` | `DescriptionBoxHelper.jsx`, `InfoBarRules.js`, `LanguageSelectorHelper.jsx`, `ResilienceIndicatorHelper.jsx`, `TableHelper.jsx`, `TreasureMoneyHelper.jsx` |

This mapping was derived by cross-referencing every file in `common/`, `common/controllers/`,
and `common/helpers/` by name, then `grep`-ing the handful of files that don't follow the
`Component`/`ComponentController`/`ComponentHelper` naming pattern (`HeaderNavHelper`,
`HeaderGameAccessController`, `HeaderRouteResolver`, `HeaderViewAsController`, `InfoBarRules`,
`CharacterDeceptionBadges`, `CharacterStatusBadges`, `SlainSecondaryButtons`, `ItemCardHelper`,
`PaginationBuilder`) to confirm which component/subsystem actually imports them. Before moving
any file, re-grep its importers to catch anything used from more than one place (e.g. if a
"misc" helper turns out to be used from two different theme folders, prefer keeping it with
whichever single component owns it, or leave it one level up if genuinely shared across
themes).

## Migration steps

1. For each subfolder in the table above:
   a. `git mv` the component `.jsx` file(s) into the new subfolder.
   b. `git mv` the matching controller(s) into `<subfolder>/controllers/`.
   c. `git mv` the matching helper(s) into `<subfolder>/helpers/`.
   d. Fix the moved files' own relative imports (e.g. a controller importing
      `../../client/GenericClient.js` now needs one more `../`).
2. After each subfolder's files are moved, fix every other file's relative import path that
   pointed at the moved files — search the whole `frontend/` tree (both `assets/` and `specs/`)
   for the old path fragments (e.g. `common/Pagination`, `common/controllers/PaginationController`,
   `common/helpers/PaginationHelper`) rather than doing one giant find/replace at the end, so
   breakage is caught incrementally.
3. Move each component's spec file (and any spec subfolder, e.g. `specs/.../common/ActionBar/`)
   into the mirrored new location under `frontend/specs/assets/js/components/common/`, matching
   the same subfolder names as the source tree.
4. Run `docker-compose run --rm majora_fe yarn lint` and
   `docker-compose run --rm majora_fe yarn test` after each subfolder (not just once at the
   very end) — ESLint's import resolution and Jasmine's module loading will fail loudly on any
   stale relative path, which is the main risk in a move this size.
5. Once every subfolder is done, do a final repo-wide search for any remaining reference to the
   old flat paths (`components/common/controllers/`, `components/common/helpers/` outside of
   the new subfolders) to make sure nothing was missed, then run the full lint + test suite once
   more.

## Documentation updates

Update these root-level docs to match the new structure (architect's task, not delegated):
- [docs/agents/frontend.md](../../frontend.md) — "Directory Structure" section (the
  `common/controllers/`, `common/helpers/` file-type split description) and the "Pagination"
  section's file list.
- [docs/agents/pagination.md](../../pagination.md) — the file table listing
  `common/Pagination.jsx`, `common/helpers/PaginationHelper.jsx`,
  `common/controllers/PaginationController.js`, `common/controllers/PaginationBuilder.js`.
- [docs/agents/i18n.md](../../i18n.md) — the `LanguageSelector.jsx` path reference.

## CI Checks

- `frontend-checks` job (`.circleci/config.yml`): `npm run lint` — locally
  `docker-compose run --rm majora_fe yarn lint`.
- `jasmine` job: `npm run coverage` — locally `docker-compose run --rm majora_fe yarn test`
  (or `yarn coverage` to match CI exactly).

Both must pass; `yarn lint` also enforces the JSDoc rules already in place, so moved files keep
their existing doc comments unchanged (only import paths change).
