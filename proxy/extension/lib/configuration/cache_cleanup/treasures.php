<?php
/**
 * Cache-cleanup groups for the treasures resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * Each group pairs a shared list of cache-target paths ('targets') with the
 * list of trigger routes ('routes') that, when hit by a mutating request,
 * clear those targets. Groups sharing a resource family's base target list
 * extend it rather than repeating it, per docs/agents/issues/438-reactor-proxy-rules.md.
 *
 * The character-scoped pcs/npcs treasures buy/sell/acquire/remove groups
 * below are colocated here (rather than in pcs.php/npcs.php) since they
 * belong to the treasures entity's own cache-cleanup logic. They are listed
 * after the game-wide groups above so that, for NPC routes overlapping with
 * the legacy global-catalog group further up, the character-scoped group
 * wins and clears the NPC's own treasures list as well.
 *
 * @return array List of treasures-family cache-cleanup groups.
 */

$pcsEntityTargets = [
    '/games/:game_slug/pcs.json',
    '/games/:game_slug/pcs/:character_id.json',
    '/games/:game_slug/pcs/:character_id/full.json',
    '/games/:game_slug/pcs/:character_id/photos.json',
];

$npcsEntityTargets = [
    '/games/:game_slug/npcs.json',
    '/games/:game_slug/npcs/all.json',
    '/games/:game_slug/npcs/:character_id.json',
    '/games/:game_slug/npcs/:character_id/full.json',
    '/games/:game_slug/npcs/:character_id/photos.json',
];

return [
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
            '/games/:game_slug/npcs/:character_id/treasures/buy.json',
            '/games/:game_slug/npcs/:character_id/treasures/sell.json',
            '/games/:game_slug/npcs/:character_id/treasures/acquire.json',
            '/games/:game_slug/npcs/:character_id/treasures/acquire/all.json',
            '/games/:game_slug/npcs/:character_id/treasures/remove.json',
        ],
    ],
    // pcs treasures buy/sell/acquire/remove — pcs entity targets plus the
    // PC's own treasures list.
    [
        'targets' => array_merge($pcsEntityTargets, [
            '/games/:game_slug/pcs/:character_id/treasures.json',
        ]),
        'routes' => [
            '/games/:game_slug/pcs/:character_id/treasures/buy.json',
            '/games/:game_slug/pcs/:character_id/treasures/sell.json',
            '/games/:game_slug/pcs/:character_id/treasures/acquire.json',
            '/games/:game_slug/pcs/:character_id/treasures/acquire/all.json',
            '/games/:game_slug/pcs/:character_id/treasures/remove.json',
        ],
    ],
    // npcs treasures buy/sell/acquire/remove — npcs entity targets plus the
    // NPC's own treasures list.
    [
        'targets' => array_merge($npcsEntityTargets, [
            '/games/:game_slug/npcs/:character_id/treasures.json',
        ]),
        'routes' => [
            '/games/:game_slug/npcs/:character_id/treasures/buy.json',
            '/games/:game_slug/npcs/:character_id/treasures/sell.json',
            '/games/:game_slug/npcs/:character_id/treasures/acquire.json',
            '/games/:game_slug/npcs/:character_id/treasures/acquire/all.json',
            '/games/:game_slug/npcs/:character_id/treasures/remove.json',
        ],
    ],
];
