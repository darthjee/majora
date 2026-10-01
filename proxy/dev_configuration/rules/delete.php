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
        'class'       => 'Tent\RequestHandlers\DeleteHandler',
        'host'        => 'http://backend:8080',
        'photos_path' => '/var/www/html',
        'cache_path'  => $cacheFolder,
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
