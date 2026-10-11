# Proxy Plan: Game content copy: proxy link handler, narrowed upload route, cross-domain cache clear

Issue: [1570-game-content-copy-proxy-link-handler-narrowed-upload-route-cross-domain-cache-clear.md](../../issues/1570-game-content-copy-proxy-link-handler-narrowed-upload-route-cross-domain-cache-clear.md)

## Overview
Implements the proxy parts of `docs/agents/specs/game-content-copy/hard-links.md` and the cache section of `docs/agents/specs/game-content-copy/permissions.md`. If this plan and the specs disagree, the specs win.

## Context
- Backend contract (already merged in #1569, `backend/uploads/copy_link_finalizer.py`): `PATCH /uploads/<type>/<id>.json` with `{"status":"uploading"}` returns `200 {file_path, source_path}` for copy uploads. `{"status":"failed","error":"<code>"}` returns 200, or 400 for an unknown code. `{"status":"uploaded"}` returns 200 with `X-Cache-Clear`, or 404 when the copied row is gone. Error codes: `source_missing`, `path_rejected`, `cross_device`, `target_exists`, `permission`, `unknown`.
- The copy request is `POST /staff/copies/<copy_type>/<source_id>.json` (`backend/staff/urls.py`). Today it goes through the generic `rules/backend.php` rule, whose `ResponseCacheClearMiddleware` clears only the current domain's folder.
- Cache layout: prod caches under `$cacheFolder/domain_<sha256>` (`DomainHash::hash`). Dev caches directly in `$cacheFolder` (`./cache`) with no domain subfolders.
- Rule order (`configure.php`): frontend, photos, files, uploads, delete, cache, private_game_data_cache, backend, …

## Steps

- [01 — Cross-domain mode for ResponseCacheClearer and its middleware](proxy/01-cross-domain-cache-clear.md)
- [02 — UploadStatusClient: link start and failed status](proxy/02-upload-status-client-link.md)
- [03 — LinkHandler](proxy/03-link-handler.md)
- [04 — Rules: narrowed upload route, link route, copy route](proxy/04-rules.md)

## CI Checks
- `proxy`: `docker-compose run proxy_tests` (CI job: `proxy_extension_tests` — `phpcs --standard=proxy/phpcs.xml proxy` and PHPUnit over `proxy/extension/tests`)

## Notes
- Consult the `cache` agent on step 01 and step 04's copy rule. The Navi config is unchanged because every new endpoint is `X-Skip-Cache`.
- Ask `security` to review: the staff guard comes before any backend PATCH, no paths in responses, both link ends are validated, symlinks are rejected, `link()` only, and each cross-domain folder goes through the guard.
- HTTP code for a link failure: this plan answers `422 {"status":"failed","error":"<code>"}`. The frontend issue (#1571) relies on that shape, so note it in the PR description.
- Out of scope: staff photo delete/finalize cross-domain clearing (#1580).
