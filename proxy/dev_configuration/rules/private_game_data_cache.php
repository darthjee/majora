<?php
/**
 * Private (per-caller) cache rule for restricted game data endpoints.
 *
 * Covers 3 restricted GET routes under /games/<slug>/...:
 *   - GET /games/<slug>/npcs/all.json
 *   - GET /games/<slug>/pcs/<char_id>/full.json
 *   - GET /games/<slug>/npcs/<char_id>/full.json
 *
 * Each is DM/owner-gated and unconditionally sends `X-Skip-Cache: true`, so
 * Tent's identity-blind cache never caches them. This rule caches them
 * instead, scoped per-caller via the `X-Cache-Token` header (see
 * Tent\Cache\PrivateRequestHasher) so cached responses never leak across
 * callers. The mechanism was introduced as a pilot in issue #949 (scoped to
 * a single test-only route) and went live for these real routes in #1072.
 *
 * Does not honour `X-Skip-Cache`: all 3 routes keep sending
 * `X-Skip-Cache: true` unchanged, so honouring it would disable this cache.
 * Instead its `skip_cache_header` is `X-Bearer-Request` (issue #1643), set
 * by the prepended BearerSkipCacheMiddleware before default_proxy's
 * built-in FileCacheMiddleware runs. The marker is set when the request
 * carries an `Authorization: Bearer ...` header (scoped API token), so Bearer
 * requests are never served from or written to this cache, and also when
 * `X-Cache-Token` is missing or blank, so the rule refuses to cache without
 * a per-caller token (no shared "empty token" entry can be written or
 * served).
 *
 * Deliberately has no CacheCleanupMiddleware: its collection/entity cleanup
 * is keyed off the *mutating* request's own path, which never applies to
 * these GET-only routes.
 *
 * SetClientIpMiddleware (issue #1501) runs first: it sets X-Forwarded-For to
 * the client's REMOTE_ADDR and authenticates it with $proxySecret in
 * X-Proxy-Secret, so Django can trust the client IP.
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:8080',
        'skip_cache_header' => 'X-Bearer-Request',
        'request_hasher' => [
            'class' => 'Tent\\Cache\\PrivateRequestHasher',
            'headerName' => 'X-Cache-Token',
        ],
    ],
    'matchers' => [
        [
            'method' => 'GET',
            'pattern' => '#^/games/[^/]+/n?pcs/(all|\d+/full)\.json$#',
            'type' => 'regex',
        ],
    ],
    'prependMiddlewares' => [
        [
            'class'           => 'Tent\\Middlewares\\BearerSkipCacheMiddleware',
            'header'          => 'X-Bearer-Request',
            'skipWhenMissing' => 'X-Cache-Token'
        ],
    ],
    'middlewares' => [
        [
            'class'  => 'Tent\\Middlewares\\SetClientIpMiddleware',
            'secret' => $proxySecret
        ],
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => $cacheFolder,
            'host' => 'http://backend:8080',
            'maxAgeSeconds' => 10,
        ],
    ],
    ]
);
