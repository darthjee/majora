# Issue: improve domain caching

## Description

Replace the per-domain loop in `proxy/prod_configuration/rules/games.php`
(over `$gamesJsonCacheDomains`) with a single Tent rule for `GET
/games.json` that matches any domain and derives its cache key from the
request itself, instead of maintaining one cache directory per
admin-listed domain.

## Problem

`proxy/prod_configuration/rules/games.php` currently loops over the
`$gamesJsonCacheDomains` array (defined in `locals.php`) to generate one
Tent rule per whitelisted domain, each with its own dedicated cache
directory. This has several costs:

- Adding or removing a domain requires editing the proxy's `locals.php`,
  keeping it in sync with the backend's `GAMES_JSON_CACHE_DOMAINS` env
  var, and redeploying both — a manual, error-prone process already
  called out as risky in `locals.php.sample`'s own comments.
- Per-domain cache directories require `CachePathSanitizer` as
  defense-in-depth, since domain values get interpolated into filesystem
  paths.
- Domains that aren't on the allow-list fall back to the generic `.json`
  catch-all rule in `rules/backend.php`, sharing one unpartitioned cache
  keyed only by URI — no isolation at all.

## Expected Behavior

A single Tent rule handles `GET /games.json` for any domain (using Tent's
`%` domain wildcard). Each domain's responses are cached under an
isolated key derived from the request itself, so no proxy config change
is needed to add or remove a domain from per-domain caching — the
backend's `GAMES_JSON_CACHE_DOMAINS` env var remains the sole gate on
whether a domain's response is persisted at all.

## Solution

Tent's config files (`locals.php`, `rules/*.php`) are loaded once at
process boot (`configure.php` `require_once`s them), not per request — so
`$domain` can't literally be set to "the domain of the request" inside
`locals.php`. There's no per-request hook there.

Decided approach: replace the per-domain loop in
`proxy/prod_configuration/rules/games.php` with a **single Tent rule**
for `GET /games.json` matching any domain (Tent's domain matcher already
supports a `%` wildcard), all sharing **one physical cache folder** — no
more per-domain cache directories, and no more `CachePathSanitizer`.

Domain isolation moves from the filesystem layout to the cache key: a
custom `Tent\Cache\RequestHasher` implementation (Tent's existing
pluggable, per-request cache-key interface) computes the hash from
**both** the request's `Host` header and its query string, e.g.
`hash('sha256', $host . '|' . $request->query())` — combining both, not
replacing the query with the domain, otherwise two different domains
requesting the same query string would collide now that they no longer
sit in separate directories.

The hash (not the raw domain) is what gets written into the cache
filename, because `Tent\Utils\CacheFilePath::path()` interpolates the
hasher's return value directly into a filename with no sanitization on
Tent's side (per `RequestHasher`'s own contract). SHA-256 output is
always a fixed-length hex string regardless of input, so
filesystem-safety comes for free from the hash function's output
alphabet — no bespoke sanitizer (à la `CachePathSanitizer`) needs to be
written or maintained for it. Using the raw domain instead would reopen
that same "request-controlled value feeding a filesystem-touching value"
concern, just at filename instead of directory granularity.

## Security

- The proxy's `$gamesJsonCacheDomains` allow-list goes away entirely —
  the new rule matches any domain (`%` wildcard). The backend's
  `GAMES_JSON_CACHE_DOMAINS` env var (via `X-Skip-Cache`, deny-by-default)
  becomes the **sole** authority over which domains actually get their
  `games.json` response persisted to disk. This is a net isolation
  improvement for domains that aren't allow-listed: today they fall
  through to the generic `.json` catch-all rule in `rules/backend.php`,
  sharing one unpartitioned cache keyed only by URI; under the new rule
  they instead get their own `hash(host|query)` bucket (written or not,
  per the backend's gate) rather than sharing that catch-all bucket.
- No new cache-poisoning surface: since the cache key is
  `hash(host|query)`, spoofing `Host` can only land an attacker in their
  own bucket, unless they send the exact `Host` of a domain they don't
  already control — no different from the spoofing capability that
  domain's dedicated rule already exposes today.
- `CacheCleanupMiddleware` is wired into each per-domain rule today
  (`clear: ['collection', 'entity']` + `$cacheCleanupMap`), but since the
  rule's matcher is `GET`-only and that middleware only acts on mutating
  methods, it appears to never actually fire as configured — dropping it
  when collapsing to the single rule is acceptable for now.
