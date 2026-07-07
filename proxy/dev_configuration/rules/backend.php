<?php
/**
 * Backend routing rules.
 * Forwards all .json requests to the Django backend.
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:8080',
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
                '/games/:game_slug/npcs/:character_id/photo_upload.json' => [
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
                '/games/:game_slug/pcs/:character_id/photo_upload.json' => [
                    '/games/:game_slug/pcs.json',
                    '/games/:game_slug/pcs/:character_id.json',
                    '/games/:game_slug/pcs/:character_id/full.json',
                ],
                '/games/:game_slug/pcs/:character_id/treasures/acquire.json' => [
                    '/games/:game_slug/pcs.json',
                    '/games/:game_slug/pcs/:character_id.json',
                    '/games/:game_slug/pcs/:character_id/full.json',
                    '/games/:game_slug/pcs/:character_id/treasures.json',
                ],
                '/games/:game_slug/pcs/:character_id/treasures/sell.json' => [
                    '/games/:game_slug/pcs.json',
                    '/games/:game_slug/pcs/:character_id.json',
                    '/games/:game_slug/pcs/:character_id/full.json',
                    '/games/:game_slug/pcs/:character_id/treasures.json',
                ],
                '/games/:game_slug/npcs/:character_id/treasures/acquire.json' => [
                    '/games/:game_slug/npcs.json',
                    '/games/:game_slug/npcs/all.json',
                    '/games/:game_slug/npcs/:character_id.json',
                    '/games/:game_slug/npcs/:character_id/full.json',
                    '/games/:game_slug/npcs/:character_id/treasures.json',
                ],
                '/games/:game_slug/npcs/:character_id/treasures/sell.json' => [
                    '/games/:game_slug/npcs.json',
                    '/games/:game_slug/npcs/all.json',
                    '/games/:game_slug/npcs/:character_id.json',
                    '/games/:game_slug/npcs/:character_id/full.json',
                    '/games/:game_slug/npcs/:character_id/treasures.json',
                ],
                '/games/:game_slug/treasures.json' => [
                    '/games/:game_slug/treasures.json',
                    '/treasures.json',
                ],
                '/games/:game_slug/treasures/:treasure_id.json' => [
                    '/games/:game_slug/treasures.json',
                    '/games/:game_slug/treasures/:treasure_id.json',
                    '/treasures/:treasure_id.json',
                ],
            ]
        ],
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => './cache',
            'host' => 'http://backend:8080',
            'maxAgeSeconds' => 10
        ]
    ]
]);
