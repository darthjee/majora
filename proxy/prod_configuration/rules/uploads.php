<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class' => 'Tent\RequestHandlers\PhotoUploadHandler',
        'host'  => 'http://backend:8080',
    ],
    'matchers' => [
        ['method' => 'PATCH', 'uri' => '/uploads/', 'type' => 'begins_with'],
    ],
]);
