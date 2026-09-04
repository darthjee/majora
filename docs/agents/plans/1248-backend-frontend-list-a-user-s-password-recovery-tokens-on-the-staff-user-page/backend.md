# Backend Plan: Backend/Frontend — list a user's password recovery tokens on the staff user page

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md#shared-contracts) for the full endpoint response shape and model contract. This agent **produces** both: the `PasswordResetToken` schema (`expires_at` NOT NULL w/ default, `invalidated_at`, rewritten `is_valid()`, `HistoricalRecords`) and the `GET /staff/users/<id>/recovery-tokens.json` endpoint.

## Steps

- [01 — Model: expires_at / invalidated_at / is_valid() / HistoricalRecords](backend/01-model-and-issuance.md)
- [02 — Migrations (accounts + versioning)](backend/02-migrations.md)
- [03 — Serializer](backend/03-serializer.md)
- [04 — View and URL](backend/04-view-and-url.md)
- [05 — Tests](backend/05-tests.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_all` — `staff/` and `accounts/` tests both fall outside `games/tests/views/`, so both `pytest_views_rest`/`pytest_views_characters` are unaffected and `pytest_all` is the relevant job)
- `backend`: `docker-compose run --rm majora_app poetry run ruff check .` (CI job: `checks`)

## Notes

- `PasswordResetToken.objects.create(user=..., token=...)` is called directly (no `expires_at`) in several existing tests, notably `backend/staff/tests/staff_user_recovery_link_test.py`. Giving `expires_at` a model-level `default` (see Step 1) keeps every one of those green without editing them.
- Deploy ordering: migration before code (additive columns are safe for old code; new code before the columns exist would `OperationalError`). Already called out in the issue; no extra plan action needed, just don't reorder the migration/code within this PR's own review.
