# Issue: Statistics bug: store creation path, reason and logged state on sessions and visits (backend)

## Description

Part of Epic #1696 (statistics session investigation). Store, for each statistics `Session` and
`Visit`, where and why it was created, so the investigation can read the cause of every new
session directly. Contract in `docs/agents/specs/statistics-bug/` (specs sub-issue #1711).

## Solution

- **Migration** (nullable columns, no backfill; existing rows stay `NULL` = unknown):
  - `Session.first_path` (`CharField(255)`, null), `Session.first_seen_logged` (boolean, null),
    `Session.creation_reason` (`CharField` with choices, null).
  - `Visit.first_path`, `Visit.last_path` (`CharField(255)`, null).
- **Paths:** the path columns store the **route pattern**, never the raw path:
  `resolve(request.path_info).route` (e.g. `games/<slug:game_slug>/documents/<int:id>.json`),
  so no URL parameter, token or secret is ever stored — the device-authorization routes carry
  the request `uuid` (the poll secret) in the path. A path matching no route (404, bots) stores
  the fixed marker `unresolved`. Never the query string; max 255 characters. Resolution is
  in-memory URL matching before the view runs (no database query). Untracked paths and
  skip-header requests are never stored (they are not tracked at all).
- **`creation_reason`**, set in `StatisticsSessionMiddleware` / `attach_user`:
  - `no_cookie` — no statistics cookie;
  - `invalid_cookie` — the cookie fails to unsign;
  - `cookie_session_not_found` — valid token but no matching row (deleted, cleared);
  - `domain_changed` — the token's session exists for another domain;
  - `ip_changed` — the cookie's session exists for the same domain but the IP differs;
  - `login_rotation` — `attach_user` created a new row (always-rotate or lost in-place race).
- **Precedence:** when both the domain and the IP differ, the reason is `domain_changed`.
- **Telling `domain_changed` apart without an extra query:** `Session.token` is unique, so
  `_session_from_cookie` looks the session up by token only (still one query, replacing today's
  token + domain lookup) and the reason is derived by comparing domain, then IP. The reuse
  check already compares `domain_id` and `ip`, so **which sessions are reused or created does
  not change** — this Epic does not fix the bug.
- **`first_seen_logged`** means "logged at creation", not "logged ever":
  - session created for an authenticated request → `true`;
  - session created anonymous → `false`; if the same request then attaches a user in place
    (middleware back-fill, login view, device-authorization poll), the attach `UPDATE` also
    sets `first_seen_logged = true` in the same statement (no extra query). `attach_user`
    gets a flag for this, set only when the session was created during the current request;
  - an in-place attach to an anonymous session from an earlier request leaves it `false`;
  - `login_rotation` session → `true`.
- **Login rotation rows:** `first_path` is the route of the request that rotated (login,
  device-authorization poll, or any authenticated request through the middleware back-fill);
  as today, the rotated session gets no visit until the next request carrying its cookie.
- **Visit paths:** `first_path` and `last_path` set when a visit opens; `last_path` updated in
  the same atomic `UPDATE` that already does `hits = hits + 1` — no extra query per request.
- **Hot path:** no additional query per request; document it.
- **Docs:** statistics docs under `docs/agents/` describing the columns (permanent docs never
  link into the temporary specs).

## Depends on

#1711 (specs for the tracking columns).

## Out of scope

Returning the columns in the API (#1713); UI (#1714); any change to session reuse/rotation
behaviour.

## Testing

Backend tests for each `creation_reason`, including domain + IP both changed →
`domain_changed`; the cookie lookup still issues a single query; `first_seen_logged` for
anonymous, logged-in at creation, in-place attach in the creating request (middleware, login
view, poll), in-place attach to an earlier anonymous session (stays `false`) and rotation;
`first_path` stores the route pattern (no URL parameter: a device-authorization poll stores no
`uuid`), `unresolved` for a 404, no query string, truncation; rotated session `first_path` is
the rotating request's route; visit `first_path`/`last_path` on open and extend (concurrent
extends still lose no hit); untracked/skip requests store nothing; existing reuse/rotation
tests unchanged.

## Responsible agents

backend; data-access and security (review)
