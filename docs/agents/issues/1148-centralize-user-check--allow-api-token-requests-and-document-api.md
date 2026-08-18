# Issue: Centralize user check, allow api token requests and document api

## Description

This is preparatory work for a future STL-crawler client/agent: instead of manually creating
`Source`/`StlModel` links through the application, the plan is to build a crawler that
inspects STL sites (sources) and creates those links automatically. That crawler will need to
authenticate against the API via a token rather than a browser session cookie, which is why
centralizing user resolution (with a documented, reliable API-token path), documenting the
miniatures API, and scaffolding the future crawler agent all matter now.

## Problem

- User authentication is duplicated: ~150+ individual view functions redundantly redeclare
  `@authentication_classes([CookieTokenAuthentication])` even though it's already the
  DRF-wide default (`REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']` in
  `backend/majora_project/settings.py`). "Require authenticated user" checks are also
  duplicated across separate helpers (`backend/games/views/common.py:36`
  `require_authenticated`, `backend/permissions/endpoint.py:36`
  `EndpointPermission._unauthenticated_response`,
  `backend/games/serializers/_request_context_mixin.py:17`), and
  `backend/accounts/views/auth/status.py:30` manually instantiates `TokenAuthentication()`
  instead of using the standard path.
- There is no documentation of the API for external/automated consumers (e.g. the future
  crawler) — `docs/guides/` doesn't exist yet.
- There's no scaffolding yet for the crawler client/agent that will consume the API.

## Solution

### Centralized user authentication

`CookieTokenAuthentication` (`backend/accounts/authentication.py`) already implements the
needed behavior: it tries the `Authorization: Token <key>` header first
(`_authenticate_via_header`), then falls back to the `auth_token` session cookie
(`_authenticate_via_session`). It's already the DRF-wide default, so the API-token fallback
itself is not new work.

"Centralize" here means cleanup, not new auth logic:

- Remove the ~150+ redundant `@authentication_classes([CookieTokenAuthentication])`
  decorators scattered across individual view functions (e.g.
  `backend/games/views/games/game_detail.py:16`,
  `backend/miniatures/views/stl_model_photo_upload.py:19`,
  `backend/uploads/views.py:33`, `backend/staff/views/staff_users_list.py:19`) — they
  just restate the already-global default.
- Look at consolidating the duplicated "require authenticated user" checks listed in
  Problem above into a single shared path, if that doesn't conflict with their current call
  sites.
- Replace the ad-hoc manual `TokenAuthentication()` instantiation in
  `backend/accounts/views/auth/status.py:30` with the standard path.

**Edge case:** three views deliberately opt out of authentication with
`@authentication_classes([])` — `backend/accounts/views/auth/status.py`,
`backend/games/views/access_route_config.py`, `backend/games/views/ready.py` (public,
unauthenticated endpoints). The cleanup must only remove decorators that literally match the
global default (`[CookieTokenAuthentication]`); these three must be left untouched since they
intentionally differ from it. No views were found using any other authentication class, so
there's no risk of silently changing behavior elsewhere.

### API documentation

New `docs/guides/majora.md` (hub) + `docs/guides/majora/*.md` (per-topic pages), following
the same hub-plus-folder split already used for `docs/agents/architecture.md` +
`docs/agents/architecture/*.md`. For now, document only the miniatures API: `collections`,
`sources`, and `stl_models` endpoints (`backend/miniatures/urls/*.py`,
`backend/miniatures/views/*.py`, `backend/miniatures/serializers/*.py`) — request/response
shapes, auth requirements (including the token-header path), and permissions.

### Crawler scaffolding

Preparation for the future STL-crawler, scoped to scaffolding only — no crawling logic in
this issue:

- New top-level `crawler/` folder, Node.js.
- New `.claude/agents/crawler.md` specialist definition (following the existing pattern in
  `.claude/agents/proxy.md`/`cache.md`), scoped to `crawler/`, documenting its purpose and
  that it authenticates against the majora API via API token (not session cookie).
- New notes under `docs/agents/` describing the crawler's purpose and architecture (why it
  exists — automating `Source`/`StlModel` link creation instead of manual entry through the
  app).
- Actual crawling implementation (visiting STL sites, parsing, creating links via the API) is
  out of scope for this issue — a follow-up issue owned by the new crawler agent.
- No CI/dev tooling wiring (docker-compose service, CircleCI job) in this issue — there's no
  code to lint/test yet against a bare scaffold. That's added in the follow-up implementation
  issue alongside the actual crawler code.

### Token issuance

The crawler authenticates using a standard DRF authtoken (`rest_framework.authtoken`, already
installed). Creating/rotating the crawler's service-account token is already possible via the
Django admin today — no new tooling needed in this issue. The API documentation should note
this as the expected way to obtain a token.

### Scope

Kept as a single issue — the pieces above are small and all directly prepare for the crawler,
so splitting into separate GitHub issues wasn't worth the overhead. Expected to be
planned/implemented across the `backend` and `architect` agents as needed.

**Explicitly out of scope:**
- Any actual crawler implementation (visiting STL sites, parsing pages, creating
  `Source`/`StlModel` links) — a separate future issue, owned by the new crawler agent once
  it exists.
- CI/dev tooling for `crawler/` (docker-compose service, CircleCI job) — added alongside the
  actual crawler code in the follow-up issue.
- Any dedicated tooling for issuing API tokens — Django admin already covers it.
- Documenting APIs other than miniatures (`docs/guides/majora/*.md` grows incrementally in
  future issues).

### Testing strategy

No new tests expected. The decorator cleanup shouldn't change behavior (it only removes
decorators that literally match the already-global default), so the existing backend test
suite is the safety net — running it in full should catch any view where the decorator
wasn't actually redundant. Docs and crawler scaffolding are non-functional and need no tests.

## Benefits

- Removes ~150+ lines of redundant decorator duplication, making the actual (already
  centralized) auth behavior easier to find and reason about.
- Gives the miniatures API documented, reliable request/response and auth semantics for
  external/automated consumers.
- Lays the groundwork (agent + folder scaffolding) for automating `Source`/`StlModel` link
  creation via a future crawler, removing manual data entry.
