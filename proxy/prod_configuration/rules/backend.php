<?php

use Tent\Configuration;
use Tent\Models\Rule;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Models\Server;
use Tent\Models\RequestMatcher;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost,
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['uri' => '.json', 'type' => 'ends_with']
    ],
    'middlewares' => [
        [
            'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
            'location' => './cache',
            'clear'    => ['collection', 'entity'],
            'custom'   => [
                '/games/:game_slug/npcs.json' => [
                    '/games/:game_slug/npcs.json',
                    '/games/:game_slug/npcs/all.json',
                ],
                '/games/:game_slug/npcs/:character_id.json' => [
                    '/games/:game_slug/npcs.json',
                    '/games/:game_slug/npcs/all.json',
                    '/games/:game_slug/npcs/:character_id.json',
                    '/games/:game_slug/npcs/:character_id/full.json',
                ],
                '/games/:game_slug/npcs/:character_id/slain.json' => [
                    '/games/:game_slug/npcs.json',
                    '/games/:game_slug/npcs/all.json',
                    '/games/:game_slug/npcs/:character_id.json',
                    '/games/:game_slug/npcs/:character_id/full.json',
                ],
                '/games/:game_slug/pcs/:character_id.json' => [
                    '/games/:game_slug/pcs.json',
                    '/games/:game_slug/pcs/:character_id.json',
                    '/games/:game_slug/pcs/:character_id/full.json',
                ],
            ]
        ],
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => './cache',
            'host' => $backendHost,
            'maxAgeSeconds' => 10
        ]
    ]
]);
