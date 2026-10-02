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

- `UploadHandler` / `DeleteHandler` handle it for the backend calls they make themselves (`cache_path` handler param).
- Every other proxied backend response goes through `ResponseCacheClearMiddleware` on the `rules/backend.php` rule (dev and prod). It is registered via `prependMiddlewares`, not `middlewares`, so it runs before `default_proxy`'s built-in `FileCacheMiddleware` stores the response; its `location` must match the rule's cache folder.

## Photo uploads (`UploadHandler`)

`POST /uploads/<image|file>/<id>/submit` (rules/uploads.php) validates the file, calls the backend `PATCH /uploads/<type>/<id>.json` with `status=uploading` to get the `file_path`, writes the file, then finalizes with `status=uploaded`. The client response is always built from scratch (`{"file_path": ...}`).

- **Atomic writes** (`UploadStorageResolver::write`): the bytes go to a uniquely named temp file (`.upload-*`) in the destination's own directory, chmod-ed to 0644, then `rename()`-d over the target. Readers see either the old file or the new one, never a partial write. On failure the temp file is removed, the old file stays intact, and the client gets a 500. A pre-existing destination entry (e.g. a symlink) escaping the base path is rejected before anything is written.
- **`previous_path`** (finalize 200): when a staff replace changed the extension, the backend returns the old path; the proxy deletes it through `SecurePhotoStorage` (missing file = already deleted; a traversing path is logged and skipped). It never reaches the client.
- **`cleanup_path`** (finalize 404 only): the photo row was deleted mid-replace; the proxy deletes the file it just wrote through `SecurePhotoStorage`, then forwards the 404. A 404 from the `uploading` call is forwarded as-is, with no file deletion.
- Accepted limitation: any other finalize failure does not roll back the written file.

## Photo deletion (`DeleteHandler`)

rules/delete.php (loaded before rules/backend.php, so it wins over the generic `.json` proxy) routes two `DELETE` paths to `DeleteHandler`:

- `/games/<slug>/(pcs|npcs)/<id>/photos/<photo_id>.json` (character photos);
- `/staff/photos/<photo_type>/<photo_id>.json` (staff photo management; `photo_type` restricted to `[a-z0-9_-]+`).

For a request path `<base>.json`, the handler calls `GET <base>/deletable.json` (any non-200, e.g. 401/403/404/422, is forwarded as-is and no file is touched), deletes the returned `path` through `SecurePhotoStorage` (missing file = already deleted), then forwards `DELETE <base>.json`, honoring and stripping its `X-Cache-Clear`. Authorization is left to the backend on both calls.
