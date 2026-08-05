<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'           => 'Tent\RequestHandlers\CacheSizeHandler',
        'host'            => 'http://backend:8080',
        'cache_path'      => $cacheFolder,
        'cache_size_tool' => 'php_walk',
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/staff/cache/size.json', 'type' => 'exact'],
    ],
]);

Configuration::buildRule([
    'handler' => [
        'class'      => 'Tent\RequestHandlers\CacheClearHandler',
        'host'       => 'http://backend:8080',
        'cache_path' => $cacheFolder,
    ],
    'matchers' => [
        ['method' => 'DELETE', 'uri' => '/staff/cache/disk.json', 'type' => 'exact'],
    ],
]);
