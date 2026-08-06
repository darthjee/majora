<?php

use Tent\Configuration;
use Tent\RequestHandlers\CachePathSanitizer;

foreach ($gamesJsonCacheDomains as $domain) {
    $domainCacheLocation = "$cacheFolder/." . CachePathSanitizer::sanitize($domain, $cacheFolder);

    Configuration::buildRule([
        'handler' => [
            'type' => 'default_proxy',
            'host' => $backendHost,
            'cache' => $domainCacheLocation,
            'skip_cache_header' => 'X-Skip-Cache'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/games.json', 'type' => 'exact', 'domain' => $domain],
        ],
        'middlewares' => [
            [
                'class' => 'Tent\\Middlewares\\SetClientIpMiddleware'
            ],
            [
                'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
                'location' => $domainCacheLocation,
                'clear'    => ['collection', 'entity'],
                'custom'   => $cacheCleanupMap
            ],
            [
                'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
                'location' => $domainCacheLocation,
                'host' => $backendHost,
                'maxAgeSeconds' => 10
            ]
        ]
    ]);
}
