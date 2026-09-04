# Backend Plan: Backend/Frontend — staff recovery token management actions (unexpire / force-expire / delete)

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the three endpoints in the "New backend endpoints" table in [plan.md](plan.md)'s
"Shared contracts" section — `frontend` depends on the exact paths, URL names, effects, and
response bodies specified there.
Never log the raw `token` value in any of the three views — only `pk`, target `user_id`, action
name, and the acting staff user's id.

## Steps

- [01 — Add the `unexpire` endpoint](backend/01-add-unexpire-endpoint.md)
- [02 — Add the `force-expire` endpoint](backend/02-add-force-expire-endpoint.md)
- [03 — Add the `delete` endpoint](backend/03-add-delete-endpoint.md)

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- All three views follow `backend/staff/views/staff_user_recovery_link.py`'s exact shape
  (`@restricted` + `@api_view([...])` + `@permission_classes([AllowAny])` + inline
  `require_staff(request)` first, `get_object_or_404` second) — no new permission plumbing needed.
- `@restricted` already sets `X-Skip-Cache: true` unconditionally (see
  `backend/games/decorators.py`), so no extra header handling is required for the cache reviewer's
  concern.
- `Settings.password_reset_token_expiration_minutes()` (from `games.settings`) is the same helper
  `PasswordResetToken._default_expires_at()` already uses — reuse it directly for `unexpire`'s
  `expires_at` recomputation rather than duplicating the minutes lookup.
- `HistoricalRecords` (already on `PasswordResetToken`, see `backend/accounts/models/password_reset_token.py`)
  captures the update/delete trail automatically; no per-view audit-table code needed beyond the
  `pk`/`user_id`/action/staff-id log line noted above.
