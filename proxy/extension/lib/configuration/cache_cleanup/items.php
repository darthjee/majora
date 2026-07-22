<?php
/**
 * Cache-cleanup groups for the items resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * Each group pairs a shared list of cache-target paths ('targets') with the
 * list of trigger routes ('routes') that, when hit by a mutating request,
 * clear those targets. Groups sharing a resource family's base target list
 * extend it rather than repeating it, per docs/agents/issues/438-reactor-proxy-rules.md.
 *
 * @return array List of items-family cache-cleanup groups.
 */

return [
    // items entity family — routes mutating a single GameItem.
    [
        'targets' => [
            '/games/:game_slug/items.json',
            '/games/:game_slug/items/all.json',
            '/games/:game_slug/items/:item_id.json',
            '/games/:game_slug/items/:item_id/full.json',
        ],
        'routes' => [
            '/games/:game_slug/items/:item_id.json',
            '/games/:game_slug/items/:item_id/photo_upload.json',
        ],
    ],
];
