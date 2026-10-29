# Backend Plan: Statistics bug: store creation path, reason and logged state on sessions and visits (backend)

Main plan: [plan.md](plan.md)

## Overview

Store where and why each statistics session/visit was created, so the #1696 investigation can
read the cause of every new session directly. Contract in
`docs/agents/specs/statistics-bug/tracking-columns.md` (written by #1711).

## Context

- `StatisticsSessionMiddleware` (`backend/statistics/middleware.py`) loads the cookie session
  with `Session.objects.filter(token=token, domain=domain)`, reuses it only when IP and domain
  match, otherwise creates a new row. `Session.token` is `unique=True`.
- `attach_user` (`backend/statistics/session_attachment.py`) attaches in place or rotates. It
  is called by the middleware back-fill (`always_rotate` for sessions that existed before the
  request) and by `accounts.views.auth._shared.attach_statistics_session` (login view and
  device-authorization poll).
- `track_visit` (`backend/statistics/visit_tracking.py`) opens a visit or extends the latest
  one with an atomic `hits = hits + 1` `UPDATE`.
- Decisions: path columns store the route pattern (`resolve(path_info).route`, `unresolved`
  when no route matches, max 255, never the query string); both domain and IP changed →
  `domain_changed`; `first_seen_logged` means "logged at creation"; rotation rows store the
  rotating request's route and `first_seen_logged = true`.

## Steps

- [01 — Migration and model fields](backend/01-migration-and-model-fields.md)
- [02 — Route pattern helper](backend/02-route-pattern-helper.md)
- [03 — Creation reason and first path in the middleware](backend/03-middleware-creation-reason.md)
- [04 — Logged state and rotation in attach_user](backend/04-attach-user-logged-state.md)
- [05 — Visit paths and docs](backend/05-visit-paths-and-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_all`,
  `pytest_views_rest`, `pytest_views_characters`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)
- docs: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes

- The hot path must not gain a query: verify with `django_assert_num_queries` on the
  reuse, create and extend paths.
- Never store a raw path, query string, token or secret (the device-authorization routes carry
  the poll `uuid` in the path); the repo is public — tests use fake values only.
- Request `data-access` and `security` reviews of the diff (no new endpoint, but new stored
  request data and a changed cookie lookup).
- Existing reuse/rotation tests must pass unchanged.
- The API (#1713) and UI (#1714) are out of scope.
