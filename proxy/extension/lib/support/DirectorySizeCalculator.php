<?php

namespace Tent\RequestHandlers;

/**
 * Entry point for "size of a directory" callers (starting with
 * CacheSizeHandler, and meant to be reused later for other size checks,
 * e.g. photos storage or uploaded files).
 *
 * Owns "return the size of a directory," not "how" — the configured tool
 * name is resolved to a concrete DirectorySizeStrategyInterface via
 * DirectorySizeStrategyRegistry, and the computation itself is delegated to
 * it. There is no automatic fallback between tools: a failing strategy
 * fails the call, it never silently retries with another one.
 */
class DirectorySizeCalculator
{
    /** @var string Configured tool identifier (e.g. 'du', 'php_walk'). */
    private string $tool;

    /**
     * @param string $tool Configured tool identifier (e.g. 'du', 'php_walk').
     */
    public function __construct(string $tool)
    {
        $this->tool = $tool;
    }

    /**
     * Computes the total size, in bytes, of every file under $path, using
     * the configured tool's strategy.
     *
     * @param string $path The directory path to measure.
     * @return int Total size in bytes.
     */
    public function sizeOf(string $path): int
    {
        return DirectorySizeStrategyRegistry::resolve($this->tool)->sizeOf($path);
    }
}
