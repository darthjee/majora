# Backend Plan: Add a predefined category to GameTask

Main plan: [plan.md](plan.md)

## Shared contracts

- `Task.category`: `CharField`, not nullable, choices (in this order): `printing`, `crafting`,
  `painting`, `planning`, `writing`, `research`, `scheduling`, `buying`, `updating`, `other`;
  default `other`.
- Every task payload returned by the task endpoints includes `category`.
- POST without `category` → `other`. PATCH without `category` → unchanged.
- Invalid values → 400 `{"category": ["<code>"]}` using DRF's standard codes (`invalid_choice`,
  `null`, and whichever of `invalid_choice`/`blank` DRF uses for `""`). No custom codes.

## Implementation Steps

### Step 1 — Model field and migration
In `backend/games/models/task.py`, following `GameCommonItem.category`
(`backend/games/models/game/game_common_item.py`):
- Add `CATEGORY_PRINTING = 'printing'` … `CATEGORY_OTHER = 'other'` constants and a
  `CATEGORY_CHOICES` list in the order above (labels: Printing, Crafting, Painting, Planning,
  Writing, Research, Scheduling, Buying, Updating, Other).
- Add `category = models.CharField(max_length=16, choices=CATEGORY_CHOICES, default=CATEGORY_OTHER)`.
- Generate the migration (next after `0101_...`) through docker-compose
  (`docker-compose run --rm majora_tests python manage.py makemigrations games`, or the project's
  usual make target). An `AddField` with `default='other'` fills existing rows with `other`; no
  data migration needed.
- Tests in `backend/games/tests/models/task_test.py`: a new task defaults to `other`; a task can
  be saved with each category; `full_clean()` rejects a value outside the choices.

### Step 2 — Serializers and view tests
- `game_task_list.py`: add `'category'` to `fields` (this covers list, create and update
  responses, since they reuse this serializer).
- `game_task_create.py`: add `'category'` to `fields` with `extra_kwargs`
  `{'required': False}`. The model's `choices` give DRF a `ChoiceField`, which already rejects
  unknown values, and since the field isn't nullable, `null` too. Make sure `""` is rejected
  (not converted to `other`). If the generated field allows blank, set `allow_blank=False`.
- `game_task_update.py`: same as create (`required: False`); partial updates already leave it
  unchanged when omitted.
- Tests:
  - `backend/games/tests/serializers/games/tasks/game_task_list_test.py`: `category` is in the
    output.
  - `game_task_create_test.py`: omitted → `other`; valid value saved; `"cooking"`, `"Painting"`,
    `None`, `""` each invalid with a `category` error (assert the codes).
  - `game_task_update_test.py`: valid change saved; omitted → unchanged; invalid values rejected.
  - `backend/games/tests/views/game_tasks/game_tasks_list_test.py` and `game_task_detail_test.py`:
    list/detail responses include `category`; POST with/without category; PATCH
    `{completed: true}` keeps the existing category; PATCH with an invalid category → 400.

## Files to Change
- `backend/games/models/task.py`: constants, choices, `category` field.
- `backend/games/migrations/0102_task_category.py` (generated): add the column.
- `backend/games/serializers/games/tasks/game_task_list.py`: expose `category`.
- `backend/games/serializers/games/tasks/game_task_create.py`: accept and validate `category`.
- `backend/games/serializers/games/tasks/game_task_update.py`: accept and validate `category`.
- `backend/games/tests/models/task_test.py`: model tests.
- `backend/games/tests/serializers/games/tasks/*_test.py`: serializer tests.
- `backend/games/tests/views/game_tasks/*_test.py`: view tests.

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: Tests)
- `backend`: `poetry run ruff check .` and `bin/reports.sh ci` inside the backend container
  (CI jobs: Check python Lint, Check Python complexity)

## Notes
- Report back which DRF error code `""` produces (`blank` or `invalid_choice`) so the translator
  can confirm the `errors.*` entry exists.
- No Navi change: `navi/` has no task resources.
- Tasks are DM-only; the category follows the existing task permission rules (no new endpoint).
