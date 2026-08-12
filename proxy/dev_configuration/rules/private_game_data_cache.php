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
 * Deliberately has no `skip_cache_header` option: all 3 routes keep sending
 * `X-Skip-Cache: true` unchanged, but this rule doesn't honor it.
 * Deliberately has no CacheCleanupMiddleware: its collection/entity cleanup
 * is keyed off the *mutating* request's own path, which never applies to
 * these GET-only routes.
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:8080',
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
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => $cacheFolder,
            'host' => 'http://backend:8080',
            'maxAgeSeconds' => 10,
        ],
    ],
]);
