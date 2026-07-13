<?php

namespace Tent\Middlewares;

/**
 * Builds the flat `[route => targets]` map consumed by
 * `CacheCleanupMiddleware`'s `custom` option out of a list of reusable
 * "groups", each pairing a shared list of cache-target paths with the list
 * of trigger routes that should clear those targets.
 *
 * This avoids repeating the same target list verbatim for every route that
 * shares it (e.g. several `npcs` routes all clear the same four paths).
 *
 * ## Usage
 *
 * ```php
 * $groups = [
 *     [
 *         'targets' => ['/games/:game_slug/npcs.json', '/games/:game_slug/npcs/all.json'],
 *         'routes'  => ['/games/:game_slug/npcs.json'],
 *     ],
 * ];
 *
 * $cacheCleanupMap = CacheCleanupMapBuilder::build($groups);
 * ```
 */
class CacheCleanupMapBuilder
{
    /**
     * Flattens the given groups into a single `[route => targets]` map.
     *
     * If the same route appears in more than one group, the later group
     * (per the order given in `$groups`) wins, overwriting the earlier
     * entry. The caller is responsible for avoiding unintentional overlaps.
     *
     * @param array $groups List of groups, each an associative array with:
     *                       - 'targets': list of cache-target paths to clear.
     *                       - 'routes':  list of trigger routes that clear
     *                         those targets.
     * @return array Flat map of route => targets, suitable for
     *                `CacheCleanupMiddleware`'s `custom` option.
     */
    public static function build(array $groups): array
    {
        $map = [];

        foreach ($groups as $group) {
            $targets = $group['targets'] ?? [];
            $routes = $group['routes'] ?? [];

            foreach ($routes as $route) {
                $map[$route] = $targets;
            }
        }

        return $map;
    }
}
