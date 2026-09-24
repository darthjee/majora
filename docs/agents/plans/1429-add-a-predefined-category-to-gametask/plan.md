# Plan: Add a predefined category to GameTask

Issue: [1429-add-a-predefined-category-to-gametask.md](../../issues/1429-add-a-predefined-category-to-gametask.md)

## Overview
Add a required `category` to game tasks (`Task`), chosen from 10 fixed values, with `other` as
the default and the value given to existing rows. The backend adds the field, migration and
serializer support. The frontend adds a type-to-filter category picker as the first field of
the create form and the edit modal, by giving `SingleResourcePickerField` the fixed-list mode
`MultiResourcePickerField` already has plus Escape/click-away cancel. It also shows the category
as a badge in the list and in the detail modal. The translator adds the en/pt labels.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### API: `category` on game tasks
- Endpoints: `GET/POST /games/<game_slug>/tasks` and `GET/PATCH /games/<game_slug>/tasks/<id>`
  (the existing task endpoints, `backend/games/urls/games.py`).
- Field `category`: string, **not nullable**, one of, in this order:
  `printing`, `crafting`, `painting`, `planning`, `writing`, `research`, `scheduling`, `buying`,
  `updating`, `other`.
- Responses: every task payload (list, create response, update response) includes `category`
  (via `GameTaskListSerializer`).
- POST: `category` optional; omitted → `other`.
- PATCH: `category` optional; omitted → unchanged (the view already uses `partial=True`).
- Validation errors: 400 with `{"category": ["<code>"]}`. Codes: `invalid_choice` for a value
  not on the list (exact, case-sensitive match), `null` for `null`, `invalid_choice` or `blank`
  for `""`. The backend decides which one `""` produces and the translator makes sure every code
  used has an `errors.<code>` entry.

### Frontend constant
- `TASK_CATEGORY_VALUES` (frontend) mirrors the backend `Task.CATEGORY_CHOICES` exactly, in the
  same order.

### i18n keys (produced by translator, consumed by frontend)
- `game_task.category.<value>` for all 10 values, in a new `game_task` namespace inside
  `en/common.yaml` and `pt/common.yaml`, with `'game_task'` added to `commonNamespaces` in both
  `index.js` files.
- `game_tasks_page.new_category_label`, `game_tasks_page.new_category_search_placeholder`.
- `game_task_edit_modal.category_label`, `game_task_edit_modal.category_search_placeholder`.
- `errors.invalid_choice` (already exists), plus `errors.null` / `errors.blank` if missing.
