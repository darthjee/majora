<?php

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'static',
        'location' => $staticRoot,
        'conditional' => true
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/files', 'type' => 'begins_with'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\CacheControlMiddleware',
            'directive' => 'no-cache'
        ]
    ]
    ]
);
