# Plan: Response-driven proxy cache invalidation (X-Cache-Clear header)

Issue: [1469-response-driven-proxy-cache-invalidation-x-cache-clear-header.md](../../issues/1469-response-driven-proxy-cache-invalidation-x-cache-clear-header.md)

## Overview

The backend tells the proxy which cache entries a mutation made stale, through an `X-Cache-Clear` response header. The first users are the staff photo actions from #1468: the finalize of a replace that changed the file extension, and the staff photo delete. Those backend calls are made inside the proxy's `UploadHandler` and `DeleteHandler`, so a shared proxy helper used by those handlers reads the header, clears the listed paths in the cache folder, and never forwards the header to the client.

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)

## Shared contracts

- **Header name:** `X-Cache-Clear` (matched case-insensitively by the proxy).
- **Value:** comma-separated list of fully resolved, literal request paths, each starting with `/` and ending in `.json`, with no placeholders, query string or `..` segments, e.g.
  `X-Cache-Clear: /games/foo/factions.json, /games/foo/factions/3.json`.
  Whitespace around entries is ignored; empty entries are ignored; duplicates are allowed (harmless).
- **Sent by the backend on exactly:**
  - `PATCH /uploads/image/<id>.json` → `uploaded` for a **staff-origin** upload, on the **200 that carries `previous_path`** (extension changed). Not sent on same-path 200s, nor on the 404 `cleanup_path` response.
  - `DELETE /staff/photos/<photo_type>/<photo_id>.json` on **204**. Not sent on 422/404/401/403.
  - The header is omitted when the owner can't be resolved (e.g. orphaned photo row with no owner).
- **Proxy behaviour:** acts on the header only on a 2xx backend response obtained by `UploadHandler` (finalize call) or `DeleteHandler` (backend `DELETE` call); clears each valid path from the cache folder (the same location the `backend.php` rule's `CacheCleanupMiddleware` uses); skips invalid entries; the header never appears in the response sent to the client. A client-sent `X-Cache-Clear` request header is never forwarded nor acted upon.

## Dependencies

- Proxy work builds on #1472 (staff delete rule for `DELETE /staff/photos/<photo_type>/<photo_id>.json` and the `previous_path` handling in `UploadHandler`). If #1472 has not landed when this is implemented, the proxy agent wires the clearer into whatever exists and the staff-delete wiring is done on top of #1472.
