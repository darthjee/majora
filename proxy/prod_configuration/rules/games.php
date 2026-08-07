<?php

use Tent\Configuration;
use Tent\Cache\HostQueryRequestHasher;

$gamesJsonCacheLocation = "$cacheFolder/games_json";

$gamesJsonHandler = [
    'type' => 'default_proxy',
    'host' => $backendHost,
    'cache' => $gamesJsonCacheLocation,
    'skip_cache_header' => 'X-Skip-Cache',
];

if ($gamesJsonPerDomainCaching) {
    // Only partition the cache by Host when the backend's ENABLE_GAMES_PER_DOMAIN mirror is on;
    // otherwise fall back to Tent's default, domain-blind QueryRequestHasher (see
    // DefaultProxyRequestHandler's docblock) to avoid unbounded, attacker-keyed cache growth.
    $gamesJsonHandler['request_hasher'] = ['class' => HostQueryRequestHasher::class];
}

Configuration::buildRule([
    'handler' => $gamesJsonHandler,
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
