<?php

namespace Tent\Middlewares\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Middlewares\CacheCleanupMapBuilder;

/**
 * Unit tests for CacheCleanupMapBuilder.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class CacheCleanupMapBuilderTest extends TestCase
{
    /**
     * A single group with multiple routes all maps to the same targets.
     */
    public function testSingleGroupWithMultipleRoutes(): void
    {
        $groups = [
            [
                'targets' => [
                    '/games/:game_slug/npcs.json',
                    '/games/:game_slug/npcs/all.json',
                ],
                'routes' => [
                    '/games/:game_slug/npcs/:character_id.json',
                    '/games/:game_slug/npcs/:character_id/slain.json',
                ],
            ],
        ];

        $map = CacheCleanupMapBuilder::build($groups);

        $this->assertSame([
            '/games/:game_slug/npcs/:character_id.json' => [
                '/games/:game_slug/npcs.json',
                '/games/:game_slug/npcs/all.json',
            ],
            '/games/:game_slug/npcs/:character_id/slain.json' => [
                '/games/:game_slug/npcs.json',
                '/games/:game_slug/npcs/all.json',
            ],
        ], $map);
    }

    /**
     * Multiple groups are merged into a single flat map.
     */
    public function testMultipleGroupsAreMerged(): void
    {
        $groups = [
            [
                'targets' => ['/games/:game_slug/npcs.json'],
                'routes'  => ['/games/:game_slug/npcs.json'],
            ],
            [
                'targets' => ['/games/:game_slug/pcs.json'],
                'routes'  => ['/games/:game_slug/pcs/:character_id.json'],
            ],
        ];

        $map = CacheCleanupMapBuilder::build($groups);

        $this->assertSame([
            '/games/:game_slug/npcs.json' => ['/games/:game_slug/npcs.json'],
            '/games/:game_slug/pcs/:character_id.json' => ['/games/:game_slug/pcs.json'],
        ], $map);
    }

    /**
     * An empty groups input produces an empty map.
     */
    public function testEmptyGroupsProducesEmptyMap(): void
    {
        $map = CacheCleanupMapBuilder::build([]);

        $this->assertSame([], $map);
    }

    /**
     * When the same route appears in more than one group, the later group
     * wins, overwriting the earlier entry.
     */
    public function testLaterGroupWinsOnRouteOverlap(): void
    {
        $groups = [
            [
                'targets' => ['/games/:game_slug/first.json'],
                'routes'  => ['/games/:game_slug/shared.json'],
            ],
            [
                'targets' => ['/games/:game_slug/second.json'],
                'routes'  => ['/games/:game_slug/shared.json'],
            ],
        ];

        $map = CacheCleanupMapBuilder::build($groups);

        $this->assertSame([
            '/games/:game_slug/shared.json' => ['/games/:game_slug/second.json'],
        ], $map);
    }
}
