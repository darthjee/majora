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

    /**
     * Buying a treasure for a PC must clear the PC's own entity/treasures
     * caches (the character-scoped treasures group now lives in
     * treasures.php instead of pcs.php).
     */
    public function testPcTreasureBuyClearsAllPcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs.json',
            '/games/:game_slug/pcs/:character_id.json',
            '/games/:game_slug/pcs/:character_id/full.json',
            '/games/:game_slug/pcs/:character_id/photos.json',
            '/games/:game_slug/pcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/pcs/:character_id/treasures/buy.json']);
    }

    /**
     * Selling a PC's treasure must clear the same PC-scoped treasures
     * targets as buying.
     */
    public function testPcTreasureSellClearsAllPcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs.json',
            '/games/:game_slug/pcs/:character_id.json',
            '/games/:game_slug/pcs/:character_id/full.json',
            '/games/:game_slug/pcs/:character_id/photos.json',
            '/games/:game_slug/pcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/pcs/:character_id/treasures/sell.json']);
    }

    /**
     * Acquiring a treasure for a PC must clear the same PC-scoped treasures
     * targets as buying.
     */
    public function testPcTreasureAcquireClearsAllPcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs.json',
            '/games/:game_slug/pcs/:character_id.json',
            '/games/:game_slug/pcs/:character_id/full.json',
            '/games/:game_slug/pcs/:character_id/photos.json',
            '/games/:game_slug/pcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/pcs/:character_id/treasures/acquire.json']);
    }

    /**
     * Bulk-acquiring treasures for a PC must clear the same PC-scoped
     * treasures targets as a single acquire.
     */
    public function testPcTreasureAcquireAllClearsAllPcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs.json',
            '/games/:game_slug/pcs/:character_id.json',
            '/games/:game_slug/pcs/:character_id/full.json',
            '/games/:game_slug/pcs/:character_id/photos.json',
            '/games/:game_slug/pcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/pcs/:character_id/treasures/acquire/all.json']);
    }

    /**
     * Removing a PC's treasure must clear the same PC-scoped treasures
     * targets as acquiring.
     */
    public function testPcTreasureRemoveClearsAllPcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs.json',
            '/games/:game_slug/pcs/:character_id.json',
            '/games/:game_slug/pcs/:character_id/full.json',
            '/games/:game_slug/pcs/:character_id/photos.json',
            '/games/:game_slug/pcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/pcs/:character_id/treasures/remove.json']);
    }

    /**
     * Buying a treasure for an NPC must clear the NPC's own
     * entity/treasures caches. This route is also listed in the legacy
     * global-catalog group above, but the character-scoped group defined
     * later in treasures.php wins, so the NPC's own treasures list is
     * cleared too (bringing NPC behavior to parity with PCs).
     */
    public function testNpcTreasureBuyClearsAllNpcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs.json',
            '/games/:game_slug/npcs/all.json',
            '/games/:game_slug/npcs/:character_id.json',
            '/games/:game_slug/npcs/:character_id/full.json',
            '/games/:game_slug/npcs/:character_id/photos.json',
            '/games/:game_slug/npcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/npcs/:character_id/treasures/buy.json']);
    }

    /**
     * Selling an NPC's treasure must clear the same NPC-scoped treasures
     * targets as buying.
     */
    public function testNpcTreasureSellClearsAllNpcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs.json',
            '/games/:game_slug/npcs/all.json',
            '/games/:game_slug/npcs/:character_id.json',
            '/games/:game_slug/npcs/:character_id/full.json',
            '/games/:game_slug/npcs/:character_id/photos.json',
            '/games/:game_slug/npcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/npcs/:character_id/treasures/sell.json']);
    }

    /**
     * Acquiring a treasure for an NPC must clear the same NPC-scoped
     * treasures targets as buying.
     */
    public function testNpcTreasureAcquireClearsAllNpcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs.json',
            '/games/:game_slug/npcs/all.json',
            '/games/:game_slug/npcs/:character_id.json',
            '/games/:game_slug/npcs/:character_id/full.json',
            '/games/:game_slug/npcs/:character_id/photos.json',
            '/games/:game_slug/npcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/npcs/:character_id/treasures/acquire.json']);
    }

    /**
     * Bulk-acquiring treasures for an NPC must clear the same NPC-scoped
     * treasures targets as a single acquire.
     */
    public function testNpcTreasureAcquireAllClearsAllNpcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs.json',
            '/games/:game_slug/npcs/all.json',
            '/games/:game_slug/npcs/:character_id.json',
            '/games/:game_slug/npcs/:character_id/full.json',
            '/games/:game_slug/npcs/:character_id/photos.json',
            '/games/:game_slug/npcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/npcs/:character_id/treasures/acquire/all.json']);
    }

    /**
     * Removing an NPC's treasure must clear the same NPC-scoped treasures
     * targets as acquiring.
     */
    public function testNpcTreasureRemoveClearsAllNpcTreasureCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs.json',
            '/games/:game_slug/npcs/all.json',
            '/games/:game_slug/npcs/:character_id.json',
            '/games/:game_slug/npcs/:character_id/full.json',
            '/games/:game_slug/npcs/:character_id/photos.json',
            '/games/:game_slug/npcs/:character_id/treasures.json',
        ], $map['/games/:game_slug/npcs/:character_id/treasures/remove.json']);
    }

    /**
     * Acquiring an item for a PC must clear that PC's items list caches.
     */
    public function testPcItemAcquireClearsPcItemsListCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
        ], $map['/games/:game_slug/pcs/:character_id/items/acquire.json']);
    }

    /**
     * Bulk-acquiring items for a PC must clear that PC's items list caches.
     */
    public function testPcItemAcquireAllClearsPcItemsListCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
        ], $map['/games/:game_slug/pcs/:character_id/items/acquire/all.json']);
    }

    /**
     * Removing an item from a PC must clear that PC's items list caches.
     */
    public function testPcItemRemoveClearsPcItemsListCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
        ], $map['/games/:game_slug/pcs/:character_id/items/remove.json']);
    }

    /**
     * Bulk-removing items from a PC must clear that PC's items list caches.
     */
    public function testPcItemRemoveAllClearsPcItemsListCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
        ], $map['/games/:game_slug/pcs/:character_id/items/remove/all.json']);
    }

    /**
     * Acquiring an item for an NPC must clear that NPC's items list caches.
     */
    public function testNpcItemAcquireClearsNpcItemsListCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs/:character_id/items.json',
            '/games/:game_slug/npcs/:character_id/items/all.json',
        ], $map['/games/:game_slug/npcs/:character_id/items/acquire.json']);
    }

    /**
     * Bulk-acquiring items for an NPC must clear that NPC's items list
     * caches.
     */
    public function testNpcItemAcquireAllClearsNpcItemsListCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs/:character_id/items.json',
            '/games/:game_slug/npcs/:character_id/items/all.json',
        ], $map['/games/:game_slug/npcs/:character_id/items/acquire/all.json']);
    }

    /**
     * Removing an item from an NPC must clear that NPC's items list caches.
     */
    public function testNpcItemRemoveClearsNpcItemsListCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs/:character_id/items.json',
            '/games/:game_slug/npcs/:character_id/items/all.json',
        ], $map['/games/:game_slug/npcs/:character_id/items/remove.json']);
    }

    /**
     * Bulk-removing items from an NPC must clear that NPC's items list
     * caches.
     */
    public function testNpcItemRemoveAllClearsNpcItemsListCacheTargets(): void
    {
        $map = $this->buildCacheCleanupMap();

        $this->assertSame([
            '/games/:game_slug/npcs/:character_id/items.json',
            '/games/:game_slug/npcs/:character_id/items/all.json',
        ], $map['/games/:game_slug/npcs/:character_id/items/remove/all.json']);
    }
}
