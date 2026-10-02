<?php

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'static',
        'location' => '/var/www/html/files',
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
