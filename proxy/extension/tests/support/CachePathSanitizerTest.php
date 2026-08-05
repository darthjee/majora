<?php

namespace Tent\RequestHandlers\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\CachePathSanitizer;

/**
 * Unit tests for CachePathSanitizer.
 *
 * Uses a temporary directory as the cache folder to avoid touching any real
 * filesystem volume during tests.
 */
class CachePathSanitizerTest extends TestCase
{
    /** @var string Temporary directory used as the cache folder */
    private string $cacheFolder;

    protected function setUp(): void
    {
        $this->cacheFolder = sys_get_temp_dir() . '/test_cache_path_sanitizer_' . uniqid();
        mkdir($this->cacheFolder, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->cacheFolder);
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
     * A plausible domain, when its cache directory doesn't exist yet, is
     * returned unchanged with no filesystem-level check performed (there is
     * nothing to resolve yet).
     */
    public function testReturnsDomainUnchangedWhenCacheDirectoryDoesNotExistYet(): void
    {
        $result = CachePathSanitizer::sanitize('game-a.example.com', $this->cacheFolder);

        $this->assertSame('game-a.example.com', $result);
    }

    /**
     * A plausible domain whose cache directory already exists nested inside
     * the cache folder passes both checks.
     */
    public function testReturnsDomainUnchangedWhenCacheDirectoryExistsInsideCacheFolder(): void
    {
        mkdir($this->cacheFolder . '/.game-a.example.com', 0755, true);

        $result = CachePathSanitizer::sanitize('game-a.example.com', $this->cacheFolder);

        $this->assertSame('game-a.example.com', $result);
    }

    /**
     * @dataProvider unsafeDomainsProvider
     */
    public function testRejectsUnsafeDomains(string $domain): void
    {
        $this->expectException(InvalidArgumentException::class);

        CachePathSanitizer::sanitize($domain, $this->cacheFolder);
    }

    public static function unsafeDomainsProvider(): array
    {
        return [
            'path traversal'       => ['..'],
            'nested traversal'     => ['../outside'],
            'absolute path'        => ['/etc/passwd'],
            'embedded slash'       => ['game-a.example.com/../outside'],
            'leading dot'          => ['.hidden'],
            'empty string'         => [''],
            'null byte'            => ["game-a.example.com\0"],
            'trailing hyphen'      => ['game-a-'],
            'leading hyphen'       => ['-game-a'],
            'whitespace'           => ['game a'],
        ];
    }

    /**
     * A domain that is safe at the string level, but whose already-existing
     * cache directory is a symlink escaping the cache folder, is rejected —
     * this is the case the string-level check alone can never catch, since
     * it never touches the filesystem.
     */
    public function testRejectsSymlinkedCacheDirectoryEscapingCacheFolder(): void
    {
        $outsideDir = dirname($this->cacheFolder) . '/outside_' . uniqid();
        mkdir($outsideDir, 0755, true);
        symlink($outsideDir, $this->cacheFolder . '/.game-a.example.com');

        $this->expectException(InvalidArgumentException::class);

        try {
            CachePathSanitizer::sanitize('game-a.example.com', $this->cacheFolder);
        } finally {
            unlink($this->cacheFolder . '/.game-a.example.com');
            rmdir($outsideDir);
        }
    }
}
