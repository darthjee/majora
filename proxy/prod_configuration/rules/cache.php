<?php

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'class'           => 'Tent\RequestHandlers\CacheSizeHandler',
        'host'            => $backendHost,
        'cache_path'      => $cacheFolder,
        'cache_size_tool' => 'du',
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
        'host'       => $backendHost,
        'cache_path' => $cacheFolder,
    ],
    'matchers' => [
        ['method' => 'DELETE', 'uri' => '/staff/cache/disk.json', 'type' => 'exact'],
    ],
    ]
);
