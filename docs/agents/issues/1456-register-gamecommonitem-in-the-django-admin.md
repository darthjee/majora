# Issue: Register GameCommonItem in the Django admin

## Description
Part of #1441 (crafting recipes). While planning #1445, we found that `GameCommonItem` is **not registered** in the Django admin (`backend/games/admin.py`). The docs say its deletion is admin-only: `docs/agents/access-control/game-common-item.md` ("Django-admin-only for superusers") and `docs/agents/specs/recipes/deletion.md`.

## Problem
- There is currently no way to delete a `GameCommonItem`: no API endpoint and no admin entry.
- Deleting a common item cascades to the `GameRecipe` rows that produce it, and from there to their `CharacterRecipe` rows. The spec expects the admin delete-confirmation page to list these, but that page cannot be reached today.
- `GameCommonItemPhoto` is not registered in the admin either.
- `HistoricalGameCommonItem` and `HistoricalGameCommonItemPhoto` (from `django-simple-history`) are missing from the read-only history admin in `backend/versioning/admin.py`, so their change history cannot be inspected.

## Expected Behavior
- A superuser can list, view, edit and delete `GameCommonItem` rows in the Django admin. The delete-confirmation page lists the cascaded `GameRecipe` / `CharacterRecipe` / `GameCommonItemPhoto` rows.
- A superuser can manage `GameCommonItemPhoto` rows in the Django admin.
- Historical records for both models show up as read-only entries under the versioning admin.

## Solution
Backend only:
- In `backend/games/admin.py`, import `GameCommonItem` and `GameCommonItemPhoto` and register each with a plain `admin.site.register(...)`, matching the sibling models. No custom `ModelAdmin`.
- In `backend/versioning/admin.py`, import both models and add `GameCommonItem.history.model` and `GameCommonItemPhoto.history.model` to `HISTORICAL_MODELS`. They then get `ReadOnlyHistoricalRecordAdmin`.
- Tests, as a superuser:
  - the `GameCommonItem` admin changelist and delete-confirmation views return 200, and the delete-confirmation page lists a dependent `GameRecipe`;
  - the `GameCommonItemPhoto` changelist returns 200;
  - both historical changelists return 200.

### Out of scope
- Any delete API endpoint.
- `GameRecipe` admin registration, which is done in #1445.
- Registering the other unregistered photo models (`GameItemPhoto`, `TreasurePhoto`, `CharacterItemPhoto`).

## Benefits
- Gives superusers the admin-only deletion path the access-control and recipe-deletion docs already describe.
- Superusers can see the full cascade before they delete a common item that recipes depend on.
- Common items and their photos become auditable through the existing history admin.
