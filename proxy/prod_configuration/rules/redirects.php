<?php
/**
 * Redirect routing rules.
 * Catch-all redirect for bare GET paths (GET /path -> 302 /#/path).
 * Loaded last so frontend and backend rules always take precedence.
 *
 * SetClientIpMiddleware (issue #1501) runs first: it sets X-Forwarded-For to
 * the client's REMOTE_ADDR and authenticates it with $proxySecret in
 * X-Proxy-Secret, so Django can trust the client IP.
 */

use Tent\Configuration;

Configuration::buildRule(
    [
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost,
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['method' => 'GET', 'pattern' => '/^\/(?!#\/)/', 'type' => 'regex'],
    ],
    'middlewares' => [
        [
            'class'  => 'Tent\\Middlewares\\SetClientIpMiddleware',
            'secret' => $proxySecret
        ],
        [
            'class'       => 'Tent\Middlewares\RedirectMiddleware',
            'pattern'     => '/^(\/.*)$/',
            'replacement' => '/#$1'
        ]
    ]
    ]
);
