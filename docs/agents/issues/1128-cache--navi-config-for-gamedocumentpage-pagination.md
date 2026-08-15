# Issue: Cache: navi config for GameDocumentPage pagination

## Problem
The new paginated `GameDocumentPage` read endpoints are a new API surface that the navi cache warmer doesn't know about yet:
- `GET games/<slug:game_slug>/documents/<int:document_id>/pages.json` — public (AllowAny), 404 if the parent document doesn't exist or is hidden
- `GET games/<slug:game_slug>/documents/<int:document_id>/pages/all.json` — dm/admin only (mirrors `check_game_edit`), returns pages even if the parent document is hidden, sets `X-Skip-Cache: true`

Both are paginated (query params `page`/`per_page`, response headers `page`/`pages`/`per_page`/`total`). Response item shape: `{"id": int, "content": string, "order": int}` — same shape for both endpoints.

The frontend's page-reader use case always requests `per_page=1&page=<N>` (one page's content plus the total page count via the `pages` header) — there is no unpaginated/full-list use case for this resource.

## Solution
Update `navi/resources/documents.yml` to add a `game_document_pages` / `paginated_game_document_pages` pair, following the naming and `paginated_actions`/pagination-header pattern already used for `game_documents`/`paginated_game_documents`:

- `game_document_pages` — nested under `game_document_details` via `actions` (inherited `parameters.slug`/`parameters.id`, same forwarding used for `game_document_files`/`game_document_photos`, since the parent detail response doesn't carry `game_slug`/`document_id`). Requests `pages.json` with `per_page=1` **explicitly set** (not the default page size), matching the frontend's actual per_page=1 page-reader access pattern. Declares `paginated_actions` to recurse over every page.
- `paginated_game_document_pages` — the per-page fetch triggered by `paginated_actions`, also with `per_page=1` explicitly forwarded on every subsequent page request (not just the first).
- Do **not** add a warmer entry for `pages/all.json` (the restricted/dm-admin variant). This matches the already-established convention in this file: restricted `_all`/`full` endpoints (`documents/all.json`, `documents/<id>/full.json`, `files/all.json`, `photos/all.json`) are never warmed today, since their `X-Skip-Cache: true` header makes Tent bypass the cache for them at request time regardless. The cache agent's job for `pages/all.json` is limited to the existing read-only verification that it sets `X-Skip-Cache` once the backend endpoint exists — not a warmer entry.
- Add an inline comment in `navi/resources/documents.yml` documenting this restricted-endpoint-exclusion convention explicitly (it's already followed in practice for `files`/`photos`/`documents` but was never written down in the file itself), so it's clear for future maintainers why `pages/all.json` — and its existing siblings — are intentionally absent.
