<?php
/**
 * Cache-cleanup groups consumed by CacheCleanupMiddleware's `custom` option
 * (see rules/backend.php in both dev_configuration and prod_configuration).
 *
 * Builds $cacheCleanupMap out of the resource-family group definitions
 * split across npcs.php, pcs.php, treasures.php, sessions.php, items.php,
 * documents.php, factions.php, possessions.php, and games.php in this same
 * folder, so both environments share a single source instead of duplicating
 * the map verbatim.
 */

use Tent\Middlewares\CacheCleanupMapBuilder;

$npcsCacheCleanupGroups = include __DIR__ . '/npcs.php';
$pcsCacheCleanupGroups = include __DIR__ . '/pcs.php';
$treasuresCacheCleanupGroups = include __DIR__ . '/treasures.php';
$sessionsCacheCleanupGroups = include __DIR__ . '/sessions.php';
$itemsCacheCleanupGroups = include __DIR__ . '/items.php';
$documentsCacheCleanupGroups = include __DIR__ . '/documents.php';
$factionsCacheCleanupGroups = include __DIR__ . '/factions.php';
$possessionsCacheCleanupGroups = include __DIR__ . '/possessions.php';
$gamesCacheCleanupGroups = include __DIR__ . '/games.php';

$cacheCleanupGroups = array_merge(
    $npcsCacheCleanupGroups,
    $pcsCacheCleanupGroups,
    $treasuresCacheCleanupGroups,
    $sessionsCacheCleanupGroups,
    $itemsCacheCleanupGroups,
    $documentsCacheCleanupGroups,
    $factionsCacheCleanupGroups,
    $possessionsCacheCleanupGroups,
    $gamesCacheCleanupGroups
);

$cacheCleanupMap = CacheCleanupMapBuilder::build($cacheCleanupGroups);
