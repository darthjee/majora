# Backend Plan: Register GameCommonItem in the Django admin

Main plan: [plan.md](plan.md)

## Overview
Register `GameCommonItem` and `GameCommonItemPhoto` in `backend/games/admin.py` with plain `admin.site.register` calls.
Also add their `django-simple-history` models to `HISTORICAL_MODELS` in `backend/versioning/admin.py`, where they get
the existing `ReadOnlyHistoricalRecordAdmin`. This gives superusers the admin-only deletion path that
`docs/agents/access-control/game-common-item.md` and `docs/agents/specs/recipes/deletion.md` already describe.

## Context
- `GameCommonItem` is not registered anywhere in the admin today, so a common item cannot be deleted at all.
- Cascade chain (all `on_delete=CASCADE`):
  - `GameRecipe.common_item` → `GameCommonItem`, `related_name='recipes'`
  - `CharacterRecipe.recipe` → `GameRecipe`
  - `GameCommonItemPhoto.game_common_item` → `GameCommonItem`, `related_name='photos'`

  Django's admin delete-confirmation page lists these rows automatically.
- `GameCommonItemPhoto` extends `BasePhoto`, which declares
  `history = HistoricalRecords(app='versioning', inherit=True)`. `GameCommonItem` declares its own `history`, created
  in versioning migration `0034`. Both historical models already exist; they are only missing from the admin.
- Registering existing models in the admin requires no migrations.

## Implementation Steps

### Step 1 — Register the models in the admin
- `backend/games/admin.py`: add `GameCommonItem` and `GameCommonItemPhoto` to the `.models` import, keeping it
  alphabetical. Add `admin.site.register(GameCommonItem)` and `admin.site.register(GameCommonItemPhoto)` next to the
  other `Game*` registrations, e.g. right after `admin.site.register(GameItem)`. No custom `ModelAdmin`.
- `backend/versioning/admin.py`: add `GameCommonItem` and `GameCommonItemPhoto` to the `games.models` import and add
  `GameCommonItem.history.model` and `GameCommonItemPhoto.history.model` to `HISTORICAL_MODELS`, keeping it
  alphabetical.

### Step 2 — Admin tests
There are no existing admin-view tests, so add new files following the project's pytest style: class-based,
`@pytest.mark.django_db`, docstrings on the module, classes and tests.

`backend/games/tests/admin_test.py`, as a superuser logged in via `client.force_login`:
- `GET reverse('admin:games_gamecommonitem_changelist')` returns 200.
- `GET reverse('admin:games_gamecommonitem_delete', args=[item.pk])` returns 200 when the item has a `GameRecipe`
  (via `GameRecipeFactory(common_item=item)`, or a `CharacterRecipeFactory` chain). The response body lists the
  dependent recipe, e.g. its `str()` or its `GameRecipe` verbose name.
- `POST` to the same delete URL with `{'post': 'yes'}` deletes the item and cascades to its `GameRecipe` and
  `CharacterRecipe` rows.
- `GET reverse('admin:games_gamecommonitemphoto_changelist')` returns 200.
- A non-superuser, non-staff user gets a redirect to the admin login page for the changelist.

`backend/versioning/tests/admin_test.py`, as a superuser:
- `GET reverse('admin:versioning_historicalgamecommonitem_changelist')` returns 200.
- `GET reverse('admin:versioning_historicalgamecommonitemphoto_changelist')` returns 200.

`GameCommonItemPhoto` has no factory. Changelist tests don't need a photo row; if one is useful, create it inline
the same way `backend/games/tests/views/games/game_common_item_photo_upload_test.py` does.

## Files to Change
- `backend/games/admin.py` — register `GameCommonItem` and `GameCommonItemPhoto`.
- `backend/versioning/admin.py` — add both historical models to `HISTORICAL_MODELS`.
- `backend/games/tests/admin_test.py` (new) — changelist, delete-confirmation and cascade tests.
- `backend/versioning/tests/admin_test.py` (new) — historical changelist tests.

## CI Checks
- `backend`: `poetry run pytest --ignore=games/tests/views/` inside `make tests` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes
- Confirm the exact historical admin URL names with `GameCommonItem.history.model._meta.model_name`. The expected
  names are `historicalgamecommonitem` and `historicalgamecommonitemphoto`.
- Out of scope: any delete API endpoint, `GameRecipe` admin (already registered by #1445), and the other unregistered
  photo models (`GameItemPhoto`, `TreasurePhoto`, `CharacterItemPhoto`).
- No Navi, frontend or proxy impact. The access-control docs already say deletion is admin-only.
