<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'           => 'Tent\RequestHandlers\CacheSizeHandler',
        'host'            => $backendHost,
        'cache_path'      => $cacheFolder,
        'cache_size_tool' => 'du',
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/staff/cache/size.json', 'type' => 'exact'],
    ],
]);
