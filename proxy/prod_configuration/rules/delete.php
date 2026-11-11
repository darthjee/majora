<?php
/**
 * Photo deletion (DeleteHandler) for character photos and staff photos
 * (DELETE /staff/photos/<photo_type>/<photo_id>.json). Loaded before
 * rules/backend.php so it takes precedence over the generic `.json` proxy.
 *
 * 'cache_path' is the cache root ($cacheFolder): X-Cache-Clear paths from
 * the backend's responses are cleared from it and from every domain folder
 * under it (ResponseCacheClearer::forRoot, cross-domain mode), so a staff
 * photo delete refreshes the game on all of its domains.
 *
 * 'secret' is the proxy secret ($proxySecret): the handler's backend calls
 * carry the client's REMOTE_ADDR in X-Forwarded-For authenticated by
 * X-Proxy-Secret (BackendClient), exactly as SetClientIpMiddleware does for
 * the plain proxy rules, so Django records the visitor's IP rather than the
 * proxy's.
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'class'       => 'Tent\RequestHandlers\DeleteHandler',
        'host'        => $backendHost,
        'photos_path' => $photosPath,
        'cache_path'  => $cacheFolder,
        'secret'      => $proxySecret,
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
