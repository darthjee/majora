<?php
/**
 * Cache-cleanup groups for the factions resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * Each group pairs a shared list of cache-target paths ('targets') with the
 * list of trigger routes ('routes') that, when hit by a mutating request,
 * clear those targets.
 *
 * @return array List of factions-family cache-cleanup groups.
 */

return [
    // Factions entity family — routes mutating a single GameFaction.
    [
        'targets' => [
            '/games/:game_slug/factions.json',
            '/games/:game_slug/factions/:faction_id.json',
        ],
        'routes' => [
            '/games/:game_slug/factions/:faction_id.json',
            '/games/:game_slug/factions/:faction_id/photo_upload.json',
        ],
    ],
];
