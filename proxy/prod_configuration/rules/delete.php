<?php

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'class'       => 'Tent\RequestHandlers\DeleteHandler',
        'host'        => $backendHost,
        'photos_path' => $photosPath,
    ],
    'matchers' => [
        [
            'method'  => 'DELETE',
            'pattern' => '#^/games/[^/]+/(pcs|npcs)/\d+/photos/\d+\.json$#',
            'type'    => 'regex',
        ],
    ],
    ]
);
