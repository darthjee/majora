<?php

namespace Tent\RequestHandlers\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\DirectorySizeStrategyRegistry;
use Tent\RequestHandlers\DuDirectorySizeStrategy;
use Tent\RequestHandlers\PhpWalkDirectorySizeStrategy;

/**
 * Unit tests for DirectorySizeStrategyRegistry.
 */
class DirectorySizeStrategyRegistryTest extends TestCase
{
    /**
     * 'du' resolves to a DuDirectorySizeStrategy instance.
     */
    public function testResolvesDuToDuDirectorySizeStrategy(): void
    {
        $this->assertInstanceOf(DuDirectorySizeStrategy::class, DirectorySizeStrategyRegistry::resolve('du'));
    }

    /**
     * 'php_walk' resolves to a PhpWalkDirectorySizeStrategy instance.
     */
    public function testResolvesPhpWalkToPhpWalkDirectorySizeStrategy(): void
    {
        $this->assertInstanceOf(
            PhpWalkDirectorySizeStrategy::class,
            DirectorySizeStrategyRegistry::resolve('php_walk')
        );
    }

    /**
     * An unregistered tool identifier raises a clear error, rather than
     * silently falling back to a default strategy.
     */
    public function testUnknownToolRaisesInvalidArgumentException(): void
    {
        $this->expectException(InvalidArgumentException::class);

        DirectorySizeStrategyRegistry::resolve('unknown_tool');
    }
}
