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
 *
 * Uses $backendHost (not a hardcoded docker-compose service name) to match
 * this environment's rules/cache.php and rules/backend.php conventions.
 *
 * Domain-scoped the same way as rules/backend.php: the cache location is
 * partitioned via DomainHash::hash(new Request()) into a `domain_<hash>`
 * subfolder under $cacheFolder. This rule deliberately shares that folder
 * with backend.php's cache — safe, since the two rules never match the same
 * routes (this rule's matcher is a strict subset of backend.php's generic
 * `.json` catch-all) and Tent further partitions by request path within the
 * folder.
 */

use Tent\Configuration;
use Tent\Cache\DomainHash;
use Tent\Models\Request;

$privateCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost,
        'cache' => $privateCacheLocation,
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
            'location' => $privateCacheLocation,
            'host' => $backendHost,
            'maxAgeSeconds' => 10,
        ],
    ],
    ]
);
