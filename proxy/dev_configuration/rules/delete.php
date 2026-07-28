<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'       => 'Tent\RequestHandlers\DeleteHandler',
        'host'        => 'http://backend:8080',
        'photos_path' => '/var/www/html',
    ],
    'matchers' => [
        [
            'method'  => 'DELETE',
            'pattern' => '#^/games/[^/]+/(pcs|npcs)/\d+/photos/\d+\.json$#',
            'type'    => 'regex',
        ],
    ],
]);
