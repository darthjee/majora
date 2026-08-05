<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\PhpWalkDirectorySizeStrategy;

/**
 * Unit tests for PhpWalkDirectorySizeStrategy.
 *
 * Uses a temporary directory as the measured path to avoid touching any real
 * filesystem volume during tests; this strategy involves no shelling out, so
 * a real directory tree is the simplest way to exercise it end to end.
 */
class PhpWalkDirectorySizeStrategyTest extends TestCase
{
    /** @var string Temporary directory used as the measured path */
    private string $dir;

    /** @var PhpWalkDirectorySizeStrategy Strategy under test */
    private PhpWalkDirectorySizeStrategy $strategy;

    protected function setUp(): void
    {
        $this->dir = sys_get_temp_dir() . '/test_php_walk_directory_size_' . uniqid();
        mkdir($this->dir, 0755, true);
        $this->strategy = new PhpWalkDirectorySizeStrategy();
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->dir);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

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
     * Creates a file (with the containing directories) under the temporary
     * directory, at the given path relative to it, with $size bytes of
     * content.
     */
    private function makeFile(string $relativePath, int $size): void
    {
        $fullPath = $this->dir . '/' . $relativePath;
        $dir      = dirname($fullPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($fullPath, str_repeat('a', $size));
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /**
     * The sizes of files nested at multiple levels are all summed together.
     */
    public function testSumsSizesOfNestedFiles(): void
    {
        $this->makeFile('a.cache', 10);
        $this->makeFile('nested/b.cache', 25);

        $this->assertSame(35, $this->strategy->sizeOf($this->dir));
    }

    /**
     * A single top-level file is measured correctly.
     */
    public function testSumsSizeOfSingleFile(): void
    {
        $this->makeFile('a.cache', 12);

        $this->assertSame(12, $this->strategy->sizeOf($this->dir));
    }

    /**
     * An empty directory returns 0.
     */
    public function testEmptyDirectoryReturnsZero(): void
    {
        $this->assertSame(0, $this->strategy->sizeOf($this->dir));
    }

    /**
     * A missing directory returns 0, rather than raising an error.
     */
    public function testMissingDirectoryReturnsZero(): void
    {
        $this->assertSame(0, $this->strategy->sizeOf($this->dir . '/does-not-exist'));
    }
}
