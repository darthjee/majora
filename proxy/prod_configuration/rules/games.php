<?php

use Tent\Configuration;
use Tent\Cache\DomainHash;
use Tent\Models\Request;

$gamesJsonCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost,
        'cache' => $gamesJsonCacheLocation,
        'skip_cache_header' => 'X-Skip-Cache',
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
