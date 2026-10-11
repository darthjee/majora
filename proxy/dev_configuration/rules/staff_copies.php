<?php
/**
 * Staff copy request: POST /staff/copies/<copy_type>/<source_id>.json
 * (issue #1570).
 *
 * Copying content into a game makes that game's cached data stale on every
 * domain it is served from, not just the domain the staff member used (see
 * docs/agents/specs/game-content-copy/permissions.md#cache). This rule
 * proxies to the backend like rules/backend.php (same cache folder and
 * X-Skip-Cache), but its ResponseCacheClearMiddleware runs in cross-domain
 * mode: the X-Cache-Clear paths are cleared in the cache root and in every
 * domain_<hash> folder under it, and the header is still stripped before
 * the response is cached or reaches the client.
 *
 * Loaded before rules/backend.php so it takes precedence over the generic
 * `.json` proxy. GET routes and staff/copies/links/<id>/renew.json don't
 * match and keep going through rules/backend.php.
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:8080',
        'cache' => $cacheFolder,
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        [
            'method'  => 'POST',
            'pattern' => '#^/staff/copies/[a-z0-9_-]+/\d+\.json$#',
            'type'    => 'regex',
        ],
    ],
    'prependMiddlewares' => [
        [
            'class'        => 'Tent\\Middlewares\\ResponseCacheClearMiddleware',
            'location'     => $cacheFolder,
            'cross_domain' => true
        ]
    ],
    'middlewares' => [
        [
            'class'  => 'Tent\\Middlewares\\SetClientIpMiddleware',
            'secret' => $proxySecret
        ]
    ]
    ]
);
