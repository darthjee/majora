# Plan: Use custom cache hash for some restricted endpoints

Issue: [949-use-custom-cache-hash-for-some-restricted-endpoints.md](../issues/949-use-custom-cache-hash-for-some-restricted-endpoints.md)

## Overview

Pilot private (per-caller) response caching in the Tent proxy for one restricted endpoint, `GET /staff/cache/summary.json`. A dedicated `CacheToken` model (never usable to authenticate a real backend request) is minted at login/status and sent as an `X-Cache-Token` header; a new Tent `RequestHasher` keys the proxy's file cache on that header instead of the query string alone. The new rule is gated behind a `$privateCacheEnabled` kill switch in `locals.php` so it can be fully disabled with zero code changes if anything goes wrong.

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)
- [frontend](frontend.md)

## Shared contracts

- **`cache_token` response field** (backend → frontend): both `POST /users/login.json` and `GET /users/status.json` (its logged-in payload only) gain a `cache_token` field — a string, same shape/length as the existing `token` field (DRF `Token.key`-style: a random ~40-char hex string) — returned alongside the existing `token` field. Minted via `CacheToken.objects.get_or_create(user=...)`.
- **`X-Cache-Token` request header** (frontend → proxy): the frontend stores `cache_token` in-memory exactly like the existing auth token (mirroring `AuthStorage`) and sends it as `X-Cache-Token` on every request once known. Before it's known (e.g. the very first bootstrap call before any login/status response has arrived), the header is simply omitted.
- **Pilot endpoint path**: `GET /staff/cache/summary.json` (`backend/staff/views/staff_cache_summary.py` — unchanged by this issue) is the exact URI the new proxy rule's matcher targets. No backend behavior changes for this endpoint itself — it keeps sending `X-Skip-Cache: true` unchanged; the new proxy rule simply doesn't honor that header.
- **Missing-header behavior**: Tent's rule matchers only support method/URI/domain-based matching, not header presence — so the new rule unconditionally intercepts every `GET /staff/cache/summary.json` request, whether or not `X-Cache-Token` is present. When absent, the hasher hashes an empty private-data value, so all header-less callers (e.g. a direct `curl`, a monitoring script) share one cache entry. This is acceptable specifically because this pilot endpoint's response (`{size, limit}`) doesn't vary per caller — it would **not** be an acceptable fallback for a genuinely per-user endpoint adopting this pattern later (see proxy plan's Notes).
- **Kill switch**: `$privateCacheEnabled` (`proxy/dev_configuration/locals.php`, `proxy/prod_configuration/locals.php.sample`) is proxy-only — backend and frontend have no awareness of it.
