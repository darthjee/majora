<?php

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
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\SetClientIpMiddleware'
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
