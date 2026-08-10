<?php
/**
 * Pilot private (per-caller) cache rule for restricted endpoints.
 *
 * Narrowly scoped to one exact GET route — see
 * docs/agents/plans/949-use-custom-cache-hash-for-some-restricted-endpoints/proxy.md
 * for the full rationale. Gated behind $privateCacheEnabled (set in
 * locals.php) so the whole mechanism can be disabled with zero code changes.
 *
 * Deliberately has no `skip_cache_header` option: staff_cache_summary keeps
 * sending `X-Skip-Cache: true` unchanged, but this rule doesn't honor it.
 * Deliberately has no CacheCleanupMiddleware: its collection/entity cleanup
 * is keyed off the *mutating* request's own path, which never applies here.
 */

use Tent\Configuration;

if ($privateCacheEnabled) {
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
            ['method' => 'GET', 'uri' => '/staff/cache/summary.json', 'type' => 'exact'],
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
}
