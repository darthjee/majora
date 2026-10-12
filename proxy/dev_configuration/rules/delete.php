<?php
/**
 * Photo deletion (DeleteHandler) for character photos and staff photos
 * (DELETE /staff/photos/<photo_type>/<photo_id>.json). Loaded before
 * rules/backend.php so it takes precedence over the generic `.json` proxy.
 *
 * 'cache_path' is the cache root ($cacheFolder): X-Cache-Clear paths from
 * the backend's responses are cleared from it and from every domain folder
 * under it (ResponseCacheClearer::forRoot, cross-domain mode). Dev's flat
 * layout has no domain folders, so only the root itself is cleared.
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
        [
            'method'  => 'DELETE',
            'pattern' => '#^/staff/photos/[a-z0-9_-]+/\d+\.json$#',
            'type'    => 'regex',
        ],
    ],
    ]
);
