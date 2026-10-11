# Issue: Game content copy: proxy link handler, narrowed upload route, cross-domain cache clear

## Description
Part of "copy content between games" (epic #1550). The proxy creates the hard links that share a source game's photos/files with its copies, and clears the target game's cache on every domain. That covers both the copy request and the copy-link finalize.

The design source of truth is the specs under `docs/agents/specs/game-content-copy/` (index: `docs/agents/specs/game-content-copy.md`) plus `docs/agents/access-control/staff-copy.md`. If this issue and the specs disagree, the specs win. This issue implements the proxy parts of `hard-links.md` and the cache section of `permissions.md`.

## Expected Behavior
### Link handler
A new handler (e.g. `LinkHandler` in `proxy/extension/lib/handlers/`) for `POST /uploads/link/<image|file>/<id>/submit`, with the token in `X-Upload-Token`:
1. Call `StaffAccessGuard::requireStaffAccess`.
2. Send `PATCH uploads/<type>/<id>.json` with `status=uploading`; it returns `{file_path, source_path}`. `UploadStatusClient` gains a method that returns both paths, plus `requestFailedStatus($id, $error, $headers)`. Relay a backend `403`/`404` as-is.
3. Validate the source: correct type prefix, `is_file && !is_link`, then `PathTraversalGuard::assertRealPathWithinBase` against `<base>/photos` or `<base>/files`.
4. Validate the target against the same type root and create its directory with `SecurePhotoStorage::ensureDirectoryFor()`.
5. Link with `link()` only: never `symlink()`, and no byte-copy fallback. If the target already exists, is not a symlink and has the same inode as the source, treat the request as an idempotent retry: skip linking and go to finalize. Any other existing target → `target_exists`.
6. Send `status=uploaded` to finalize, then call `ResponseCacheClearer` in cross-domain mode on the finalize response.

Any failure in steps 3–5 sends `status=failed` with `{error}` (`source_missing`, `path_rejected`, `cross_device`, `target_exists`, `permission`, `unknown`). The proxy response never contains paths: only the status and, on failure, the `error` code.

### Routes
- In both `proxy/dev_configuration/rules/uploads.php` and `proxy/prod_configuration/rules/uploads.php`, the `UploadHandler` rule changes from `begins_with /uploads/` to the anchored regex `#^/uploads/(image|file)/\d+/submit$#`.
- The link rule uses `#^/uploads/link/(image|file)/\d+/submit$#`.
- A new anchored rule for `POST /staff/copies/<type>/<id>.json` (copy request), in both dev and prod, placed before the generic `backend.php` rule. It proxies to the backend like the generic rule (`X-Skip-Cache`, no caching), but `ResponseCacheClearMiddleware` runs in cross-domain mode so the copy's `X-Cache-Clear` paths are cleared everywhere and the header is still stripped from the client response.

### Cross-domain mode of `ResponseCacheClearer`
- Built from the cache **root** (`$cacheFolder`, not the per-request `domain_<hash>` folder).
- Each valid `X-Cache-Clear` path is cleared in every `domain_*` subfolder of the root, and also in the root itself, which covers dev's flat layout with no domain subfolders. The same code then works in dev and prod.
- Path validation and the `PathTraversalGuard` check are reused for each folder. A folder that fails the guard is skipped and logged; the others are still cleared.
- The existing single-folder mode is unchanged for every other caller.

## Solution
- Agent: `proxy`, consulting the `cache` agent on the cross-domain clear and the new copy rule. Review: `security`.
- PHPUnit tests: staff guard; path validation of both ends; symlink rejection; `link()`; same-inode retry; each failure → its `error` code; no paths in responses; the narrowed `UploadHandler` matcher and the link/copy matchers; cross-domain clear across several `domain_*` folders and the flat root; per-folder guard skip; the copy rule stripping `X-Cache-Clear`.

### Out of scope
- Staff photo delete/finalize, which have the same single-domain gap, are tracked in #1580.

### Depends on
- #1569 (`Upload` copy origin: `source_path`, `failed` status, errors), already merged. This issue must be merged before the Items tab sub-issue (#1572).

## Benefits
Copies share files without duplicating bytes and stay independent when either side is deleted or replaced. After a copy, the target game's cache is correct on all of its domains.
