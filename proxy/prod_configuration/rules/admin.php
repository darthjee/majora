<?php
/**
 * Admin routing rule.
 * Proxies all /admin/* requests to the backend, so Django admin pages
 * are served directly instead of falling through to the catch-all
 * SPA redirect. Admin's static assets are served by the existing
 * frontend.php rule, since STATIC_URL ('assets/') resolves them under
 * the same /assets prefix already served from the static build folder.
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost
    ],
    'matchers' => [
        ['uri' => '/admin', 'type' => 'begins_with']
    ]
]);
