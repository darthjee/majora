<?php
/**
 * Staff cache routes: CacheSizeHandler (GET /staff/cache/size.json) and
 * CacheClearHandler (DELETE /staff/cache/disk.json).
 *
 * Both handlers' 'secret' is the proxy secret ($proxySecret): their backend
 * calls carry the client's REMOTE_ADDR in X-Forwarded-For authenticated by
 * X-Proxy-Secret (BackendClient), exactly as SetClientIpMiddleware does for
 * the plain proxy rules, so Django records the visitor's IP rather than the
 * proxy's.
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'class'           => 'Tent\RequestHandlers\CacheSizeHandler',
        'host'            => 'http://backend:8080',
        'cache_path'      => $cacheFolder,
        'cache_size_tool' => 'php_walk',
        'secret'          => $proxySecret,
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/staff/cache/size.json', 'type' => 'exact'],
    ],
    ]
);

Configuration::buildRule(
    [
    'handler' => [
        'class'      => 'Tent\RequestHandlers\CacheClearHandler',
        'host'       => 'http://backend:8080',
        'cache_path' => $cacheFolder,
        'secret'     => $proxySecret,
    ],
    'matchers' => [
        ['method' => 'DELETE', 'uri' => '/staff/cache/disk.json', 'type' => 'exact'],
    ],
    ]
);
