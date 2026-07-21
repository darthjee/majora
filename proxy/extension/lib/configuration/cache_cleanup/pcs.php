<?php
/**
 * Cache-cleanup groups for the pcs resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * Each group pairs a shared list of cache-target paths ('targets') with the
 * list of trigger routes ('routes') that, when hit by a mutating request,
 * clear those targets. Groups sharing a resource family's base target list
 * extend it rather than repeating it, per docs/agents/issues/438-reactor-proxy-rules.md.
 *
 * @return array List of pcs-family cache-cleanup groups.
 */

$pcsEntityTargets = [
    '/games/:game_slug/pcs.json',
    '/games/:game_slug/pcs/:character_id.json',
    '/games/:game_slug/pcs/:character_id/full.json',
    '/games/:game_slug/pcs/:character_id/photos.json',
];

return [
    // pcs entity family — routes mutating a single PC.
    [
        'targets' => $pcsEntityTargets,
        'routes' => [
            '/games/:game_slug/pcs/:character_id.json',
            '/games/:game_slug/pcs/:character_id/full.json',
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
    // pcs items — a PC's item photo-upload route.
    [
        'targets' => [
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id/full.json',
        ],
        'routes' => [
            '/games/:game_slug/pcs/:character_id/items/:item_id/photo_upload.json',
        ],
    ],
];
