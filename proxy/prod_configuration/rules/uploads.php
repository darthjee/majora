<?php

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'class'       => 'Tent\RequestHandlers\UploadHandler',
        'host'        => $backendHost,
        'photos_path' => $photosPath,
        'files_path'  => $filesPath,
    ],
    'matchers' => [
        ['method' => 'POST', 'uri' => '/uploads/', 'type' => 'begins_with'],
    ],
    ]
);
