<?php
/**
 * Cache-cleanup groups consumed by CacheCleanupMiddleware's `custom` option
 * (see rules/backend.php).
 *
 * Each group pairs a shared list of cache-target paths ('targets') with the
 * list of trigger routes ('routes') that, when hit by a mutating request,
 * clear those targets. Groups sharing a resource family's base target list
 * extend it rather than repeating it, per docs/agents/issues/438-reactor-proxy-rules.md.
 */

use Tent\Middlewares\CacheCleanupMapBuilder;

$npcsEntityTargets = [
    '/games/:game_slug/npcs.json',
    '/games/:game_slug/npcs/all.json',
    '/games/:game_slug/npcs/:character_id.json',
    '/games/:game_slug/npcs/:character_id/full.json',
    '/games/:game_slug/npcs/:character_id/photos.json',
];

$pcsEntityTargets = [
    '/games/:game_slug/pcs.json',
    '/games/:game_slug/pcs/:character_id.json',
    '/games/:game_slug/pcs/:character_id/full.json',
    '/games/:game_slug/pcs/:character_id/photos.json',
];

$cacheCleanupGroups = [
    // npcs.json (collection) — clearing the npcs list itself.
    [
        'targets' => [
            '/games/:game_slug/npcs.json',
            '/games/:game_slug/npcs/all.json',
        ],
        'routes' => [
            '/games/:game_slug/npcs.json',
        ],
    ],
    // npcs entity family — routes mutating a single NPC.
    [
        'targets' => $npcsEntityTargets,
        'routes' => [
            '/games/:game_slug/npcs/:character_id.json',
            '/games/:game_slug/npcs/:character_id/photo_upload.json',
            '/games/:game_slug/npcs/:character_id/slain.json',
        ],
    ],
    // npcs treasures acquire/sell — npcs entity targets plus the NPC's own
    // treasures list.
    [
        'targets' => array_merge($npcsEntityTargets, [
            '/games/:game_slug/npcs/:character_id/treasures.json',
        ]),
        'routes' => [
            '/games/:game_slug/npcs/:character_id/treasures/acquire.json',
            '/games/:game_slug/npcs/:character_id/treasures/sell.json',
        ],
    ],
    // pcs entity family — routes mutating a single PC.
    [
        'targets' => $pcsEntityTargets,
        'routes' => [
            '/games/:game_slug/pcs/:character_id.json',
            '/games/:game_slug/pcs/:character_id/photo_upload.json',
        ],
    ],
    // pcs treasures acquire/sell — pcs entity targets plus the PC's own
    // treasures list.
    [
        'targets' => array_merge($pcsEntityTargets, [
            '/games/:game_slug/pcs/:character_id/treasures.json',
        ]),
        'routes' => [
            '/games/:game_slug/pcs/:character_id/treasures/acquire.json',
            '/games/:game_slug/pcs/:character_id/treasures/sell.json',
        ],
    ],
    // treasures.json (collection).
    [
        'targets' => [
            '/games/:game_slug/treasures.json',
            '/treasures.json',
        ],
        'routes' => [
            '/games/:game_slug/treasures.json',
        ],
    ],
    // treasures entity — a single treasure.
    [
        'targets' => [
            '/games/:game_slug/treasures.json',
            '/games/:game_slug/treasures/:treasure_id.json',
            '/treasures/:treasure_id.json',
        ],
        'routes' => [
            '/games/:game_slug/treasures/:treasure_id.json',
        ],
    ],
    // Treasures
    [
        'targets' => [
          '/treasures.json',
          '/treasures/:treasure_id.json'
        ],
        'routes' => [
            '/treasures.json',
            '/treasures/:treasure_id.json',
            '/games/:game_slug/treasures/:treasure_id.json',
            '/games/:game_slug/npcs/:character_id/treasures/acquire.json',
            '/games/:game_slug/npcs/:character_id/treasures/sell.json',
        ],
    ],
];

$cacheCleanupMap = CacheCleanupMapBuilder::build($cacheCleanupGroups);
