<?php
/**
 * Backend routing rules.
 * Forwards all .json requests to the Django backend.
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:8080',
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['uri' => '.json', 'type' => 'ends_with']
    ],
    'middlewares' => [
        [
            'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
            'location' => './cache',
            'clear'    => ['collection', 'entity'],
            'custom'   => $cacheCleanupMap
        ],
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => './cache',
            'host' => 'http://backend:8080',
            'maxAgeSeconds' => 10
        ]
    ]
]);
