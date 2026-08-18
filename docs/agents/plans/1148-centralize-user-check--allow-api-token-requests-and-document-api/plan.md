# Plan: Centralize user check, allow api token requests and document api

Issue: [1148-centralize-user-check--allow-api-token-requests-and-document-api.md](../issues/1148-centralize-user-check--allow-api-token-requests-and-document-api.md)

## Overview

Preparatory work for a future STL-crawler client/agent. Three pieces:

1. Backend cleanup of redundant per-view auth decorators (owned by `backend` — see
   [backend.md](backend.md)).
2. New miniatures API documentation under `docs/guides/` (cross-cutting, owned directly here
   by `architect` since it lives outside any specialist's declared directory scope).
3. Scaffolding for a new `crawler` specialist agent + folder (also `architect`-owned, for the
   same reason).

There is no shared contract between the two owners: the backend cleanup doesn't change any
external behavior the docs or the crawler scaffolding depend on, and the crawler scaffolding
contains no code yet that calls the API. Each piece can be implemented independently.

## Context

`CookieTokenAuthentication` (`backend/accounts/authentication.py`) already tries the
`Authorization: Token <key>` header first, then falls back to the `auth_token` session
cookie, and is already the DRF-wide default (`REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']`
in `backend/majora_project/settings.py`). So the "allow api token requests" part of the issue
title is already true today — the real work is removing the ~110 files' worth of redundant
`@authentication_classes([CookieTokenAuthentication])` decorators that just restate that
default, documenting the miniatures API (including the token-header auth path) for the
crawler to consume later, and laying the groundwork (folder + agent definition) for the
crawler itself. See the issue file for full background and explicit scope boundaries
(notably: no actual crawling logic, no CI wiring for `crawler/`, and no new token-issuance
tooling — all deferred to a follow-up issue).

## Implementation Steps (architect-owned)

### Step 1 — Miniatures API documentation

Create `docs/guides/majora.md` as a hub page (mirroring the existing hub-plus-folder split
used by `docs/agents/architecture.md` + `docs/agents/architecture/*.md`), linking to a new
`docs/guides/majora/miniatures.md` page. Document, per endpoint (source: `backend/miniatures/urls/collections.py`,
`backend/miniatures/urls/sources.py`, `backend/miniatures/urls/stl_models.py`, and their
corresponding views/serializers under `backend/miniatures/views/` and
`backend/miniatures/serializers/`):

- `collections.json`, `collections/<id>.json`, `collections/<id>/photo_upload.json`
- `sources.json`, `sources/<id>.json`, `sources/<id>/photo_upload.json`
- `stl_models.json`, `stl_models/<id>.json`, `stl_models/<id>/photo_upload.json`

For each: HTTP method(s), request/response shape (read the serializer to get field names and
types right), required permissions, and the authentication requirement — explicitly document
both the `Authorization: Token <key>` header path and the session-cookie path, noting that a
token can be created today via the Django admin (`rest_framework.authtoken` is already
installed).

### Step 2 — Crawler scaffolding

- Create a new top-level `crawler/` folder (Node.js), matching the repo's existing package
  manager convention (Yarn, per `frontend/`). Minimal scaffold only: `package.json` (name,
  version, no dependencies yet) and a short `README.md` describing the folder's future
  purpose (an STL-site crawler that will create `Source`/`StlModel` links via the majora API,
  authenticating with an API token). No crawling logic, no dependencies, no CI/docker-compose
  wiring — that's explicitly deferred to the follow-up implementation issue.
- Create `.claude/agents/crawler.md`, following the existing pattern in
  `.claude/agents/proxy.md` and `.claude/agents/cache.md`: frontmatter with `name: crawler`,
  a `description` scoping it to the `crawler/` directory, and `tools: Read, Edit, Write,
  Bash`. Body should state its purpose (build/maintain the STL-site crawler client) and that
  it authenticates against the majora API via API token (not session cookie) — pointing at the
  new `docs/guides/majora/miniatures.md` for the API it will consume.
- Add a short note under `docs/agents/` (e.g. a new page, or a section in an existing
  cross-cutting doc if one is a better fit — use judgment) describing why the crawler agent
  exists and its relationship to the miniatures API.

## Files to Change

- `docs/guides/majora.md` — new hub page (create)
- `docs/guides/majora/miniatures.md` — new miniatures API reference (create)
- `crawler/package.json`, `crawler/README.md` — new scaffold (create)
- `.claude/agents/crawler.md` — new specialist agent definition (create)
- `docs/agents/*` — new note(s) about the crawler's purpose (create)

## Notes

- No CI Checks section for this part — none of these files are exercised by any existing
  CI job (`crawler/` intentionally has no CI wiring yet; docs aren't linted).
- See [backend.md](backend.md) for the auth-decorator cleanup, implemented independently.
