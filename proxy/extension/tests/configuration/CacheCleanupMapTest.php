<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the merged $cacheCleanupMap built by
 * lib/configuration/cache_cleanup/cache_cleanup_map.php.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class CacheCleanupMapTest extends TestCase
{
    /**
     * Loads cache_cleanup_map.php and returns the $cacheCleanupMap it
     * builds. Uses `require` (not `require_once`) so each test gets a
     * fresh, independently-scoped copy of the map.
     */
    private function buildCacheCleanupMap(): array
    {
        require __DIR__ . '/../../lib/configuration/cache_cleanup/cache_cleanup_map.php';

        return $cacheCleanupMap;
    }

    /**
     * Closing a poll (a "date poll" may update a linked GameSession's date
     * via GameSessionCloseProcessor) must clear every cached session
     * list/detail response for the game.
     */
    public function testPollCloseClearsAllSessionCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/sessions.json',
            '/games/:game_slug/sessions/:session_id.json',
            '/games/:game_slug/sessions/past.json',
            '/games/:game_slug/sessions/future.json',
            '/games/:game_slug/sessions/unscheduled.json',
        ], $map['/games/:game_slug/polls/:poll_id/close.json']);
    }
}
