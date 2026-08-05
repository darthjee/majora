<?php

namespace Tent\RequestHandlers;

/**
 * Interface for "size of a directory" strategies, each implementing a
 * different way of computing the total byte size of every file under a
 * given path (e.g. shelling out to `du`, or walking the tree in PHP).
 *
 * Implementations are looked up by DirectorySizeStrategyRegistry and
 * delegated to by DirectorySizeCalculator; callers (e.g. CacheSizeHandler)
 * never depend on a strategy directly.
 */
interface DirectorySizeStrategyInterface
{
    /**
     * Computes the total size, in bytes, of every file under $path.
     *
     * @param string $path The directory path to measure.
     * @return int Total size in bytes.
     */
    public function sizeOf(string $path): int;
}
