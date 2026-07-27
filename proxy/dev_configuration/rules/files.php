<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'static',
        'location' => '/var/www/html/files'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/files', 'type' => 'begins_with'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\CacheControlMiddleware',
            'maxAgeSeconds' => 60 * 60 * 24 * 7
        ]
    ]
]);
