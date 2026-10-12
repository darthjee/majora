# Proxy Plan: Staff photo delete/finalize: clear cache on every domain

Main plan: [plan.md](plan.md)

## Overview
`DeleteHandler` (character photo delete and staff photo delete) and `UploadHandler` (regular and staff upload finalize) build their clearer with `ResponseCacheClearer::forPath($cachePath)`. In prod they are given the per-domain `"$cacheFolder/" . DomainHash::hash(new Request())`, so staff photo changes leave the game's cache stale on its other domains. Both handlers switch wholesale to `ResponseCacheClearer::forRoot()`, as `LinkHandler` already does, and the prod rules pass the cache root.

## Context
- `ResponseCacheClearer::forRoot($cacheRoot)` clears each validated path in the root itself (dev's flat layout) and in every `domain_<64 hex>` directory under it, with `PathTraversalGuard` checks per folder. It is used today by `LinkHandler` and the `staff_copies` rule.
- The proxy cannot tell staff requests from regular ones on these routes (the upload route is shared). This makes no difference in practice: only staff flows emit `X-Cache-Clear` (`backend/staff/staff_photo_deleter.py`, `backend/uploads/staff_upload_finalizer.py`, the copy finalizers). Regular flows send no header and clear nothing. The user chose to switch the whole handlers rather than split routes.
- Dev rules already pass `$cacheFolder` (the flat root). `forRoot()` also clears the root, so dev behavior and the existing flat-folder handler tests keep passing.

## Steps

- [01 — Switch handlers to cross-domain clearing](proxy/01-switch-handlers-to-cross-domain.md)
- [02 — Pass the cache root from the prod rules](proxy/02-pass-cache-root-from-prod-rules.md)
- [03 — Update docblocks and the spec note](proxy/03-update-docs.md)

## CI Checks
- `proxy`: `docker-compose run --rm proxy_tests`, plus the PHP lint step in `.claude/scripts/check_proxy.sh` (CI job: `proxy_extension_tests`)
- `docs`: markdownlint (CI job: `markdownlint`)

## Notes
- Consult the `cache` agent on the switch (no Navi config change is expected: no new endpoints). The `security` agent reviews: header validation, 2xx-only clearing and the per-folder `PathTraversalGuard` are inherited unchanged from `forRoot()`, and the client-supplied `X-Cache-Clear` must still be ignored.
- Cost: each successful staff delete/finalize now runs a `scandir` of the cache root. Over-clearing a path on an unrelated domain only costs a cache miss, and `game_slug` is globally unique.
- No backend, frontend or Navi changes.
