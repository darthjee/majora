# Backend Plan: Backend — clamp password reset token expiration to [1, 1440] minutes

Main plan: [plan.md](plan.md)

## Steps

- [01 — Clamp the expiration setting](backend/01-clamp-expiration-setting.md)
- [02 — Add boundary test coverage](backend/02-add-boundary-tests.md)
- [03 — Document the range in .env.dev.sample](backend/03-document-env-range.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/settings_test.py` (CI job: `pytest_all`)

## Notes

- Numeric bounds (`[1, 1440]`) come from the parent tracking issue #1244 — not re-litigated here.
- Clamping is silent (no log/warning) — out-of-range values are pulled to the nearest bound, never reset to the default of 30. This matches `env_int`'s existing "never raise, degrade gracefully" philosophy.
- Decimal-looking or otherwise non-numeric env values never reach the clamp — they resolve via `env_int`'s existing default fallback first.
