# Issue: Add a predefined category to GameTask

## Description
Game tasks (`Task`, shown on the game's Tasks page) have no way to be grouped. Add a
`category` field that takes one value from a predefined set, so DMs can tell prep work apart
at a glance.

## Problem
Game tasks can't be classified. A DM's prep checklist mixes very different kinds of work
(printing minis, painting, writing, scheduling, buying supplies...) and there is no way to tell
them apart at a glance or, later, to filter them.

## Expected Behavior
- A task can be created and edited with any of the categories above.
- Existing tasks show as `other`.
- The API rejects a category that isn't in the list.
- The category appears on the Tasks page and in the task detail modal, translated.
- The create form starts at `other`, the category picker is the first field (before the title) in
  both forms, and the create form keeps the last picked category after adding a task.
- Typing in the category picker filters the list; `Escape` or clicking away closes it without
  changing the category.

## Solution
### Categories
- `printing`: Printing
- `crafting`: Crafting
- `painting`: Painting
- `planning`: Planning
- `writing`: Writing
- `research`: Research
- `scheduling`: Scheduling
- `buying`: Buying
- `updating`: Updating
- `other`: Other (default, used for existing tasks)

The picker lists the categories in this fixed order, with `other` always last (the same approach
as `GameCommonItem`), not sorted alphabetically by translated label.

Changing the list later: adding a category only needs the new constant/choice (plus the frontend
value and i18n keys) and a migration that updates `choices`. Removing one needs a data migration
that moves its tasks to `other`.

### Scope
#### Backend
- `backend/games/models/task.py`: add `CATEGORY_*` constants, `CATEGORY_CHOICES`, and
  `category = models.CharField(max_length=16, choices=CATEGORY_CHOICES, default=CATEGORY_OTHER)`,
  following `GameCommonItem.category`.
- Migration: adds the column and fills every existing task with `other` (a `default='other'` on
  `AddField` is enough, no separate data migration needed).
- Serializers `game_task_list.py`, `game_task_create.py`, `game_task_update.py`: expose/accept
  `category` (optional on create/update; invalid values rejected).
- Tests for the model default, serializers and the list/detail views.

#### Frontend
- Show the category as a plain badge (the existing `Badge` component, no per-category color or
  icon) next to each task on the Tasks page (`GameTasksHelper.jsx`) and in the task detail modal's
  view mode (`TaskDetailModalHelper.jsx`), using the translated `game_task.category.<value>`
  label.
- Create and edit task forms: a type-to-filter category picker (see [Form](#form) below).
- i18n keys in `en` and `pt` (see [i18n](#i18n) below).
- Jasmine specs for the new rendering and controller payloads, plus `SingleResourcePickerField`
  specs for constant mode (typing filters the list; picking sets the value) and for cancelling
  (`Escape` and click-away close the search and keep the value).

#### Cache
- No Navi change: `navi/` has no task resources (tasks are DM-private and not cache-warmed).

### Form
Both forms use a **type-to-filter picker**, like the Race/Roles filters on `/#/miniatures/stl_models`,
instead of a plain `<select>`: the DM types part of a category name and picks from the filtered
list.

Those STL filters use `MultiResourcePickerField` in *constant mode* (`picker.values` +
`picker.translateOption`), backed by `ResourcePickerSearch`, which already filters a fixed list
client-side. Task category is a **single** value, so this issue extends
`SingleResourcePickerField` (`frontend/assets/js/components/common/forms/SingleResourcePickerField.jsx`)
to support the same constant mode:
- Take the same `picker` prop shape as `MultiResourcePickerField`
  (`{resource, maxEntries}` or `{values, translateOption}`) and pass it through
  `SingleResourcePickerFieldHelper` to `ResourcePickerSearch`.
- Update the one existing caller (`CollectionNewModalHelper.jsx`) to the new `picker` prop.
- In constant mode the picked item is `{id: value, name: translateOption(value)}`, as in the
  multi picker. The task forms store the raw `id` string (`'painting'`) in their state and send
  that as `category`.
- Behavior stays as it is now: the current category shows as a badge; clicking it opens the
  search input, and picking a result replaces it. Since `category` always has a value (default
  `other`), there is no "none" state.
- **Cancel re-picking:** while the search input is open over an already-picked value, pressing
  `Escape` or clicking outside the field (blur) closes the search and keeps the current value.
  This lives in `SingleResourcePickerField` itself (e.g. an `onCancel` handler that resets
  `searching` to `false`), so the Collection modal gets it too. Clicking a result must still
  register before the blur closes the search (e.g. select on `mousedown`, or ignore blur when
  focus moves inside the field).

#### Shared
- A `TASK_CATEGORY_VALUES` constant that mirrors the backend choices, in the same order (same
  approach as `CATEGORY_VALUES` in `CommonItemCategoryField.jsx`):
  ```js
  ['printing', 'crafting', 'painting', 'planning', 'writing',
   'research', 'scheduling', 'buying', 'updating', 'other']
  ```
- Option labels come from one shared i18n key, `game_task.category.<value>`, used by the create
  form, the edit modal and the list badge.
- `SingleResourcePickerField` gets an optional `errors` prop, rendered through `FieldErrors`, so
  the create form can show server errors for `category`.

#### Create form (`GameTasksHelper.#renderAddForm`)
- Category picker (`game-tasks-new-category`), placed as the **first field** of the form, before the task title (`short_description`).
- Starts at `other`.
- `formValues` gains `category`; `GameTasksController.handleCreateTask` sends it as `category`.
- Shows `fieldErrors.category`.
- **After a successful create, the category is not reset**: it keeps the last value picked, so
  several tasks of the same kind can be added in a row. The other fields reset as they do today.

#### Edit form (`TaskDetailModalHelper.#renderEditForm`)
- Category picker (`task-detail-category`), placed as the **first field** of the form, before the task title (`short_description`).
- Filled in from `task.category`.
- New `onCategoryChange` handler next to `onShortDescriptionChange`/`onLongDescriptionChange`;
  `handleSaveEdit` includes `category` in the PATCH body.

### i18n
Languages: `en` and `pt` (their key sets must stay in sync).

#### Category labels: new shared namespace `game_task`
The labels are used by the Tasks page (list badge and create form) and the task detail modal, so
per `docs/agents/i18n.md` they go in a shared namespace inside `common.yaml` (loaded at startup)
instead of a separate chunk:
- Add a `game_task:` top-level key to `frontend/assets/i18n/en/common.yaml` and
  `frontend/assets/i18n/pt/common.yaml`.
- Add `'game_task'` to `commonNamespaces` in both `en/index.js` and `pt/index.js`.

| key (`game_task.category.*`) | en | pt |
|---|---|---|
| `printing` | Printing | Impressão |
| `crafting` | Crafting | Confecção |
| `painting` | Painting | Pintura |
| `planning` | Planning | Planejamento |
| `writing` | Writing | Escrita |
| `research` | Research | Pesquisa |
| `scheduling` | Scheduling | Agendamento |
| `buying` | Buying | Comprar |
| `updating` | Updating | Atualizar |
| `other` | Other | Outro |

#### Picker labels: existing namespaces
| key | en | pt |
|---|---|---|
| `game_tasks_page.new_category_label` | Category | Categoria |
| `game_tasks_page.new_category_search_placeholder` | Search category... | Buscar categoria... |
| `game_task_edit_modal.category_label` | Category | Categoria |
| `game_task_edit_modal.category_search_placeholder` | Search category... | Buscar categoria... |

#### Errors
- `errors.invalid_choice` already exists in both languages; no new key is needed for it.
- Check that the codes DRF returns for `null`/`""` on `category` (`null`, `blank`) have
  `errors.*` entries too, and add them if missing.

### Edge cases
#### API (validated in the create/update serializers)
- A value outside the list (e.g. `"cooking"`, or a different case like `"Painting"`) is rejected
  with 400 and a `category` field error (DRF `invalid_choice`). Values must match exactly.
- `null` or `""` is rejected with 400. It is never quietly converted to `other`.
- Create without `category`: saved as `other`.
- PATCH without `category`: the category stays as it is (the detail view already uses
  `GameTaskUpdateSerializer(..., partial=True)`). In particular, the completed-toggle
  PATCH must not reset it.

#### Picker
- Search matches the **translated** label, not the raw value (e.g. in Portuguese "pint" finds
  "Pintura"). `ResourcePickerSearch` already filters on `name`.
- A search with no matches shows an empty result list; `Escape`/click-away keeps the current
  category.
- Opening the edit modal for another task starts with the picker closed, showing that task's
  category.
- Cancelling the edit modal discards the category change along with the other fields.

#### Create form
- If a create fails (e.g. empty title), every field keeps its value, category included, and the
  error is shown.
- "Keep the last category" lasts only while the page is open: a reload or another game's Tasks
  page starts at `other` again. Nothing is saved in `localStorage`.

#### Display
- A category the frontend doesn't know (e.g. the backend gained a category first) shows as the
  `other` label, not a raw translation key. Check the value against `TASK_CATEGORY_VALUES`;
  `CommonItemCategoryField`'s `category ?? 'other'` only covers a missing value, not an unknown
  one.

### Scope decisions
- The `SingleResourcePickerField` upgrade (constant mode, `picker` prop, `errors` prop,
  Escape/click-away cancel, updating the Collection modal caller) is part of this issue, not a
  separate one.
- Showing the category (a plain badge) in the list and in the detail modal is part of this issue.

### Out of scope
- Per-category colors or icons on the badge.
- Filtering or grouping tasks by category on the Tasks page: tracked in #1430.

## Benefits
- DMs can see what kind of work each task is from the list.
- Sets up filtering by category (#1430).
- `SingleResourcePickerField` gains a reusable fixed-list mode and Escape/click-away cancel,
  which the Collection modal gets too.
