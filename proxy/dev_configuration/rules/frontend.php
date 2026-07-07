<?php
/**
 * Frontend routing rules.
 * In development mode, proxies requests to the Vite dev server.
 * In production mode, serves static files directly.
 */

use Tent\Configuration;

if (getenv('FRONTEND_DEV_MODE') === 'true') {
    // Development mode: forward to the Vite server (HMR)
    Configuration::buildRule([
        'handler' => [
            'type' => 'proxy',
            'host' => 'http://frontend:8080'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
            ['method' => 'GET', 'uri' => '/assets/js/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/assets/css/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/assets/images/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@vite/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/node_modules/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@react-refresh', 'type' => 'exact'],
        ]
    ]);
} else {
    // Production mode: serve static files from docker_volumes/static/
    Configuration::buildRule([
        'handler' => [
            'type' => 'static',
            'location' => '/var/www/html/static'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/assets', 'type' => 'begins_with'],
        ],
        'middlewares' => [
            [
                'class' => 'Tent\Middlewares\CacheControlMiddleware',
                'maxAgeSeconds' => 60 * 60 * 24
            ]
        ]
    ]);
    Configuration::buildRule([
        'handler' => [
            'type' => 'static',
            'location' => '/var/www/html/static'
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
                'maxAgeSeconds' => 60 * 60 * 24
            ]
        ]
    ]);
}
