<?php
/**
 * 'cache_path' is where X-Cache-Clear paths from the backend's responses
 * are cleared (see ResponseCacheClearer); it must match rules/backend.php's
 * domain-scoped cache location.
 */

use Tent\Cache\DomainHash;
use Tent\Configuration;
use Tent\Models\Request;

$responseCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());

Configuration::buildRule(
    [
    'handler' => [
        'class'       => 'Tent\RequestHandlers\DeleteHandler',
        'host'        => $backendHost,
        'photos_path' => $photosPath,
        'cache_path'  => $responseCacheLocation,
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
