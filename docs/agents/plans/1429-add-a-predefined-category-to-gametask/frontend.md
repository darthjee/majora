# Frontend Plan: Add a predefined category to GameTask

Main plan: [plan.md](plan.md)

## Shared contracts

- Every task payload from the API includes `category` (string, one of the 10 values below).
- POST/PATCH bodies send `category` as the raw string. PATCH may omit it; the completed toggle
  (`handleToggleCompleted`, body `{completed}`) must keep omitting it.
- Errors come back as `fieldErrors.category = ['<code>']`, rendered with `FieldErrors`
  (`errors.<code>`).
- `TASK_CATEGORY_VALUES`, in this exact order: `printing`, `crafting`, `painting`, `planning`,
  `writing`, `research`, `scheduling`, `buying`, `updating`, `other`.
- i18n keys (provided by the translator): `game_task.category.<value>`,
  `game_tasks_page.new_category_label`, `game_tasks_page.new_category_search_placeholder`,
  `game_task_edit_modal.category_label`, `game_task_edit_modal.category_search_placeholder`.

## Steps

- [01 — Fixed-list mode, errors and cancel for SingleResourcePickerField](frontend/01-single-picker-constant-mode.md)
- [02 — Task category constant and badge display](frontend/02-category-constant-and-display.md)
- [03 — Category picker in the create form](frontend/03-create-form-picker.md)
- [04 — Category picker in the edit modal](frontend/04-edit-modal-picker.md)

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: Check JS Lint)
- `frontend`: `docker-compose run --rm majora_fe yarn test`
  (CI job: Tests)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: Check translations)

## Notes
- Step 01 changes a shared component; the Collection "new" modal is its only other caller and
  must keep working (it gets the Escape/click-away cancel too, which is intended).
- "Keep the last category" only lasts while the page is open: no `localStorage`.
