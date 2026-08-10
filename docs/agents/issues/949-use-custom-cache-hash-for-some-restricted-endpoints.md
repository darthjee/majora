# Issue: Use custom cache hash for some restricted endpoints

## Description

Pilot private (per-user) response caching for restricted endpoints in the Tent proxy. Restricted/authenticated GET endpoints currently always set `X-Skip-Cache: true`, so they're never cached — this issue tests whether some of them can be cached safely per-caller, using Tent's pluggable `RequestHasher` mechanism, without ever risking one user seeing another's cached response.

## Problem

Every restricted (non-`AllowAny`) GET endpoint sets `X-Skip-Cache: true` by convention (see `docs/agents/access-control/principles.md`'s X-Skip-Cache rule and `docs/agents/security-guidelines/proxy-rules.md`), so Tent's file cache is bypassed entirely for authenticated traffic — even for endpoints whose response only depends on who's asking, not on any request body or mutation. That's a missed caching opportunity across the whole authenticated portion of the app, with no working example yet of how to do it safely — i.e. without risking one user's private data leaking to another via cache-key collisions.

## Expected Behavior

- `GET /staff/cache/summary.json` (the pilot endpoint) is served from Tent's private cache on repeat calls from the same user, while never serving one user's cached response to a different user.
- The mechanism is fully reversible via a `$privateCacheEnabled` flag in `locals.php` — disabling it removes the new proxy rule entirely and restores today's behavior (including `X-Skip-Cache` being honored again via the normal `backend.php` catch-all).
- All other endpoints are unaffected — the new rule only intercepts `GET /staff/cache/summary.json`.
- Cached entries go stale within `maxAgeSeconds` (proposed: 10s, matching `backend.php`'s existing `CacheStalenessMiddleware` usage) and are fully purged by the existing `DELETE /staff/cache/disk.json` cache-clear action.

## Solution

### 1. Custom per-user request hasher

Tent already supports a pluggable `RequestHasher` (`Tent\Cache\RequestHasher`, configured via a `request_hasher` array on a rule's handler — see `docs/agents/external/tent/creating-request-hashers.md`). A new hasher class computes:

```php
return 'private_' . hash('sha256', $private_data . '|' . $request->query());
```

- Single hash over a delimiter-separated concatenation (not two separate hashes chained together) — matches Tent's own canonical `HeaderAwareRequestHasher` example.
- The `|` delimiter is mandatory: it closes the concatenation-boundary-ambiguity gap (e.g. `private="AB"`+`query="C"` colliding with `private="A"`+`query="BC"`) — that's the real risk behind "hash clashes," not SHA256 collision itself (negligible).
- Hashing the raw query string directly reproduces Tent's default `QueryRequestHasher` behavior in one pass — no need to separately compute and chain onto its output.
- The `private_` prefix stays unhashed (readability/namespacing); `$private_data` (the sensitive part) is always hashed, never embedded raw.
- For the pilot endpoint specifically, the matcher already restricts to one exact `GET` URI with no query parameters, so `$request->query()` is always empty in practice — the query-hashing behavior is included for correctness and reuse on future endpoints, not because this pilot needs it.

### 2. Cache key material: a dedicated cache token

`$private_data` is **not** the existing DRF auth token or session cookie — reusing that credential directly would mean an unhashed leak of the *cache* artifact could theoretically be traced back to real backend authentication material. Instead:

- **New `CacheToken` model** (own table), deliberately never consulted by any backend authentication class — even leaked/unhashed, it can never authenticate a real (mutating) backend request. It exists solely as private-cache hash input.
- **Minted without a new endpoint**: piggybacks on the existing session-cookie-authenticated bootstrap responses — `login.py`'s response and `/users/status.json`'s response both gain a `cache_token` field alongside the existing `token` field. This keeps the security-review surface to "extend an already-audited response shape" rather than "audit a new mint endpoint."
- **Frontend**: rides the same in-memory lifecycle as the existing auth token (`AuthStorage`), sent as a dedicated header (`X-Cache-Token`) on every request — never as a cookie.
- **Invalidated at logout**, alongside the `Token` row deletion in `logout.py` — inherits the same "logout = immediately unreachable" property already established for the auth token.
- Requests without an `X-Cache-Token` header (e.g. the very first bootstrap call, before the token has been minted/received) simply don't match the private-cache rule and fall through to today's behavior — no cookie-based fallback keying needed. Note this bootstrap/minting flow is endpoint-agnostic: it hands out the token regardless of which endpoint is being privately cached.

### 3. Pilot endpoint: `GET /staff/cache/summary.json`

Chosen over the originally proposed `GET /users/status.json` and several other candidates:
- `GET /games/<slug>/npcs.json` — turned out to be `AllowAny`/public, shares its route with `POST`; doesn't exercise per-user caching at all.
- `GET /users/account.json` and `GET /account/authorization_requests.json` — genuinely per-user and simple, but return PII/sensitive data; excluded on purpose (see "New tracking docs" below).
- `GET /miniatures/stl_models/<id>.json` — simplest payload, but the feature is still in progress with little real traffic, and its response doesn't vary per user anyway.
- `GET /my-games.json` — real per-user data, genuinely gated, no PII, but a list of objects rather than one flat object.
- `GET /games/<slug>/(npcs|pcs)/<id>/photos/<id>/deletable.json` — good shape, but currently unused by the frontend (see `docs/agents/unused-endpoints.md`) — no real traffic to validate against.

`staff_cache_summary` wins on: flattest possible payload (`{size, limit}`, two ints), genuinely restricted (staff-only, via `require_staff`), real usage, and — the deciding factor — harmless even if it ever leaked cross-user (cache size/limit in bytes), making it the lowest-risk endpoint to validate the mechanism against before trusting it with anything sensitive.

### 4. New tracking doc

`docs/agents/no-private-cache-routes.md` (created): an explicit do-not-cache list, currently `GET /users/account.json` and `GET /account/authorization_requests.json`, both ruled out as private-cache candidates due to PII/sensitivity — independent of this pilot's outcome, so the reasoning doesn't get re-litigated if those endpoints come up again as candidates later.

### 5. Proxy rule placement

Follows the existing narrow-rule pattern (`rules/cache.php`) rather than folding into `backend.php`'s catch-all:

- New file `proxy/dev_configuration/rules/private_cache.php` (mirrored in `prod_configuration`), required in `configure.php` between `rules/cache.php` and `rules/backend.php`.
- Matcher: `['method' => 'GET', 'uri' => '/staff/cache/summary.json', 'type' => 'exact']`.
- Handler: `type => 'default_proxy'`, `host => 'http://backend:8080'`, `request_hasher` wired to the new hasher class, keyed on the `X-Cache-Token` header.

### 6. X-Skip-Cache handling for the pilot

The new rule does **not** configure `skip_cache_header` — `staff_cache_summary` keeps sending `X-Skip-Cache: true` unchanged (no backend code change for the pilot); the header simply has no effect on this one rule. Accepted trade-off: the response "lies" about being skip-cache while actually being cached — deliberately accepted since end users have no visibility into this header. `backend.php`'s catch-all is untouched and still honors the header normally everywhere else.

Instead of a per-request bypass, the whole mechanism is gated behind a **kill switch**: a `$privateCacheEnabled` boolean read from `locals.php`, wrapping the new rule's `Configuration::buildRule([...])` call. Disabling it un-registers the rule entirely, fully restoring today's behavior.

- `dev_configuration/locals.php` and `prod_configuration/locals.php.sample` both get the new variable, committed.
- `prod_configuration/locals.php` itself isn't tracked in git (generated per-deployment) — **the real prod value needs to be set manually on the server; call this out explicitly in the PR description** so it isn't forgotten.

No changes to `docs/agents/access-control/principles.md` / `docs/agents/security-guidelines/proxy-rules.md` for the pilot, since backend behavior is unchanged. Revisit both docs, plus a proper `skip_cache_header` story, once this moves past pilot.

### 7. Cache staleness

- **`CacheStalenessMiddleware`** added to the new rule (`maxAgeSeconds => 10`, matching `backend.php`) — bounds staleness by time; reuses the memoized hash from the custom `request_hasher` automatically (it has no `request_hasher` option of its own).
- **`DELETE /staff/cache/disk.json`** already wipes the whole cache folder, including the new `private_`-prefixed entries — no extra invalidation code needed.
- **`CacheCleanupMiddleware`'s `collection`/`entity` mechanism does not apply** to this pilot — its cleanup targets derive from the *mutating request's own path*, and nothing mutates cache size directly. Worth reusing for **future** private-cache routes that do have a clear owning resource/mutation relationship.

### 8. Testing & rollout

- **Unit tests** (blocking): new hasher class tested directly, following the existing 1:1 test-mirroring convention (`proxy/extension/tests/cache/...`) — deterministic per token+query, different tokens produce different hashes, delimiter correctly separates boundary-ambiguous concatenations.
- **Integration test** (blocking): log in as two distinct users, hit `GET /staff/cache/summary.json` twice each through the real proxy rule; assert the two users' responses never share a cache file, and each user's second call is a hit against their own first call.
- **Staged rollout**: land in `dev_configuration` first, verify hit rate and the cross-user check manually, then mirror to `prod_configuration` — the existing dev/prod config split doubles as a staging point; no separate feature-flag mechanism needed beyond the kill switch above.
- **Rollback**: purely additive (new rule, new hasher class, new `CacheToken` model/migration) — a single revert, no data cleanup required.
- **Observability**: log at cache-hit/miss time (hashed key + endpoint only, never the raw token) for post-launch spot-checking.

## Benefits

- Proves out, on the lowest-risk possible endpoint, that restricted/authenticated responses can be cached per-user safely — without exposing any user's data to another.
- Establishes a reusable pattern (dedicated non-authenticating `CacheToken`, delimiter-safe `RequestHasher`, narrow pre-`backend.php` rule, kill switch, do-not-cache doc) for extending private caching to other restricted endpoints later, with an explicit tracking doc so sensitive endpoints stay excluded on purpose rather than by accident.
- Reduces backend load for repeat authenticated `GET` requests wherever the pattern is later extended, without weakening any existing security guideline — the pilot's exception is scoped, documented, and reversible via a single flag.
