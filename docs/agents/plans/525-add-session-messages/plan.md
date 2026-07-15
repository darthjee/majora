# Plan: Add session messages

Issue: [525-add-session-messages.md](../issues/525-add-session-messages.md)

## Overview

Depends on #528 landing first (`UserProfile.email_hash`, `Settings.gravatar_base_url()`,
`MyAccountDetailSerializer.avatar_url`). Backend adds a `GameSessionMessage` model (content,
session, user, nullable player) behind a new nested `GET`/`POST
/games/<game_slug>/sessions/<id>/messages.json` endpoint, gated by a new permission class
(view: player/DM/superuser/staff; create: player/DM only), paginated with a new
`NEXT-ENTRY-ID`-header, id-cursor style distinct from the existing numbered `Paginator`. A
new `GravatarUrlBuilder` class centralizes Gravatar URL construction, refactoring #528's
`MyAccountDetailSerializer` to use it too. Frontend adds a two-column messages section to
the bottom of the session page (`GameSessionHelper.jsx`): a message list fed by a new
reusable "load more" pagination component, and a small post-message form; posting reloads
the list from the top. Translator adds the new labels this section needs.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### `GET/POST /games/<game_slug>/sessions/<session_id>/messages.json` (backend produces, frontend consumes)

- `GET`, no `next-entry-id`: returns the most recent 20 messages, `id` descending.
- `GET ?next-entry-id=<id>`: returns messages with `id <= <id>` (that message and everything
  older), 20 at a time, still `id` descending. **The message with `id == next-entry-id` is
  intentionally repeated as the first item of this page** — the frontend must drop/dedupe it
  against what's already rendered (see `frontend.md`).
- Response header `NEXT-ENTRY-ID`: the `id` of the oldest message in the page just returned,
  or empty/absent when there are no older messages left to fetch.
- Response header `X-Skip-Cache: true` on `GET` (results depend on a cursor and change
  frequently) — matching this codebase's existing casing, not `X-SKIP-CACHE`.
- `POST` body: `{"content": "..."}`. Returns the created message (`201`) in the same shape
  as a list item.
- Per-message payload shape (exact field names/types):

```json
{
  "id": 1,
  "content": "message text",
  "user": { "name": "poster username", "avatar_url": "https://gravatar.com/avatar/<hash>" },
  "created_at": "2026-07-15T12:34:56Z"
}
```

  `user.avatar_url` is `null` when the poster has no `email_hash` (no email) — same
  null-handling as #528's `MyAccountDetailSerializer.avatar_url`.
- **View** access (`GET`): the requesting user must be a player of the session's game, that
  game's DM, a superuser, or staff (`is_staff`) — enforced both at the endpoint and hidden
  from the UI otherwise.
- **Create** access (`POST`): strictly a player of the session's game or that game's DM —
  no superuser/staff bypass.

### `GravatarUrlBuilder` (backend-internal, backend agent's own steps)

New class centralizing `Settings.gravatar_base_url() + email_hash` (null-safe). Both
`MyAccountDetailSerializer.get_avatar_url` (#528) and the new message-author serializer use
it — single source of truth, no duplicated URL-building logic. See `backend.md` Step 1.

### "Load more" pagination component (frontend-internal, frontend agent's own steps)

A new, reusable frontend component distinct from the existing numbered-page
`Pagination.jsx`, encapsulating the "Load more messages" button (visible only while a
cursor is available) and its loading state. See `frontend.md` for the exact component and
where session-messages state (accumulated list, current cursor, posting state) lives.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers the new session-messages view/permission tests
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers model, migration, serializer, and gravatar-builder tests
- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- **Hard dependency on #528**: `UserProfile.email_hash` and `Settings.gravatar_base_url()`
  must exist before this issue's backend work starts. If #528 hasn't merged yet when this
  is implemented, the migration number for `GameSessionMessage` depends on whatever #528's
  migration lands as.
- New endpoint with new visibility rules (who can see/post session messages) and a payload
  that intentionally exposes only a reduced view of the author (`name`/`avatar_url`, no
  email) — worth a `data-access`/`security` review pass, unlike #528 which touched no
  endpoint surface.
- The issue's literal endpoint paths (`/#/games/:game_slug/sessions/:id/messages`) describe
  the *frontend* hash route the feature lives under, not the backend REST path — the actual
  backend endpoint follows this codebase's existing `.json`-suffixed nested-resource
  convention instead (`/games/<slug>/sessions/<id>/messages.json`). No new frontend route is
  needed; messages render inside the existing `/#/games/:game_slug/sessions/:id` page.
- The issue didn't name the creation timestamp field; `created_at` (matching
  `PasswordResetToken.created_at`'s existing `auto_now_add=True` convention) was chosen —
  flag if a reviewer expects a different name.
