# Issue: Staff photo delete/finalize: clear cache on every domain

## Description

Staff photo delete (`DELETE /staff/photos/<type>/<id>.json`, handled by `DeleteHandler`) and staff upload finalize (`POST /uploads/(image|file)/<id>/submit`, handled by `UploadHandler`) only clear their `X-Cache-Clear` paths in the current request's domain cache folder (`$cacheFolder/domain_<hash>` in prod). Cache folders have no expiry, so the affected game's lists stay stale on the game's other domains until someone runs `DELETE /staff/cache/disk.json` by hand.

This gap is noted in `docs/agents/specs/game-content-copy/permissions.md#cache` and was split off from #1570.

## Problem

- Both handlers build their clearer with `ResponseCacheClearer::forPath($cachePath)`, and `proxy/prod_configuration/rules/delete.php` / `rules/uploads.php` pass the domain-scoped `"$cacheFolder/" . DomainHash::hash(new Request())`.
- The cross-domain mode added in #1570 (`ResponseCacheClearer::forRoot()`) is only used by `LinkHandler` and the `staff_copies` rule.
- The proxy cannot tell staff traffic from regular traffic: `DeleteHandler` serves both character photo delete and staff photo delete, and regular and staff uploads share the same `/uploads/(image|file)/<id>/submit` route. In practice only staff flows emit `X-Cache-Clear` (`backend/staff/staff_photo_deleter.py`, `backend/uploads/staff_upload_finalizer.py`, the copy finalizers). Regular uploads and character photo deletes send no header, so they clear nothing either way.

## Expected Behavior

- `DeleteHandler` and `UploadHandler` clear their `X-Cache-Clear` paths in every `domain_*` cache folder plus the cache root, using `ResponseCacheClearer::forRoot()`.
- Regular (non-staff) uploads and character photo deletes keep working unchanged. They emit no `X-Cache-Clear`, so switching the whole handler doesn't change what they clear.
- The `X-Cache-Clear` header is still stripped before the response reaches the client, and path validation and `PathTraversalGuard` behave as they do in cross-domain mode today.

## Solution

- `DeleteHandler` and `UploadHandler` build their clearer with `ResponseCacheClearer::forRoot()` instead of `forPath()` (the `cache_path` param now means the cache root, as in `LinkHandler`).
- `proxy/prod_configuration/rules/delete.php` and `rules/uploads.php` pass `$cacheFolder` to both handlers and drop the per-domain `$responseCacheLocation`. Update the rule docblocks. The dev rules already pass `$cacheFolder`, so only their comments change.
- Update the handler docblocks and the `ResponseCacheClearer` cross-domain-mode docblock, which lists where it is used.
- Update the side note in `docs/agents/specs/game-content-copy/permissions.md#cache` to say staff photo delete/finalize now clear across domains.
- Tests: handler tests assert that the paths are cleared in multiple `domain_*` folders and in the root, and that a response without the header clears nothing.
- Agent: `proxy`, consulting the `cache` agent. Review: `security`.
- Depends on #1570 (merged).

## Benefits

After a staff photo change, the game's cache is correct on every domain, with no manual `DELETE /staff/cache/disk.json`.
