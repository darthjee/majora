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
 * Both handlers' 'cache_path' is the cache root ($cacheFolder): X-Cache-Clear
 * paths from the backend's responses are cleared from it and from every
 * domain folder under it (ResponseCacheClearer::forRoot, cross-domain mode).
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'class'       => 'Tent\RequestHandlers\UploadHandler',
        'host'        => $backendHost,
        'photos_path' => $photosPath,
        'files_path'  => $filesPath,
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
        'host'        => $backendHost,
        'photos_path' => $photosPath,
        'files_path'  => $filesPath,
        'cache_path'  => $cacheFolder,
    ],
    'matchers' => [
        ['method' => 'POST', 'pattern' => '#^/uploads/link/(image|file)/\d+/submit$#', 'type' => 'regex'],
    ],
    ]
);
