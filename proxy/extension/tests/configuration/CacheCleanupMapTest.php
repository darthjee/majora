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

    /**
     * Uploading a GameItem's photo must clear every cached item list/detail
     * response for the game.
     */
    public function testItemPhotoUploadClearsAllItemCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/items.json',
            '/games/:game_slug/items/all.json',
            '/games/:game_slug/items/:item_id.json',
            '/games/:game_slug/items/:item_id/full.json',
        ], $map['/games/:game_slug/items/:item_id/photo_upload.json']);
    }

    /**
     * Updating a GameItem must clear every cached item list/detail response
     * for the game.
     */
    public function testItemUpdateClearsAllItemCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/items.json',
            '/games/:game_slug/items/all.json',
            '/games/:game_slug/items/:item_id.json',
            '/games/:game_slug/items/:item_id/full.json',
        ], $map['/games/:game_slug/items/:item_id.json']);
    }

    /**
     * Uploading a PC's item's photo must clear every cached item list/detail
     * response for that PC.
     */
    public function testPcItemPhotoUploadClearsAllPcItemCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id/full.json',
        ], $map['/games/:game_slug/pcs/:character_id/items/:item_id/photo_upload.json']);
    }

    /**
     * Updating a PC's item must clear every cached item list/detail response
     * for that PC.
     */
    public function testPcItemUpdateClearsAllPcItemCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id/full.json',
        ], $map['/games/:game_slug/pcs/:character_id/items/:item_id.json']);
    }

    /**
     * Uploading an NPC's item's photo must clear every cached item
     * list/detail response for that NPC.
     */
    public function testNpcItemPhotoUploadClearsAllNpcItemCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs/:character_id/items.json',
            '/games/:game_slug/npcs/:character_id/items/all.json',
            '/games/:game_slug/npcs/:character_id/items/:item_id.json',
            '/games/:game_slug/npcs/:character_id/items/:item_id/full.json',
        ], $map['/games/:game_slug/npcs/:character_id/items/:item_id/photo_upload.json']);
    }

    /**
     * Updating an NPC's item must clear every cached item list/detail
     * response for that NPC.
     */
    public function testNpcItemUpdateClearsAllNpcItemCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs/:character_id/items.json',
            '/games/:game_slug/npcs/:character_id/items/all.json',
            '/games/:game_slug/npcs/:character_id/items/:item_id.json',
            '/games/:game_slug/npcs/:character_id/items/:item_id/full.json',
        ], $map['/games/:game_slug/npcs/:character_id/items/:item_id.json']);
    }
}
