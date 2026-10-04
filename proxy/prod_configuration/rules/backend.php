<?php
/**
 * Backend routing rules.
 * Forwards all .json requests to the Django backend.
 *
 * SetClientIpMiddleware (issue #1501) sets X-Forwarded-For to the client's
 * REMOTE_ADDR and authenticates it with $proxySecret in X-Proxy-Secret, so
 * Django can trust the client IP.
 *
 * ResponseCacheClearMiddleware (issue #1469) is prepended so it runs before
 * default_proxy's built-in FileCacheMiddleware: it clears the paths listed in
 * a 2xx backend response's X-Cache-Clear header and strips that header before
 * the response is cached or reaches the client. It shares the handler's
 * domain-scoped cache folder.
 */

use Tent\Configuration;
use Tent\Cache\DomainHash;
use Tent\Models\Request;

$backendCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost,
        'cache' => $backendCacheLocation,
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['uri' => '.json', 'type' => 'ends_with']
    ],
    'prependMiddlewares' => [
        [
            'class'    => 'Tent\\Middlewares\\ResponseCacheClearMiddleware',
            'location' => $backendCacheLocation
        ]
    ],
    'middlewares' => [
        [
            'class'  => 'Tent\\Middlewares\\SetClientIpMiddleware',
            'secret' => $proxySecret
        ],
        [
            'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
            'location' => $backendCacheLocation,
            'clear'    => ['collection', 'entity'],
            'custom'   => $cacheCleanupMap
        ],
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => $backendCacheLocation,
            'host' => $backendHost,
            'maxAgeSeconds' => 10
        ]
    ]
    ]
);
