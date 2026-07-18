# Issue: Reorganize frontend files

## Description
The `frontend/assets/js/components/common` folder has grown to roughly 50 flat component files (plus separate `controllers/`, `helpers/`, and `listTypes/` subfolders holding their matching controller/helper files), making it hard to find related files for a given component.

## Problem
Related files for a single component are scattered across three different locations: the component itself lives directly in `common/`, its controller (if any) lives in `common/controllers/`, and its helper (if any) lives in `common/helpers/`. This makes it harder to see, at a glance, which files belong together, and increases the effort needed to navigate or refactor a single component.

## Expected Behavior
Every component in `common/` lives in a themed subfolder together with its own controller and/or helper (if it has any) — no component, controller, or helper remains directly in the flat `common/`, `common/controllers/`, or `common/helpers/` folders. The corresponding spec files under `specs/assets/js/components/common/` mirror the same subfolder structure. All import paths across the codebase (relative imports, since this project does not use path aliases) are updated to match the new locations.

## Solution
Group components into thematic subfolders (rather than one folder per component), for example:
- `buttons/` — BackButton, EditButton, LoadMoreButton, NewButton, SubmitButton, UploadButton
- `modals/` — LoginModal, MoneyEditModal, PhotoUploadModal, PhotoViewModal, ProfilePhotoSetModal, TaskDetailModal, ViewAsModal
- `cards/` — CardAvatar, CardHoverTooltip, CardItemImage, CardPhoto, CardTreasureImage, CharacterPreviewCard, ItemPreviewCard, PreviewSection, SeeAllCard, TreasureCard, TreasurePreviewCard
- `badges/` — Badge, InfoBadgeList, TooltipBadge
- `forms/` — FieldErrors, FormField, TextareaField
- `header/` — Header and its controllers/helpers
- `pagination/` — Pagination and its controller/helper
- `list_page/` — ListPage, PageActions, PageLink and their controller/helper
- a `base/` (or similar) home for shared base classes not tied to one component (`BasePageController`, `BaseEditController`)
- a catch-all group for the remaining standalone components (e.g. ActionBar, ActionsOverlay, Avatar, ConditionalComponent, DescriptionBox, ErrorAlert, InfoBar, LanguageSelector, LinkIcon, LinkList, LoadingMessage, ResilienceIndicator, Table, TreasureMoney)

The exact final grouping and naming is left to implementation/planning, as long as every file ends up grouped by theme rather than by file type. The existing `listTypes/` folder (already organized by theme) can stay as-is or be nested under the new structure at the implementer's discretion.

## Benefits
- Related files are co-located, making a component's full implementation easier to find and reason about.
- Reduces clutter in the flat `common/`, `common/controllers/`, and `common/helpers/` folders.
- Groups by theme make it easier to discover related components (e.g. all modals, all cards) rather than just related files for one component.
