<?php

use Tent\Configuration;
use Tent\Cache\HostQueryRequestHasher;

$gamesJsonCacheLocation = "$cacheFolder/games_json";

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost,
        'cache' => $gamesJsonCacheLocation,
        'skip_cache_header' => 'X-Skip-Cache',
        'request_hasher' => ['class' => HostQueryRequestHasher::class]
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/games.json', 'type' => 'exact', 'domain' => '%'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\SetClientIpMiddleware'
        ],
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => $gamesJsonCacheLocation,
            'host' => $backendHost,
            'maxAgeSeconds' => 10
        ]
    ]
]);
