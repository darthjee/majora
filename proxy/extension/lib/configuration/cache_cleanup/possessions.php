<?php
/**
 * Cache-cleanup groups for the possessions resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * Each group pairs a shared list of cache-target paths ('targets') with the
 * list of trigger routes ('routes') that, when hit by a mutating request,
 * clear those targets.
 *
 * @return array List of possessions-family cache-cleanup groups.
 */

return [
    // possessions entity family — routes mutating a single GamePossession.
    [
        'targets' => [
            '/games/:game_slug/possessions.json',
            '/games/:game_slug/possessions/all.json',
            '/games/:game_slug/possessions/:possession_id.json',
            '/games/:game_slug/possessions/:possession_id/full.json',
        ],
        'routes' => [
            '/games/:game_slug/possessions/:possession_id.json',
            '/games/:game_slug/possessions/:possession_id/photo_upload.json',
        ],
    ],
];
