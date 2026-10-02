# Issue: Proxy: serve /photos/* with no-cache revalidation (ETag / Last-Modified)

## Description
Part of #1468 (staff page to manage photos). Staff will be able to replace / resize a photo **in place**: the file is overwritten at the same path, so the image URL does not change. Rather than adding a `?v=` version param to every serializer emitting `photo_path` (~50 files), the chosen cache-busting strategy is to have the Tent proxy force revalidation of photo (and document) files.

**Blocked by darthjee/tent#289**: Tent's `StaticFileHandler` must first emit `ETag` / `Last-Modified` and answer conditional GETs with `304`. That work is upstream in Tent, not in `proxy/extension`. This issue covers only the Majora side, once a Tent release with that support exists.

Independent of the other #1468 sub-issues; can ship at any time after the Tent release.

## Problem
The `/photos` and `/files` rules (`proxy/{dev,prod}_configuration/rules/photos.php` and `files.php`) serve files with the `static` handler plus `CacheControlMiddleware` set to `max-age=604800` (7 days). Browsers and intermediate caches that already hold a file will keep showing the old version for up to a week after it is replaced.

Tent 0.10.4's `StaticFileHandler` emits only `Content-Type` and `Content-Length`, with no validators and no `304`. Switching to `no-cache` alone would therefore force a full re-download on every view.

## Expected Behavior
- `GET /photos/*` and `GET /files/*` responses carry `Cache-Control: no-cache` (replacing `max-age=604800`), plus the `ETag` / `Last-Modified` validators provided by Tent.
- Conditional requests for an unchanged file get `304 Not Modified`. The `Cache-Control: no-cache` header must still be present on the `304`.
- After a file is replaced at the same path, the next view gets the new content (`200`).
- 404 / 403 responses are unchanged.
- Static assets (`/static/*`), the frontend rule, the domain rule, and API JSON caching are unchanged.

## Solution
1. **Bump Tent** to the release that ships darthjee/tent#289, everywhere `0.10.4` is pinned:
   - `docker-compose.yml` (`darthjee/tent` and `darthjee/tent-test`)
   - `.circleci/config.yml` (`tent-test` and `tent` images)
2. **`no-cache` support in `CacheControlMiddleware`** (`proxy/extension/lib/middlewares/CacheControlMiddleware.php`): add a way to emit `Cache-Control: no-cache`, e.g. a `directive` attribute (`'directive' => 'no-cache'`) that takes precedence over `maxAgeSeconds`. Existing `maxAgeSeconds` usages keep their current behavior. Extend `proxy/extension/tests/middlewares/CacheControlMiddlewareTest.php` accordingly, including that the header is set on a `304` response.
3. **Rule config**: switch the `photos.php` and `files.php` rules in both `proxy/dev_configuration/rules/` and `proxy/prod_configuration/rules/` to `no-cache`.
4. **Docs**: update the stale Tent version references in `.claude/agents/proxy.md`, `.claude/agents/infra.md` and `.claude/scripts/check_proxy.sh` (currently `0.7.8` / `0.10.0`) to the new version.

### Out of scope
- Implementing validators / `304` handling inside `proxy/extension`; this belongs upstream (darthjee/tent#289).
- `/static/*`, the frontend and domain rules, and API JSON caching.

## Benefits
- Replaced photos and documents show up immediately, with no URL versioning across ~50 serializers.
- Unchanged files cost only a cheap `304` round-trip instead of a full re-download.
- Conditional-GET support lives in Tent, where every static rule (in Majora and elsewhere) can reuse it.
