# Issue: Grow STL model and create and show page

## Description
The miniatures module's STL model resource (`/#/miniatures/stl_models`) needs to grow: the creation form currently lives in a modal and needs to become a full page (also gaining edit support), and the model itself needs four new fields — `owned`, `type`, `race`, and `role` — surfaced on both the form and the show page.

## Problem
- STL model creation only happens through a modal (`StlModelNewModal.jsx`), which cannot be extended into an edit flow and has no dedicated URL to link to or bookmark.
- There is no way to record whether an STL is already owned, what kind of asset it is (terrain/prop/creature/other), or which race/role it represents — all useful filtering/browsing attributes that currently have no home on the model.

## Expected Behavior
- `/#/miniatures/stl_models/new` renders a full page with the STL model creation form (name, photo, tags, sources, collections, plus the new fields below).
- `/#/miniatures/stl_models/:id/edit` renders the same form pre-filled with an existing STL model's values; the show page (`StlModel.jsx`) gets an "Edit" entry point linking there.
- The `/miniatures/stl_models` list page's "New" button navigates to the new page instead of opening a modal; the modal (`StlModelNewModal.jsx` + its controller/helper) is removed.
- The form and show page expose:
  - `owned` — boolean switch, not nullable, default `true`.
  - `type` — required dropdown: `terrain`/`prop`/`creature`/`other` (English/Portuguese labels below).
  - `race` — nullable dropdown over a fixed D&D 5e race list, with a blank/"None" option.
  - `role` — nullable dropdown over a fixed D&D 5e class list, with a blank/"None" option. (Named `role`, not `class`, to avoid the Python reserved word and better describe the concept.)
- The show page displays the translated label for `type`/`race`/`role` (or nothing/"—" when `race`/`role` is null); form submissions send the raw `db_value` (or `null`).

### `type` values
| db_value | English | Portuguese |
| --- | --- | --- |
| terrain | Terrain | Terreno |
| prop | Prop | Adereço |
| creature | Creature | Criatura |
| other | Other | Outro |

### `race` values (standard D&D 5e races)
`human`, `elf`, `dwarf`, `halfling`, `gnome`, `half-elf`, `half-orc`, `tiefling`, `dragonborn`, `orc`, `goblin`

### `role` values (standard D&D 5e classes)
`barbarian`, `bard`, `cleric`, `druid`, `fighter`, `monk`, `paladin`, `ranger`, `rogue`, `sorcerer`, `warlock`, `wizard`, `archer`

## Solution

### Page conversion (supersedes the modal)
STL model creation was a full page (`StlModelNew.jsx`, route `/stl_models/new`) before commit `7cf08c1` (issue #1049) turned it into a modal. This issue reverts that direction:
- New route `/#/miniatures/stl_models/new` (consistent with the existing `/miniatures/stl_models` and `/miniatures/stl_models/:id` routes in `HashRouteResolver.js`, not the old pre-`/miniatures` prefix).
- New edit route `/#/miniatures/stl_models/:id/edit`, same form pre-filled.
- New backend update endpoint for `StlModel` (none exists today — only list/create and detail/show), gated by `require_staff` like create.
- `StlModelNewModal.jsx`, `StlModelNewController.js`, and their helper are deleted; the list page's "New" button becomes a plain navigation link.
- The pre-`7cf08c1` `StlModelNew.jsx`/`StlModelNewHelper.jsx` (recoverable via `git show 7cf08c12^:...`) is a usable starting template for the page shell, extended with the new fields and adapted for edit mode.

### `race`/`role` fields — not separate entities
The original idea of new `Race`/`Class` models (with photo upload, index/show pages, creation modal like `Source`) is dropped. `race` and `role` are plain closed-list enum fields on `StlModel`, the same shape as `type`:
- **Backend**: value lists as plain Python constants (`RACE_CHOICES`, `ROLE_CHOICES`) on the model, following the existing convention (`type`, `AuthorizationRequest.status`, `Game.GAME_TYPE_CHOICES`) — no YAML-loading mechanism.
- **Frontend**: `<select>` options hardcoded in the dropdown component (mirroring `GameTypeSelect.jsx`), matching the backend's allowed values by convention — no endpoint to fetch valid choices.
- **Translations**: labels in the existing i18n yaml files (`frontend/assets/i18n/{en,pt}/stl_model_page.yaml` or similar), using the same `<page>.race_<value>`/`<page>.role_<value>` key convention as `type`.
- Both dropdowns include a blank/"None" option mapping to `null`, usable on create (default unselected) and edit (to clear a previously-set value).

### Scope
Kept as a single issue: the page-conversion/edit work and the new-fields work touch the same files (`StlModel` form/page, serializers, model), so splitting would just make the fields work depend on the page-conversion PR merging first without any real parallelism benefit.
