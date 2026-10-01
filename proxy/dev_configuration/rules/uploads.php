<?php
/**
 * 'cache_path' is where X-Cache-Clear paths from the backend's responses
 * are cleared (see ResponseCacheClearer); it must match the cache folder
 * used by rules/backend.php.
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'class'       => 'Tent\RequestHandlers\UploadHandler',
        'host'        => 'http://backend:8080',
        'photos_path' => '/var/www/html',
        'files_path'  => '/var/www/html',
        'cache_path'  => $cacheFolder,
    ],
    'matchers' => [
        ['method' => 'POST', 'uri' => '/uploads/', 'type' => 'begins_with'],
    ],
    ]
);
