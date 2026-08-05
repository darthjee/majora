<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;

/**
 * Maps a configured tool identifier (e.g. 'du', 'php_walk') to the
 * DirectorySizeStrategyInterface class responsible for it, so a new
 * strategy can be registered later without touching DirectorySizeCalculator
 * or any of its callers.
 *
 * Kept as a plain const map with a static lookup, consistent with the rest
 * of this codebase — no dependency-injection framework.
 */
class DirectorySizeStrategyRegistry
{
    /** @var array<string, class-string<DirectorySizeStrategyInterface>> Tool identifier => strategy class. */
    private const MAP = [
        'du'       => DuDirectorySizeStrategy::class,
        'php_walk' => PhpWalkDirectorySizeStrategy::class,
    ];

    /**
     * Resolves $tool to a fresh instance of its strategy class.
     *
     * @param string $tool Tool identifier (e.g. 'du', 'php_walk').
     * @return DirectorySizeStrategyInterface
     * @throws InvalidArgumentException When $tool isn't a registered tool.
     */
    public static function resolve(string $tool): DirectorySizeStrategyInterface
    {
        if (!isset(self::MAP[$tool])) {
            throw new InvalidArgumentException('Unknown directory size tool: ' . $tool);
        }

        $class = self::MAP[$tool];

        return new $class();
    }
}
