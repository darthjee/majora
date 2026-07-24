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
 * The character-scoped treasures and items cache-cleanup groups for PCs live
 * in treasures.php and items.php respectively, colocated with the rest of
 * each connected entity's cache-cleanup logic — this file only keeps the
 * groups for routes unique to the PC entity itself.
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
];
