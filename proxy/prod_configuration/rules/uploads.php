<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'       => 'Tent\RequestHandlers\PhotoUploadHandler',
        'host'        => 'http://backend:8080',
        'photos_path' => $photosPath,
    ],
    'matchers' => [
        ['method' => 'POST', 'uri' => '/uploads/', 'type' => 'begins_with'],
    ],
]);
