<?php
/**
 * Cache-cleanup groups for the games resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * Each group pairs a shared list of cache-target paths ('targets') with the
 * list of trigger routes ('routes') that, when hit by a mutating request,
 * clear those targets.
 *
 * This group is scoped strictly to the game's cover photo_upload route.
 * Editing a game's own detail (PATCH games/:game_slug.json) is a separate,
 * pre-existing gap that is deliberately not cleared here — see
 * docs/agents/issues/1094-photo-upload-routes-missing-proxy-cache-cleanup-rules.md.
 *
 * @return array List of games-family cache-cleanup groups.
 */

return [
    // games entity family — the game's own cover photo upload. GameListSerializer
    // (used by both games.json and my-games.json) embeds photo_path, so both
    // list endpoints need to be cleared alongside the game's own detail.
    [
        'targets' => [
            '/games.json',
            '/my-games.json',
            '/games/:game_slug.json',
        ],
        'routes' => [
            '/games/:game_slug/photo_upload.json',
        ],
    ],
];
