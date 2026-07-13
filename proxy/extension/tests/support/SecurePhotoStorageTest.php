<?php

namespace Tent\RequestHandlers\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\SecurePhotoStorage;

/**
 * Unit tests for SecurePhotoStorage.
 *
 * Uses a temporary directory as the base path to avoid touching the real
 * photos volume during tests.
 */
class SecurePhotoStorageTest extends TestCase
{
    /** @var string Temporary directory used as the base path */
    private string $basePath;

    protected function setUp(): void
    {
        $this->basePath = sys_get_temp_dir() . '/test_secure_storage_' . uniqid();
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
     * Normal case: a destination nested under the base path gets its
     * containing directory created.
     */
    public function testCreatesDirectoryWhenInsideBasePath(): void
    {
        $storage     = new SecurePhotoStorage($this->basePath);
        $destination = $this->basePath . '/42/photo.jpg';

        $storage->ensureDirectoryFor($destination);

        $this->assertDirectoryExists($this->basePath . '/42');
    }

    /**
     * Nested destinations several levels deep are also created correctly.
     */
    public function testCreatesNestedDirectoriesWhenInsideBasePath(): void
    {
        $storage     = new SecurePhotoStorage($this->basePath);
        $destination = $this->basePath . '/games/1/characters/2/photo.jpg';

        $storage->ensureDirectoryFor($destination);

        $this->assertDirectoryExists($this->basePath . '/games/1/characters/2');
    }

    /**
     * Directory already exists: ensureDirectoryFor() succeeds silently and
     * doesn't error out.
     */
    public function testDoesNothingWhenDirectoryAlreadyExists(): void
    {
        $storage     = new SecurePhotoStorage($this->basePath);
        $destination = $this->basePath . '/42/photo.jpg';
        mkdir($this->basePath . '/42', 0755, true);

        $storage->ensureDirectoryFor($destination);

        $this->assertDirectoryExists($this->basePath . '/42');
    }

    /**
     * Traversal via `..` segments that would resolve outside the base path
     * is rejected, and no directory is created.
     */
    public function testRejectsTraversalEscapingBasePath(): void
    {
        $storage     = new SecurePhotoStorage($this->basePath);
        $destination = $this->basePath . '/../outside/photo.jpg';

        $this->expectException(InvalidArgumentException::class);

        try {
            $storage->ensureDirectoryFor($destination);
        } finally {
            $this->assertDirectoryDoesNotExist(dirname($this->basePath) . '/outside');
        }
    }

    /**
     * Traversal that resolves outside the base path is rejected even when
     * neither the base path nor any part of the destination exists yet.
     */
    public function testRejectsTraversalWhenBasePathDoesNotExistYet(): void
    {
        $nonExistentBase = $this->basePath . '/does/not/exist';
        $storage         = new SecurePhotoStorage($nonExistentBase);
        $destination     = $nonExistentBase . '/../../escaped/photo.jpg';

        $this->expectException(InvalidArgumentException::class);

        try {
            $storage->ensureDirectoryFor($destination);
        } finally {
            $this->assertDirectoryDoesNotExist($this->basePath . '/does/escaped');
        }
    }

    /**
     * A deeply nested `..` sequence that still stays inside the base path
     * (net effect resolves to a subdirectory of the base) is allowed.
     */
    public function testAllowsTraversalThatStaysInsideBasePath(): void
    {
        $storage     = new SecurePhotoStorage($this->basePath);
        $destination = $this->basePath . '/42/../43/photo.jpg';

        $storage->ensureDirectoryFor($destination);

        $this->assertDirectoryExists($this->basePath . '/43');
        $this->assertDirectoryDoesNotExist($this->basePath . '/42');
    }
}
