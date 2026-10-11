<?php
/**
 * Upload routes.
 *
 * - UploadHandler: POST /uploads/<image|file>/<id>/submit (multipart upload).
 * - LinkHandler: POST /uploads/link/<image|file>/<id>/submit (issue #1570),
 *   hard-links a game content copy's photo/file to its source.
 *
 * Both matchers are anchored regexes, so each request reaches the right
 * handler whatever the rule order.
 *
 * UploadHandler's 'cache_path' is where X-Cache-Clear paths from the
 * backend's responses are cleared (see ResponseCacheClearer); it must match
 * the cache folder used by rules/backend.php. LinkHandler's 'cache_path' is
 * the cache root: it clears across every domain folder (cross-domain mode).
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
        ['method' => 'POST', 'pattern' => '#^/uploads/(image|file)/\d+/submit$#', 'type' => 'regex'],
    ],
    ]
);

Configuration::buildRule(
    [
    'handler' => [
        'class'       => 'Tent\RequestHandlers\LinkHandler',
        'host'        => 'http://backend:8080',
        'photos_path' => '/var/www/html',
        'files_path'  => '/var/www/html',
        'cache_path'  => $cacheFolder,
    ],
    'matchers' => [
        ['method' => 'POST', 'pattern' => '#^/uploads/link/(image|file)/\d+/submit$#', 'type' => 'regex'],
    ],
    ]
);
