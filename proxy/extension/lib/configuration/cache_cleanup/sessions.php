<?php
/**
 * Cache-cleanup groups for the sessions resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * @return array List of sessions-family cache-cleanup groups.
 */

return [
    // Closing a poll may update a linked GameSession's date
    // (see GameSessionCloseProcessor), so it must clear all cached session
    // list/detail responses for the game.
    [
        'targets' => [
            '/games/:game_slug/sessions.json',
            '/games/:game_slug/sessions/:session_id.json',
            '/games/:game_slug/sessions/past.json',
            '/games/:game_slug/sessions/future.json',
            '/games/:game_slug/sessions/unscheduled.json',
        ],
        'routes' => [
            '/games/:game_slug/polls/:poll_id/close.json',
        ],
    ],
];
