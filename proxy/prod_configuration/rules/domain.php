<?php
/**
 * Per-domain static files (e.g. the manually uploaded favicons).
 *
 * Sends `Cache-Control: max-age=10, public` itself (issue #1733). It used to
 * come from the production .htaccess, which overwrote whatever the rule
 * sent; the .htaccess now only fills in a missing Cache-Control, so the
 * value has to be set here.
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'static',
        'location' => $staticRoot
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/domain', 'type' => 'begins_with'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\CacheControlMiddleware',
            'directive' => 'max-age=10, public'
        ]
    ]
    ]
);
