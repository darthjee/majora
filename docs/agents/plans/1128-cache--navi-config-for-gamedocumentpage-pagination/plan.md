# Plan: Cache: navi config for GameDocumentPage pagination

Issue: [1128-cache--navi-config-for-gamedocumentpage-pagination.md](../../issues/1128-cache--navi-config-for-gamedocumentpage-pagination.md)

## Overview

Add navi cache-warmer coverage for the new `GameDocumentPage` read endpoint
(`pages.json`) by adding a `game_document_pages` / `paginated_game_document_pages`
pair to `navi/resources/documents.yml`, nested under `game_document_details` the same
way `game_document_files`/`game_document_photos` already are. The restricted
`pages/all.json` variant is deliberately **not** added to the warmer — this matches
the file's existing (but previously undocumented) practice of never warming
`X-Skip-Cache: true` endpoints — and that practice gets written down explicitly for
the first time as an inline comment. `docs/agents/cache-warmer.md`'s `documents.yml`
description is updated to match.

## Context

- New backend surface (per #1125, sibling sub-issue):
  - `GET games/<slug:game_slug>/documents/<int:document_id>/pages.json` — public
    (`AllowAny`), 404 if the parent document doesn't exist or is hidden.
  - `GET games/<slug:game_slug>/documents/<int:document_id>/pages/all.json` —
    dm/admin only (`check_game_edit`), returns pages even if the parent document is
    hidden, sets `X-Skip-Cache: true`.
- Both paginated: query params `page`/`per_page`, response headers
  `page`/`pages`/`per_page`/`total`. Response item shape:
  `{"id": int, "content": string, "order": int}` — identical shape for both
  endpoints.
- The frontend's page-reader use case always requests `per_page=1&page=<N>` (one
  page's content plus the total page count via the `pages` header) — there is no
  unpaginated/full-list consumer of this resource.
- Existing precedent already read from `navi/resources/documents.yml`:
  - `game_documents` (outer, `paginated_actions`) → `paginated_game_documents`
    (per-page fetch) is the pattern to mirror for `pages`.
  - `game_document_files`/`game_document_photos` are nested under
    `game_document_details` via `actions`, forwarding `slug`/`id` through the
    inherited `parameters.*` namespace (`parameters.slug: parameters.slug`,
    `id: parameters.id`) — not `parsedBody.*` — because the document-detail response
    doesn't carry `game_slug`/`document_id` itself. `game_document_pages` needs the
    same forwarding.
  - The restricted siblings `files/all.json` and `photos/all.json` already exist in
    the backend (`backend/games/views/games/game_document_files_all.py`,
    `game_document_photos_all.py`) and both set `X-Skip-Cache: true` via
    `check_game_edit` — and neither appears anywhere in `documents.yml` today. Same
    for `documents/all.json` and `documents/<id>/full.json`. This confirms the
    "never warm restricted endpoints" rule (already stated in
    `.claude/agents/cache.md` and `docs/agents/cache-warmer.md`) is followed in
    practice, just not documented inline in the resource file itself.

## Implementation Steps

### Step 1 — Add `game_document_pages` / `paginated_game_document_pages` to `navi/resources/documents.yml`

- Add `game_document_pages` as a new `actions` entry under `game_document_details`,
  alongside the existing `game_document_files`/`game_document_photos`/
  `short_game_document_files`/`short_game_document_photos` entries, forwarding
  `slug: parameters.slug` / `id: parameters.id`.
- `game_document_pages`'s own `url` requests `pages.json` with `per_page=1`
  **explicitly set** in the query string (not left to the backend default), matching
  the frontend's actual per_page=1 page-reader access pattern.
- Declare `paginated_actions` on `game_document_pages` (mirroring `game_documents`'s
  `paginated_actions` block: `pages: headers['pages']`, `page_key: page`,
  `zero_indexed: false`, `parameters.per_page: headers['per_page']`) pointing at a
  new `paginated_game_document_pages` resource.
- `paginated_game_document_pages`'s `url` also carries `per_page=1` explicitly on
  every subsequent per-page request (not just the first) — do not let it default to
  the `per_page` header value's own number if that ever diverges from `1`; hardcode
  `per_page=1` the same way the first request does, per the issue's explicit
  clarification.
- Do **not** add any resource for `pages/all.json`.

### Step 2 — Document the restricted-endpoint-exclusion convention inline

Add an inline YAML comment in `navi/resources/documents.yml` — near the new
`game_document_pages` block, or near the top of the file if that reads better —
stating explicitly that restricted `_all`/`full` endpoints (`documents/all.json`,
`documents/<id>/full.json`, `files/all.json`, `photos/all.json`, and now
`pages/all.json`) are intentionally never warmed, since their `X-Skip-Cache: true`
response header makes Tent bypass the cache for them at request time regardless of
whether Navi warmed them. This makes explicit, for the first time in this file, a
convention that was previously only stated in `.claude/agents/cache.md` and
`docs/agents/cache-warmer.md`.

### Step 3 — Update `docs/agents/cache-warmer.md`

Update the `documents.yml` bullet in the "Configuration" section's file list to
mention the new `game_document_pages`/`paginated_game_document_pages` pair, matching
the style of the existing bullet (which already lists every resource name in the
file). Do not otherwise change this doc's rules — the restricted-endpoint-exclusion
rule it already documents is unchanged, just now also mirrored inline in
`documents.yml` itself per Step 2.

### Step 4 — Read-only X-Skip-Cache verification for `pages/all.json`

Once the backend `GameDocumentPage` endpoints exist (sibling sub-issue, may land
before or after this one), verify — read-only, no file edits — that the
`pages/all.json` view sets `response['X-Skip-Cache'] = 'true'`, the same way
`game_document_files_all.py`/`game_document_photos_all.py` already do. Report any
violation; do not fix it (fixing belongs to the `backend` agent). This step has no
file changes of its own — skip it entirely if the backend endpoint doesn't exist yet
when this plan is executed, and note that in the PR/handoff instead.

## Files to Change

- `navi/resources/documents.yml` — add `game_document_pages` and
  `paginated_game_document_pages` resources; add the restricted-endpoint-exclusion
  comment.
- `docs/agents/cache-warmer.md` — update the `documents.yml` bullet to list the new
  resource pair.

## CI Checks

- `navi/`: `docker-compose up majora_navi` (manual/local verification against
  `navi/navi_config.yaml`, per `docs/agents/cache-warmer.md`'s "Local testing"
  section — Navi has no standalone lint/validate command; the CI job that actually
  pushes/exercises this config in production is `warm-up-cache` in
  `.circleci/config.yml`, which is not practical to run locally).

## Notes

- This plan only covers `pages.json`. `pages/all.json` is explicitly out of scope
  for warming, by design (see Context/Step 2) — do not add it later without revisiting
  that decision.
- Step 4 is contingent on the backend sub-issue (`GameDocumentPage` model + read
  endpoints) having landed; if it hasn't, Steps 1–3 can still proceed independently
  since the URL/response shape is already finalized per #1125's decisions.
- No frontend, backend, or proxy changes are part of this plan — this is a
  cache-warmer-only issue.
