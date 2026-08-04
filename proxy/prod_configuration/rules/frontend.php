<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'static',
        'location' => $staticRoot . '/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/assets', 'type' => 'begins_with'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\Middlewares\CacheControlMiddleware',
            'maxAgeSeconds' => 60 * 60 * 24
        ]
    ]
]);

Configuration::buildRule([
    'handler' => [
        'type' => 'static',
        'location' => $staticRoot . '/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\Middlewares\SetPathMiddleware',
            'path' => '/index.html'
        ],
        [
            'class' => 'Tent\Middlewares\CacheControlMiddleware',
            'maxAgeSeconds' => 60 * 60 * 24
        ]
    ]
]);
