# Plan: Game content copy: proxy link handler, narrowed upload route, cross-domain cache clear

Issue: [1570-game-content-copy-proxy-link-handler-narrowed-upload-route-cross-domain-cache-clear.md](../../issues/1570-game-content-copy-proxy-link-handler-narrowed-upload-route-cross-domain-cache-clear.md)

## Overview
Proxy-only work: a cross-domain mode for `ResponseCacheClearer` / `ResponseCacheClearMiddleware`, a staff-only `LinkHandler` that hard-links copied photos/files, the narrowed `UploadHandler` route, and a dedicated copy-request rule that clears the target game's cache on every domain. The `cache` agent is consulted on the cross-domain clear; `security` reviews.

See [proxy.md](proxy.md) for the full plan.
