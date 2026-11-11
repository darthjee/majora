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
 * Dev's flat layout has no domain folders, so only the root itself is
 * cleared.
 *
 * Both handlers' 'secret' is the proxy secret ($proxySecret): their backend
 * calls carry the client's REMOTE_ADDR in X-Forwarded-For authenticated by
 * X-Proxy-Secret (BackendClient), exactly as SetClientIpMiddleware does for
 * the plain proxy rules, so Django records the visitor's IP rather than the
 * proxy's.
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
        'secret'      => $proxySecret,
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
        'secret'      => $proxySecret,
    ],
    'matchers' => [
        ['method' => 'POST', 'pattern' => '#^/uploads/link/(image|file)/\d+/submit$#', 'type' => 'regex'],
    ],
    ]
);
