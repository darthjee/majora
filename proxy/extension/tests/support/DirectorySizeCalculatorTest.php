<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\DirectorySizeCalculator;

/**
 * Unit tests for DirectorySizeCalculator.
 *
 * Exercises the orchestrator against the real strategy registry/strategies
 * (PhpWalkDirectorySizeStrategy involves no shelling out), since the
 * registry-resolution logic itself is what's under test here — per-strategy
 * behavior (including the `du` shell seam) is covered in their own suites.
 */
class DirectorySizeCalculatorTest extends TestCase
{
    /** @var string Temporary directory used as the measured path */
    private string $dir;

    protected function setUp(): void
    {
        $this->dir = sys_get_temp_dir() . '/test_directory_size_calculator_' . uniqid();
        mkdir($this->dir, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->dir);
    }

    /**
     * Recursively removes a directory and all its contents.
     */
    private function removeDir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        foreach (scandir($dir) as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $path = $dir . '/' . $entry;
            is_dir($path) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }

    /**
     * sizeOf() delegates to the strategy resolved for the configured tool.
     */
    public function testSizeOfDelegatesToConfiguredToolsStrategy(): void
    {
        file_put_contents($this->dir . '/a.cache', str_repeat('a', 10));

        $calculator = new DirectorySizeCalculator('php_walk');

        $this->assertSame(10, $calculator->sizeOf($this->dir));
    }
}
