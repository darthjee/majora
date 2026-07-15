<?php
/**
 * Cache-cleanup groups for the npcs resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * Each group pairs a shared list of cache-target paths ('targets') with the
 * list of trigger routes ('routes') that, when hit by a mutating request,
 * clear those targets. Groups sharing a resource family's base target list
 * extend it rather than repeating it, per docs/agents/issues/438-reactor-proxy-rules.md.
 *
 * @return array List of npcs-family cache-cleanup groups.
 */

$npcsEntityTargets = [
    '/games/:game_slug/npcs.json',
    '/games/:game_slug/npcs/all.json',
    '/games/:game_slug/npcs/:character_id.json',
    '/games/:game_slug/npcs/:character_id/full.json',
    '/games/:game_slug/npcs/:character_id/photos.json',
];

return [
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
            '/games/:game_slug/npcs/:character_id/full.json',
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
];
