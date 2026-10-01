# Issue: Response-driven proxy cache invalidation (X-Cache-Clear header)

## Description
The proxy's cache-cleanup map (`proxy/extension/lib/configuration/cache_cleanup/*.php`, flattened by `CacheCleanupMapBuilder` and consumed by Tent's `CacheCleanupMiddleware` on the `backend.php` rule) is route-param driven: a mutating request on a trigger route clears target paths interpolated from **that same route's** params (e.g. `:game_slug`, `:faction_id`), and it runs in `processRequest`, before the backend is called.

Add **response-driven cache invalidation**: the backend attaches an `X-Cache-Clear` response header listing the cache paths to clear, and the proxy clears them after the backend responds, then strips the header so it never reaches the client.

## Problem
Mutations whose route does not carry the owning entity's params cannot express which entity caches to clear. The first case is the staff photo management from #1468:

- `POST /staff/photos/<photo_type>/<photo_id>/replace.json` followed by the upload finalize `PATCH /uploads/image/<id>.json` — when the file extension changes, `photo.path` changes.
- Staff photo **delete** — the `*Photo` row is removed and the owner's `photo` FK becomes `NULL`.

In both cases cached entity JSON (e.g. `/games/foo/factions.json`, `/games/foo/factions/3.json`) keeps pointing at a file that no longer exists (broken image) until the cache TTL expires (up to 1h for anonymous viewers).

Note: the finalize `PATCH` and the delete's backend calls are issued **by the proxy's own handlers** (`UploadHandler`, `DeleteHandler`, through `BackendClient`), not through the `backend.php` `default_proxy` rule — so a middleware on that rule would never see these responses.

## Expected Behavior
- After a staff photo replace that changes the file extension, or a staff photo delete, the owning entity's cached JSON (entity + collection paths) is cleared immediately; the next read hits the backend and returns the correct photo URL (or no photo).
- `X-Cache-Clear` never reaches the client.
- A client-supplied `X-Cache-Clear` request header has no effect.
- Paths outside the cache folder can never be deleted (no path traversal).

## Solution

### Header

- Name: `X-Cache-Clear`.
- Format: comma-separated list of **fully resolved, literal** cache paths (no placeholders), e.g. `X-Cache-Clear: /games/foo/factions.json, /games/foo/factions/3.json`. Entries are trimmed; empty entries are ignored.

### Backend (source of truth)

- Each `PhotoType` entry in `backend/staff/photo_types.py` declares the cache paths to clear for its owner (entity + collection paths, e.g. `/games/<slug>/factions.json` and `/games/<slug>/factions/<id>.json`), resolved from the owning entity. Owners without a game (`stl_model`, `source`, `collection`) declare their own miniatures paths.
- The PHP route-driven cleanup map stays as-is; the small overlap between the two lists is accepted.
- The header is sent **only when cached JSON actually changes**:
  - the upload finalize (`PATCH /uploads/image/<id>.json`) of a staff **replace whose file extension changed** (`photo.path` updated);
  - the staff photo **delete** (owner's `photo` FK set to `NULL`).
  Same-extension replaces / resizes do not send it (the photo URL is unchanged; `/photos/*` revalidation from #1468 already covers the bytes).

### Proxy

- A shared support class (e.g. `ResponseCacheClearer` in `proxy/extension/lib/support/`) parses `X-Cache-Clear` from a backend response and deletes the matching entries from the cache folder.
- `UploadHandler` and the handler serving the staff photo delete (`DeleteHandler` or its staff generalization from #1468) call it on their backend responses — only after a successful (2xx) mutation.
- No generic middleware on the `backend.php` rule in this issue (the relevant backend calls are made inside the handlers and never pass through that rule's middlewares); it can be added later if a plain proxied mutation needs it.

### Security

- The header is only ever read from **backend responses** obtained by the handlers; a client-supplied `X-Cache-Clear` request header is never forwarded (it is not on `ForwardedHeaderFilter`'s allow-list) and never acted upon.
- Each path must start with `/`, must not contain `..` or other traversal segments, and must resolve inside the cache folder (same approach as `PathTraversalGuard`); invalid entries are skipped.
- The header is stripped before any response is returned to the client.

### Agents

- `backend` — per-`PhotoType` cache targets and emitting the header on finalize / delete.
- `proxy` — the shared clearer and its use in the handlers.
- `security` / `data-access` — review of the header handling and path guard.

## Benefits
- Correct photos immediately after staff photo maintenance, instead of broken images for up to an hour.
- A general mechanism for any future mutation whose route doesn't carry the owner's params.
