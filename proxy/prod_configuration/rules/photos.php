<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'static',
        'location' => '/home/moria_user/moria.ffavs.net'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/photos', 'type' => 'begins_with'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\CacheControlMiddleware',
            'maxAgeSeconds' => 60 * 60 * 24 * 7
        ]
    ]
]);
