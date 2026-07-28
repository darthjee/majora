<?php

namespace Tent\RequestHandlers\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\PathTraversalGuard;

/**
 * Unit tests for PathTraversalGuard.
 *
 * Uses a temporary directory as the base path to avoid touching any real
 * filesystem volume during tests.
 */
class PathTraversalGuardTest extends TestCase
{
    /** @var string Temporary directory used as the base path */
    private string $basePath;

    protected function setUp(): void
    {
        $this->basePath = sys_get_temp_dir() . '/test_path_traversal_guard_' . uniqid();
        mkdir($this->basePath, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->basePath);
    }

    /**
     * Recursively removes a directory and all its contents.
     */
    private function removeDir(string $dir): void
    {
        if (!is_dir($dir) && !is_link($dir)) {
            return;
        }
        if (is_link($dir)) {
            unlink($dir);
            return;
        }
        foreach (scandir($dir) as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $path = $dir . '/' . $entry;
            (is_dir($path) && !is_link($path)) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }

    /**
     * A real path nested inside the base path passes silently (no exception,
     * no return value to assert on).
     */
    public function testAllowsRealPathNestedInsideBase(): void
    {
        $nested = $this->basePath . '/42';
        mkdir($nested, 0755, true);

        PathTraversalGuard::assertRealPathWithinBase($this->basePath, $nested);

        $this->addToAssertionCount(1);
    }

    /**
     * The base path itself is allowed (equal, not just nested).
     */
    public function testAllowsRealPathEqualToBase(): void
    {
        PathTraversalGuard::assertRealPathWithinBase($this->basePath, $this->basePath);

        $this->addToAssertionCount(1);
    }

    /**
     * A real path outside the base path (a sibling directory) is rejected.
     */
    public function testRejectsRealPathOutsideBase(): void
    {
        $outside = dirname($this->basePath) . '/outside_' . uniqid();
        mkdir($outside, 0755, true);

        $this->expectException(InvalidArgumentException::class);

        try {
            PathTraversalGuard::assertRealPathWithinBase($this->basePath, $outside);
        } finally {
            rmdir($outside);
        }
    }

    /**
     * A symlink living inside the base directory but pointing outside of it
     * is rejected — this is the case the string-level check in
     * SecurePhotoStorage can never catch, since it never touches the
     * filesystem.
     */
    public function testRejectsSymlinkEscapingBase(): void
    {
        $outside = dirname($this->basePath) . '/outside_target_' . uniqid();
        mkdir($outside, 0755, true);
        $link = $this->basePath . '/escape';
        symlink($outside, $link);

        $this->expectException(InvalidArgumentException::class);

        try {
            PathTraversalGuard::assertRealPathWithinBase($this->basePath, $link);
        } finally {
            unlink($link);
            rmdir($outside);
        }
    }

    /**
     * A non-existent target path fails closed with an InvalidArgumentException,
     * rather than silently skipping the check.
     */
    public function testRejectsNonExistentTargetPath(): void
    {
        $missing = $this->basePath . '/does-not-exist';

        $this->expectException(InvalidArgumentException::class);

        PathTraversalGuard::assertRealPathWithinBase($this->basePath, $missing);
    }

    /**
     * A non-existent base path fails closed with an InvalidArgumentException,
     * rather than silently skipping the check.
     */
    public function testRejectsNonExistentBasePath(): void
    {
        $missingBase = $this->basePath . '/does/not/exist';

        $this->expectException(InvalidArgumentException::class);

        PathTraversalGuard::assertRealPathWithinBase($missingBase, $this->basePath);
    }
}
