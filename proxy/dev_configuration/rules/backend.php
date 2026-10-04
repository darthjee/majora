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
 * the response is cached or reaches the client. Its 'location' must match the
 * handler's cache folder ($cacheFolder).
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
        ['uri' => '.json', 'type' => 'ends_with']
    ],
    'prependMiddlewares' => [
        [
            'class'    => 'Tent\\Middlewares\\ResponseCacheClearMiddleware',
            'location' => $cacheFolder
        ]
    ],
    'middlewares' => [
        [
            'class'  => 'Tent\\Middlewares\\SetClientIpMiddleware',
            'secret' => $proxySecret
        ],
        [
            'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
            'location' => $cacheFolder,
            'clear'    => ['collection', 'entity'],
            'custom'   => $cacheCleanupMap
        ],
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => $cacheFolder,
            'host' => 'http://backend:8080',
            'maxAgeSeconds' => 10
        ]
    ]
    ]
);
