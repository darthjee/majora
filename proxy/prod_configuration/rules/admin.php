<?php
/**
 * Admin routing rule.
 * Proxies all /admin/* requests to the backend, so Django admin pages
 * are served directly instead of falling through to the catch-all
 * SPA redirect. Admin's static assets are served by the existing
 * frontend.php rule, since STATIC_URL ('assets/') resolves them under
 * the same /assets prefix already served from the static build folder.
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
        'host' => $backendHost
    ],
    'matchers' => [
        ['uri' => '/admin', 'type' => 'begins_with']
    ],
    'middlewares' => [
        [
            'class'  => 'Tent\\Middlewares\\SetClientIpMiddleware',
            'secret' => $proxySecret
        ]
    ]
    ]
);
