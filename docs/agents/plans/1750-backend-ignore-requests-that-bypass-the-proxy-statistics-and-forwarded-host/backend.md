# Backend Plan: Backend: ignore requests that bypass the proxy (statistics and forwarded host)

Main plan: [plan.md](plan.md)

## Shared contracts

- Produces `request.via_proxy` (bool) on every request, set by the first middleware.
- Trusted means `PROXY_SECRET` is empty, or `X-Proxy-Secret` matches it (constant-time).
- Untrusted: `HTTP_X_FORWARDED_HOST` is deleted from `request.META`; statistics are skipped.
- `PROXY_ENFORCE=true` (case-insensitive) with a non-empty `PROXY_SECRET` returns
  `403 {"detail": "Forbidden"}` with `Cache-Control: no-store` for untrusted requests,
  except the exact path `/ready.json`. No per-request logging.
- `PROXY_SECRET` stays a single value.

## Steps

- [01 — Shared proxy-trust helper](backend/01-proxy-trust-helper.md)
- [02 — Proxy-trust middleware and settings](backend/02-proxy-trust-middleware.md)
- [03 — Statistics skip untrusted requests](backend/03-statistics-skip-untrusted.md)
- [04 — Docs under docs/agents](backend/04-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` and
  `docker-compose run --rm majora_tests ruff check .` (CI jobs: `pytest_views_characters`,
  `pytest_views_rest`, `pytest_all`, `checks`)

## Notes

- `.env.dev.sample` sets `PROXY_SECRET=dev-proxy-secret`, and `majora_tests` loads `.env`.
  Without isolation, every test request on a developer machine would be untrusted, which
  breaks statistics and `X-Forwarded-Host` tests. Step 01 adds an autouse fixture that clears
  `PROXY_SECRET`/`PROXY_ENFORCE`; tests that need them set them explicitly (as the existing
  ones already do).
- Locally, direct calls to `majora_app` (`localhost:3030`) become untrusted because the dev
  `.env` has a secret. That's intended: statistics skip them and `X-Forwarded-Host` is ignored.
- `via_proxy` must never be used to grant or deny access to a resource, apart from the
  enforcement 403. Authentication and token scopes are untouched.
- Request the `security` and `data-access` reviews on the PR (domain visibility, CSRF).
