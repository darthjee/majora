# Backend Plan: Statistics bug fix: backend session tracking fix

Main plan: [plan.md](plan.md)

## Shared contracts

What this agent produces (see [plan.md](plan.md#shared-contracts) for the full list):

- Unresolved routes: no session, no visit, no cookie.
- A valid cookie reuses its session across IP changes; no `ip_changed` for it.
- `_backfill_user` attaches in place; `login_rotation` only for a session tied to a different
  user (or vanished).
- `Visit.first_ip` / `Visit.last_ip` (nullable); staff visit list rows return `first_ip`,
  `last_ip` and a kept `ip` (`last_ip`, falling back to `session.ip`); export visits return
  `first_ip`, `last_ip`.

## Steps

- [01 — Skip unresolved routes](backend/01-skip-unresolved-routes.md)
- [02 — Reuse the session across IP changes and record visit IPs](backend/02-reuse-session-across-ip-changes.md)
- [03 — Attach the user in place in the middleware](backend/03-attach-user-in-place.md)
- [04 — Staff visit list and export return the visit IPs](backend/04-staff-serializers.md)
- [05 — Docs](backend/05-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest statistics staff accounts`
  (CI jobs: the backend `pytest` jobs), then the full `docker-compose run --rm majora_tests pytest`.
- `backend`: `docker-compose run --rm majora_tests ruff check .` (line length 100).

## Notes

- Regression tests listed in the issue must fail on `main` and pass after the change; write
  them first in each step.
- Existing tests asserting `ip_changed` for a valid cookie or the always-rotate behaviour of
  the middleware are updated to the new rules, not deleted.
- No query is added per request: the `Session.ip` write only happens when the IP differs (it
  can share the `_touch_session` `UPDATE`), `Visit.last_ip` rides in the existing extend
  `UPDATE`, and unresolved routes skip the domain and session queries.
- The same-user reuse after a lost in-place `UPDATE` must re-read the row (`user_id`), never
  trust the stale in-memory `user_id = None` (security review).
- Re-confirm, while reviewing, that Tent's `FileCacheMiddleware` still strips `Set-Cookie`
  (`excluded_headers`, not overridden in `proxy/prod_configuration/`): with the IP check gone a
  replayed cookie would merge visitors. Read only; report if it changed.
- `security` and `data-access` review the PR (session/visibility logic, new serializer fields).
- Public repository: test IPs come from the RFC 5737 documentation ranges.
