<?php
/**
 * Frontend routing rules (production): the built SPA, served as static files.
 *
 * Both rules send `Cache-Control: max-age=10, public` themselves (issue
 * #1733). It used to come from the production .htaccess, which overwrote
 * whatever the rule sent; the .htaccess now only fills in a missing
 * Cache-Control, so the value has to be set here. Keep it short: `/` is
 * index.html, and a long max-age would delay every frontend release.
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'static',
        'location' => $staticRoot . '/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/assets', 'type' => 'begins_with'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\Middlewares\CacheControlMiddleware',
            'directive' => 'max-age=10, public'
        ]
    ]
    ]
);

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'static',
        'location' => $staticRoot . '/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\Middlewares\SetPathMiddleware',
            'path' => '/index.html'
        ],
        [
            'class' => 'Tent\Middlewares\CacheControlMiddleware',
            'directive' => 'max-age=10, public'
        ]
    ]
    ]
);
