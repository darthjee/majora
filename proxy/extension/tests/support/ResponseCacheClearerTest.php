<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Models\FolderLocation;
use Tent\RequestHandlers\ResponseCacheClearer;

/**
 * Unit tests for ResponseCacheClearer (issue #1469).
 *
 * Uses a temporary directory as the cache folder, laid out the way Tent's
 * FileCache writes entries: <cache>/<request path>/GET/<hash>.body.dat.
 */
class ResponseCacheClearerTest extends TestCase
{
    /** @var string Temporary directory acting as the parent of the cache folder */
    private string $rootDir;

    /** @var string Temporary cache folder */
    private string $cacheDir;

    protected function setUp(): void
    {
        $this->rootDir  = sys_get_temp_dir() . '/test_response_cache_clearer_' . uniqid();
        $this->cacheDir = $this->rootDir . '/cache';
        mkdir($this->cacheDir, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->rootDir);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function makeClearer(): ResponseCacheClearer
    {
        return new ResponseCacheClearer(new FolderLocation($this->cacheDir));
    }

    /**
     * Creates a cache entry for GET $path under $base (defaults to the cache
     * folder) and returns its GET/ directory.
     */
    private function makeCacheEntry(string $path, string $hash = 'abc', ?string $base = null): string
    {
        $dir = ($base ?? $this->cacheDir) . $path . '/GET';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($dir . '/' . $hash . '.body.dat', '{}');
        file_put_contents($dir . '/' . $hash . '.meta.json', '{}');
        return $dir;
    }

    private function removeDir(string $dir): void
    {
        if (is_link($dir)) {
            unlink($dir);
            return;
        }
        if (!is_dir($dir)) {
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

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /**
     * Every listed path is cleared (entries trimmed, empty entries ignored),
     * while unlisted paths stay cached.
     */
    public function testValidListIsCleared(): void
    {
        $collection = $this->makeCacheEntry('/games/foo/factions.json');
        $entity     = $this->makeCacheEntry('/games/foo/factions/3.json');
        $untouched  = $this->makeCacheEntry('/games/foo/npcs.json');

        $this->makeClearer()->clearFrom(
            [
                'Content-Type: application/json',
                'X-Cache-Clear:  /games/foo/factions.json ,, /games/foo/factions/3.json , ',
            ],
            204
        );

        $this->assertDirectoryDoesNotExist($collection);
        $this->assertDirectoryDoesNotExist($entity);
        $this->assertDirectoryExists($untouched);
    }

    /**
     * Every cache entry for a path is removed, whatever hasher keyed it
     * (query-string hashes and PrivateRequestHasher's private_* entries).
     */
    public function testAllHashedEntriesForPathAreCleared(): void
    {
        $dir = $this->makeCacheEntry('/games/foo/npcs/all.json', 'queryhash');
        $this->makeCacheEntry('/games/foo/npcs/all.json', 'private_tokenhash');

        $this->makeClearer()->clearFrom(['X-Cache-Clear: /games/foo/npcs/all.json'], 200);

        $this->assertDirectoryDoesNotExist($dir);
    }

    /**
     * The header name is matched case-insensitively, and multiple header
     * lines are all honoured.
     */
    public function testHeaderNameIsCaseInsensitiveAndRepeatable(): void
    {
        $first  = $this->makeCacheEntry('/games/foo.json');
        $second = $this->makeCacheEntry('/games/bar.json');

        $this->makeClearer()->clearFrom(
            ['x-cache-clear: /games/foo.json', 'X-CACHE-CLEAR: /games/bar.json'],
            200
        );

        $this->assertDirectoryDoesNotExist($first);
        $this->assertDirectoryDoesNotExist($second);
    }

    /**
     * Invalid entries (traversal, no leading slash, not .json, query string,
     * fragment, backslash, NUL, percent-encoding, empty segment) are skipped
     * while the valid ones are still cleared; nothing outside the cache
     * folder is touched.
     */
    public function testInvalidEntriesAreSkippedAndValidOnesCleared(): void
    {
        $outside = $this->makeCacheEntry('/secret.json', 'abc', $this->rootDir);
        $valid   = $this->makeCacheEntry('/games/foo.json');

        $this->makeClearer()->clearFrom(
            [
                'X-Cache-Clear: /../secret.json, /games/../../secret.json, games/foo.json, '
                . '/games/foo, /games/foo.json?x=1, /games/foo.json#a, /games\\..\\secret.json, '
                . "/games/\0foo.json, /games/%2e%2e/secret.json, //secret.json, /games/./foo.json, "
                . '/games/foo.json',
            ],
            200
        );

        $this->assertDirectoryExists($outside);
        $this->assertDirectoryDoesNotExist($valid);
    }

    /**
     * A cache directory that is a symlink pointing outside the cache folder
     * is never followed/deleted.
     */
    public function testSymlinkEscapingCacheFolderIsSkipped(): void
    {
        $outsideDir = $this->rootDir . '/outside/GET';
        mkdir($outsideDir, 0755, true);
        file_put_contents($outsideDir . '/abc.body.dat', 'keep me');

        mkdir($this->cacheDir . '/games/link.json', 0755, true);
        symlink($outsideDir, $this->cacheDir . '/games/link.json/GET');

        $this->makeClearer()->clearFrom(['X-Cache-Clear: /games/link.json'], 200);

        $this->assertFileExists($outsideDir . '/abc.body.dat');
    }

    /**
     * Non-2xx responses never clear anything.
     */
    public function testNonSuccessResponsesAreIgnored(): void
    {
        $dir = $this->makeCacheEntry('/games/foo.json');

        foreach ([100, 301, 401, 403, 404, 422, 500] as $code) {
            $this->makeClearer()->clearFrom(['X-Cache-Clear: /games/foo.json'], $code);
        }

        $this->assertDirectoryExists($dir);
    }

    /**
     * Without the header, nothing is cleared.
     */
    public function testMissingHeaderIsNoOp(): void
    {
        $dir = $this->makeCacheEntry('/games/foo.json');

        $this->makeClearer()->clearFrom(
            ['Content-Type: application/json', 'X-Cache-Clear-Other: /games/foo.json', 'garbage'],
            200
        );

        $this->assertDirectoryExists($dir);
    }

    /**
     * Built without a cache path, the clearer is a no-op.
     */
    public function testEmptyCachePathDisablesClearing(): void
    {
        $dir = $this->makeCacheEntry('/games/foo.json');

        ResponseCacheClearer::forPath('')->clearFrom(['X-Cache-Clear: /games/foo.json'], 200);

        $this->assertDirectoryExists($dir);
    }

    /**
     * Clearing a path with nothing cached is harmless.
     */
    public function testMissingCacheEntryIsHarmless(): void
    {
        ResponseCacheClearer::forPath($this->cacheDir)
            ->clearFrom(['X-Cache-Clear: /games/never-cached.json'], 200);

        $this->assertDirectoryExists($this->cacheDir);
    }

    /**
     * withoutHeader() drops every X-Cache-Clear line (case-insensitive) and
     * keeps everything else, in order.
     */
    public function testWithoutHeaderStripsCacheClearLines(): void
    {
        $this->assertSame(
            ['Content-Type: application/json', 'X-Other: 1'],
            ResponseCacheClearer::withoutHeader(
                [
                    'Content-Type: application/json',
                    'X-Cache-Clear: /games/foo.json',
                    'X-Other: 1',
                    'x-cache-clear: /games/bar.json',
                ]
            )
        );
    }

    // -------------------------------------------------------------------------
    // Cross-domain mode (issue #1570)
    // -------------------------------------------------------------------------

    private function domainFolder(string $seed): string
    {
        $dir = $this->cacheDir . '/domain_' . hash('sha256', $seed);
        mkdir($dir, 0755, true);
        return $dir;
    }

    /**
     * A listed path is cleared in every domain_* folder and in the flat root;
     * unlisted paths stay cached everywhere.
     */
    public function testCrossDomainClearsEveryDomainFolderAndRoot(): void
    {
        $domainA = $this->domainFolder('a.example');
        $domainB = $this->domainFolder('b.example');

        $inA       = $this->makeCacheEntry('/games/foo.json', 'abc', $domainA);
        $inB       = $this->makeCacheEntry('/games/foo.json', 'abc', $domainB);
        $inRoot    = $this->makeCacheEntry('/games/foo.json');
        $otherInA  = $this->makeCacheEntry('/games/foo/npcs.json', 'abc', $domainA);
        $otherRoot = $this->makeCacheEntry('/games/foo/npcs.json');

        ResponseCacheClearer::forRoot($this->cacheDir)
            ->clearFrom(['X-Cache-Clear: /games/foo.json'], 200);

        $this->assertDirectoryDoesNotExist($inA);
        $this->assertDirectoryDoesNotExist($inB);
        $this->assertDirectoryDoesNotExist($inRoot);
        $this->assertDirectoryExists($otherInA);
        $this->assertDirectoryExists($otherRoot);
    }

    /**
     * Folders not named domain_<64 hex> (and plain files) are never treated
     * as domain folders.
     */
    public function testCrossDomainIgnoresNonDomainEntries(): void
    {
        $other   = $this->cacheDir . '/other';
        $short   = $this->cacheDir . '/domain_abc';
        $upper   = $this->cacheDir . '/domain_' . strtoupper(hash('sha256', 'x'));
        mkdir($other, 0755, true);
        mkdir($short, 0755, true);
        mkdir($upper, 0755, true);
        file_put_contents($this->cacheDir . '/domain_' . hash('sha256', 'file'), 'not a dir');

        $inOther = $this->makeCacheEntry('/games/foo.json', 'abc', $other);
        $inShort = $this->makeCacheEntry('/games/foo.json', 'abc', $short);
        $inUpper = $this->makeCacheEntry('/games/foo.json', 'abc', $upper);

        ResponseCacheClearer::forRoot($this->cacheDir)
            ->clearFrom(['X-Cache-Clear: /games/foo.json'], 200);

        $this->assertDirectoryExists($inOther);
        $this->assertDirectoryExists($inShort);
        $this->assertDirectoryExists($inUpper);
        $this->assertFileExists($this->cacheDir . '/domain_' . hash('sha256', 'file'));
    }

    /**
     * A domain_* entry that is a symlink to a folder outside the root is
     * skipped, while the other folders are still cleared.
     */
    public function testCrossDomainSkipsSymlinkedDomainFolderOutsideRoot(): void
    {
        $outside = $this->rootDir . '/outside';
        mkdir($outside, 0755, true);
        $outsideEntry = $this->makeCacheEntry('/games/foo.json', 'abc', $outside);
        symlink($outside, $this->cacheDir . '/domain_' . hash('sha256', 'evil'));

        $domain  = $this->domainFolder('good.example');
        $inGood  = $this->makeCacheEntry('/games/foo.json', 'abc', $domain);
        $inRoot  = $this->makeCacheEntry('/games/foo.json');

        ResponseCacheClearer::forRoot($this->cacheDir)
            ->clearFrom(['X-Cache-Clear: /games/foo.json'], 200);

        $this->assertDirectoryExists($outsideEntry);
        $this->assertDirectoryDoesNotExist($inGood);
        $this->assertDirectoryDoesNotExist($inRoot);
    }

    /**
     * Invalid paths are skipped in cross-domain mode; valid ones are cleared.
     */
    public function testCrossDomainSkipsInvalidPaths(): void
    {
        $domain  = $this->domainFolder('a.example');
        $outside = $this->makeCacheEntry('/secret.json', 'abc', $this->rootDir);
        $valid   = $this->makeCacheEntry('/games/foo.json', 'abc', $domain);

        ResponseCacheClearer::forRoot($this->cacheDir)->clearFrom(
            ['X-Cache-Clear: /../secret.json, /../../secret.json, /games/foo, /games/foo.json'],
            200
        );

        $this->assertDirectoryExists($outside);
        $this->assertDirectoryDoesNotExist($valid);
    }

    /**
     * Non-2xx responses never clear anything in cross-domain mode.
     */
    public function testCrossDomainNonSuccessIsNoOp(): void
    {
        $domain = $this->domainFolder('a.example');
        $inA    = $this->makeCacheEntry('/games/foo.json', 'abc', $domain);
        $inRoot = $this->makeCacheEntry('/games/foo.json');

        foreach ([301, 400, 403, 404, 500] as $code) {
            ResponseCacheClearer::forRoot($this->cacheDir)
                ->clearFrom(['X-Cache-Clear: /games/foo.json'], $code);
        }

        $this->assertDirectoryExists($inA);
        $this->assertDirectoryExists($inRoot);
    }

    /**
     * forRoot('') is a no-op.
     */
    public function testCrossDomainEmptyRootIsNoOp(): void
    {
        $domain = $this->domainFolder('a.example');
        $inA    = $this->makeCacheEntry('/games/foo.json', 'abc', $domain);
        $inRoot = $this->makeCacheEntry('/games/foo.json');

        ResponseCacheClearer::forRoot('')->clearFrom(['X-Cache-Clear: /games/foo.json'], 200);

        $this->assertDirectoryExists($inA);
        $this->assertDirectoryExists($inRoot);
    }

    /**
     * A missing cache root is harmless.
     */
    public function testCrossDomainMissingRootIsHarmless(): void
    {
        ResponseCacheClearer::forRoot($this->rootDir . '/missing')
            ->clearFrom(['X-Cache-Clear: /games/foo.json'], 200);

        $this->assertDirectoryDoesNotExist($this->rootDir . '/missing');
    }
}
