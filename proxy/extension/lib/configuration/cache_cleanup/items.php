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
 * The character-scoped pcs/npcs items groups below (detail/photo-upload and
 * acquire/remove, including their bulk variants) are colocated here rather
 * than in pcs.php/npcs.php since they belong to the items entity's own
 * cache-cleanup logic.
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
    // pcs items — a PC's item detail/photo-upload route.
    [
        'targets' => [
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id/full.json',
        ],
        'routes' => [
            '/games/:game_slug/pcs/:character_id/items/:item_id.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id/photo_upload.json',
        ],
    ],
    // pcs items acquire/remove (single and bulk) — clears the PC's items list.
    [
        'targets' => [
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
        ],
        'routes' => [
            '/games/:game_slug/pcs/:character_id/items/acquire.json',
            '/games/:game_slug/pcs/:character_id/items/acquire/all.json',
            '/games/:game_slug/pcs/:character_id/items/remove.json',
            '/games/:game_slug/pcs/:character_id/items/remove/all.json',
        ],
    ],
    // npcs items — an NPC's item detail/photo-upload route.
    [
        'targets' => [
            '/games/:game_slug/npcs/:character_id/items.json',
            '/games/:game_slug/npcs/:character_id/items/all.json',
            '/games/:game_slug/npcs/:character_id/items/:item_id.json',
            '/games/:game_slug/npcs/:character_id/items/:item_id/full.json',
        ],
        'routes' => [
            '/games/:game_slug/npcs/:character_id/items/:item_id.json',
            '/games/:game_slug/npcs/:character_id/items/:item_id/photo_upload.json',
        ],
    ],
    // npcs items acquire/remove (single and bulk) — clears the NPC's items list.
    [
        'targets' => [
            '/games/:game_slug/npcs/:character_id/items.json',
            '/games/:game_slug/npcs/:character_id/items/all.json',
        ],
        'routes' => [
            '/games/:game_slug/npcs/:character_id/items/acquire.json',
            '/games/:game_slug/npcs/:character_id/items/acquire/all.json',
            '/games/:game_slug/npcs/:character_id/items/remove.json',
            '/games/:game_slug/npcs/:character_id/items/remove/all.json',
        ],
    ],
];
