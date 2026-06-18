<?php
/**
 * Redirect routing rules.
 * Catch-all redirect for bare GET paths (GET /path -> 302 /#/path).
 * Loaded last so frontend and backend rules always take precedence.
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost
    ],
    'matchers' => [
        ['method' => 'GET', 'pattern' => '/^\/(?!#\/)/', 'type' => 'regex'],
    ],
    'middlewares' => [
        [
            'class'       => 'Tent\Middlewares\RedirectMiddleware',
            'pattern'     => '/^(\/.*)$/',
            'replacement' => '/#$1'
        ]
    ]
]);
