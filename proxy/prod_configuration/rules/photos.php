<?php
/**
 * Uploaded photos, served as static files with conditional requests.
 *
 * `Cache-Control: no-cache`: the client may store the file but revalidates
 * it on every use, so a replaced file is seen at once. Until issue #1733 the
 * production .htaccess overwrote this with `max-age=10, public`; it no
 * longer does, so `no-cache` is what clients now receive.
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'static',
        'location' => $staticRoot,
        'conditional' => true
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/photos', 'type' => 'begins_with'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\CacheControlMiddleware',
            'directive' => 'no-cache'
        ]
    ]
    ]
);
