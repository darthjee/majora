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
 * @return array List of treasures-family cache-cleanup groups.
 */

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
        ],
    ],
];
