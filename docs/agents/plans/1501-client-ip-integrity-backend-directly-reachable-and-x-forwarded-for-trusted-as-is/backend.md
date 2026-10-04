# Backend Plan: Client IP integrity: backend directly reachable and X-Forwarded-For trusted as-is

Main plan: [plan.md](plan.md)

## Shared contracts

- Read `PROXY_SECRET` from the environment; `''` means disabled.
- Trust `X-Forwarded-For` only when `HTTP_X_PROXY_SECRET` matches, compared with `secrets.compare_digest`.
- When trusted, use the leftmost comma-separated entry, stripped and validated as an IP. Otherwise, or when that entry is invalid, use `REMOTE_ADDR`.
- Never reject a request because of a missing or wrong secret.

## Steps

- [01 — Add a trusted client-IP resolver](backend/01-client-ip-resolver.md)
- [02 — Use it in the statistics middleware](backend/02-statistics-middleware.md)
- [03 — Correct the docs](backend/03-docs.md)

## CI Checks
- `backend`: tests and lint through the backend docker-compose/make targets in `AGENTS.md` (CI jobs in `.circleci/config.yml`).

## Notes
- **Related gap, out of scope:** `USE_X_FORWARDED_HOST = True` and the domain gate (`docs/agents/access-control/game.md`) trust `X-Forwarded-Host`. With Django publicly reachable, a direct caller can spoof it and bypass domain-scoped game visibility. The same `X-Proxy-Secret` gate could cover it, but that is a separate security change. Record it in the docs and raise it as a follow-up issue.
- Direct callers that bypass Tent are recorded with `REMOTE_ADDR`. On Render that is likely Render's proxy IP, so they collapse into one IP. That is acceptable: the value is no longer client-chosen.
- Rollout order: until `PROXY_SECRET` is set on both sides in prod, every request falls back to `REMOTE_ADDR` and statistics lose real client IPs. Deploy with both values configured.
