# Tent Proxy (majora_proxy)

Tent ([GitHub](https://github.com/darthjee/tent), [Docker Hub](https://hub.docker.com/r/darthjee/tent)) is a PHP-based reverse proxy and static file server used to serve both frontend assets and to proxy backend API requests.

Repository layout (proxy-related files):
```
proxy/
├── dev_configuration/
│   ├── configure.php
│   └── rules/
│       ├── backend.php
│       ├── frontend.php
│       └── redirects.php
├── prod_configuration/
└── custom/
    ├── extend/
    └── tests/
```

## Routing modes

- Dev mode (`FRONTEND_DEV_MODE=true`): Tent proxies frontend requests to the Vite dev server (`majora_fe:8080`), including HMR paths (`/@vite/*`, `/@react-refresh`).
- Production (flag unset): Tent serves frontend assets statically from its static folder.
- Both modes: `*.json` paths route to the Django backend (cached via `default_proxy`); unmatched paths redirect to the SPA hash-routing entrypoint (`/#/<path>`).

See proxy/dev_configuration/rules/ and proxy/prod_configuration/ for exact rule definitions.

## Response-driven cache invalidation (`X-Cache-Clear`)

The backend can list the cache paths a mutation made stale in an `X-Cache-Clear` response header (comma-separated `.json` paths). The proxy clears them (2xx only, each path validated by `ResponseCacheClearer`) and always strips the header, so it never reaches the client and is never stored in a cache entry. A client-sent `X-Cache-Clear` is dropped and has no effect.

- `UploadHandler`, `DeleteHandler` and `LinkHandler` handle it for the backend calls they make themselves (`cache_path` handler param, the cache root), in cross-domain mode (see below).
- Every other proxied backend response goes through `ResponseCacheClearMiddleware` on the `rules/backend.php` rule (dev and prod). It is registered via `prependMiddlewares`, not `middlewares`, so it runs before `default_proxy`'s built-in `FileCacheMiddleware` stores the response; its `location` must match the rule's cache folder.

### Cross-domain mode

In prod, cache entries live in one `domain_<sha256>` folder per request Host (`DomainHash`) under the cache root (`$cacheFolder`), and never expire; dev uses the root itself (flat layout, no domain folders). Clearing only the request's own folder would leave a game's pages stale on its other domains, so mutations that affect a game on every domain clear across all of them.

`ResponseCacheClearer::forRoot($cacheRoot)` keeps the same header parsing, 2xx check and path validation, then clears each valid path in the root itself and in every directory directly under it named `domain_<64 hex>` (enumerated at clear time, since new domains appear at runtime). Each domain folder must pass `PathTraversalGuard` against the root (a symlinked `domain_*` is skipped and logged), and the per-path guard runs inside each folder; a failing folder is skipped while the others are still cleared. The header is still stripped.

Used by:

- `rules/staff_copies.php` (#1570): `POST /staff/copies/<type>/<id>.json` (anchored regex, loaded before `rules/backend.php`) is proxied like the generic backend rule (same cache folder, `X-Skip-Cache`), but its `ResponseCacheClearMiddleware` has `'cross_domain' => true` and a cache-root `location`. GET routes and the renew `POST` keep going through `rules/backend.php`. In prod the rule's own `cache` is the request's domain folder, as in `rules/backend.php`.
- `LinkHandler` for the copy-link finalize (#1570), and `UploadHandler` / `DeleteHandler` for staff photo finalize/delete (#1580).

Since `game_slug` is globally unique, clearing a game path on every domain is correct; over-clearing only costs a cache miss. See [Game Content Copy](../game-content-copy.md#cache).

## Photo uploads (`UploadHandler`)

`POST /uploads/<image|file>/<id>/submit` (rules/uploads.php, anchored regex `#^/uploads/(image|file)/\d+/submit$#`, so it never catches `/uploads/link/...`) validates the file, calls the backend `PATCH /uploads/<type>/<id>.json` with `status=uploading` to get the `file_path`, writes the file, then finalizes with `status=uploaded`. The client response is always built from scratch (`{"file_path": ...}`).

- **Atomic writes** (`UploadStorageResolver::write`): the bytes go to a uniquely named temp file (`.upload-*`) in the destination's own directory, chmod-ed to 0644, then `rename()`-d over the target. Readers see either the old file or the new one, never a partial write. On failure the temp file is removed, the old file stays intact, and the client gets a 500. A pre-existing destination entry (e.g. a symlink) escaping the base path is rejected before anything is written.
- **`previous_path`** (finalize 200): when a staff replace changed the extension, the backend returns the old path; the proxy deletes it through `SecurePhotoStorage` (missing file = already deleted; a traversing path is logged and skipped). It never reaches the client.
- **`cleanup_path`** (finalize 404 only): the photo row was deleted mid-replace; the proxy deletes the file it just wrote through `SecurePhotoStorage`, then forwards the 404. A 404 from the `uploading` call is forwarded as-is, with no file deletion.
- Accepted limitation: any other finalize failure does not roll back the written file.

## Photo deletion (`DeleteHandler`)

rules/delete.php (loaded before rules/backend.php, so it wins over the generic `.json` proxy) routes two `DELETE` paths to `DeleteHandler`:

- `/games/<slug>/(pcs|npcs)/<id>/photos/<photo_id>.json` (character photos);
- `/staff/photos/<photo_type>/<photo_id>.json` (staff photo management; `photo_type` restricted to `[a-z0-9_-]+`).

For a request path `<base>.json`, the handler calls `GET <base>/deletable.json` (any non-200, e.g. 401/403/404/422, is forwarded as-is and no file is touched), deletes the returned `path` through `SecurePhotoStorage` (missing file = already deleted), then forwards `DELETE <base>.json`, honoring and stripping its `X-Cache-Clear`. Authorization is left to the backend on both calls.

## Link handler (`LinkHandler`)

`POST /uploads/link/<image|file>/<id>/submit` (rules/uploads.php, anchored regex `#^/uploads/link/(image|file)/\d+/submit$#`; no `.json`, upload token in `X-Upload-Token`) shares a source game's photo/file with its copy through a hard link, for the staff [game content copy](../game-content-copy.md#hard-links). Both upload matchers are anchored, so each request reaches the right handler whatever the rule order.

1. `StaffAccessGuard::requireStaffAccess` rejects non-staff callers before any backend call.
2. `PATCH /uploads/<type>/<id>.json` `status=uploading` (`UploadStatusClient::requestLinkStartStatus`) returns the copy's `file_path` and the source's `source_path`. Backend `403`/`404` are relayed as-is.
3. Both paths must start with the type prefix (`photos/` for `image`, `files/` for `file`) and contain no empty, `.` or `..` segment nor NUL byte. The source must exist, be a regular file and **not a symlink** (`link()` on a symlink would link the symlink itself), and its real path must lie inside the type root (`<photos_path>/photos` or `<files_path>/files`, `PathTraversalGuard::assertRealPathWithinBase`).
4. The target's directory is validated against the same type root and created through `SecurePhotoStorage::ensureDirectoryFor()`.
5. The file is shared with `link()` only: never `symlink()`, never a byte copy. An existing target that is the very same inode and device as the source (and not a symlink) is an idempotent retry and skips linking; any other existing target is `target_exists`.
6. `PATCH ... status=uploaded` finalizes the copy; its `X-Cache-Clear` is cleared in every domain folder (`ResponseCacheClearer::forRoot`, see [Cross-domain mode](#cross-domain-mode)).

Any failure in steps 3-5 is reported with `PATCH ... status=failed` + `{error}` (`UploadStatusClient::requestFailedStatus`; a failing report is only logged) and answers `422 {"status":"failed","error":"<code>"}`:

| `error` | Cause |
|---------|-------|
| `source_missing` | The source file does not exist. |
| `path_rejected` | Bad prefix or segment, symlinked or non-regular source, source outside the type root, missing type root, invalid target directory. |
| `cross_device` | `link()` failed with `EXDEV` (cross-device). |
| `target_exists` | The target exists and is not the same file. |
| `permission` | Permission denied while linking or creating the target directory. |
| `unknown` | Any other `link()` failure. |

Success answers `200 {"status":"uploaded"}`. The response is always built from scratch, so it never carries `file_path`, `source_path` or `X-Cache-Clear`. Nothing is ever deleted: interrupted or failed links stay resumable from the staff copy page's pending-links list.
