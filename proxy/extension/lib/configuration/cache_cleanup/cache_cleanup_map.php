<?php
/**
 * Cache-cleanup groups consumed by CacheCleanupMiddleware's `custom` option
 * (see rules/backend.php in both dev_configuration and prod_configuration).
 *
 * Builds $cacheCleanupMap out of the resource-family group definitions
 * split across npcs.php, pcs.php, and treasures.php in this same folder,
 * so both environments share a single source instead of duplicating the
 * map verbatim.
 */

use Tent\Middlewares\CacheCleanupMapBuilder;

$npcsCacheCleanupGroups = require __DIR__ . '/npcs.php';
$pcsCacheCleanupGroups = require __DIR__ . '/pcs.php';
$treasuresCacheCleanupGroups = require __DIR__ . '/treasures.php';

$cacheCleanupGroups = array_merge(
    $npcsCacheCleanupGroups,
    $pcsCacheCleanupGroups,
    $treasuresCacheCleanupGroups
);

$cacheCleanupMap = CacheCleanupMapBuilder::build($cacheCleanupGroups);
