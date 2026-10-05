<?php
/**
 * Admin routing rule.
 * Proxies all /admin/* requests to the Django backend, so Django admin
 * is reachable through the proxy instead of falling through to the
 * catch-all SPA redirect.
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
        'host' => 'http://backend:8080',
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['uri' => '/admin', 'type' => 'begins_with']
    ],
    'middlewares' => [
        [
            'class'  => 'Tent\\Middlewares\\SetClientIpMiddleware',
            'secret' => $proxySecret
        ],
        [
            'class' => 'Tent\Middlewares\SetHeadersMiddleware',
            'headers' => ['Host' => 'localhost']
        ]
    ]
    ]
);
