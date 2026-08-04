<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\RequestHandlers\CacheSizeHandler;

/**
 * Unit tests for CacheSizeHandler.
 *
 * Uses a temporary directory as the cache path to avoid touching the real
 * on-disk proxy cache during tests.
 */
class CacheSizeHandlerTest extends TestCase
{
    /** @var string Temporary directory used as the cache path */
    private string $cacheDir;

    protected function setUp(): void
    {
        $this->cacheDir = sys_get_temp_dir() . '/test_cache_size_' . uniqid();
        mkdir($this->cacheDir, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->cacheDir);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Builds a CacheSizeHandler wired to the temporary cache directory.
     */
    private function makeHandler(HttpClientInterface $httpClient): CacheSizeHandler
    {
        return new CacheSizeHandler('http://backend:8080', $httpClient, $this->cacheDir);
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
     * Creates a file (with the containing directories) under the temporary
     * cache directory, at the given path relative to it, with $size bytes of
     * content.
     */
    private function makeCacheFile(string $relativePath, int $size): void
    {
        $fullPath = $this->cacheDir . '/' . $relativePath;
        $dir      = dirname($fullPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($fullPath, str_repeat('a', $size));
    }

    /**
     * Builds a ProcessingRequest for a GET /staff/cache/size.json.
     */
    private function makeRequest(array $headers = []): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => '/staff/cache/size.json',
            'requestMethod' => 'GET',
            'headers'       => $headers,
            'uploadedFiles' => [],
            'postFields'    => [],
        ]
        );
    }

    /**
     * Builds a fake /users/status.json response body.
     */
    private function statusBody(bool $loggedIn, bool $isStaff = false, bool $isSuperuser = false): string
    {
        return json_encode([
            'logged_in'    => $loggedIn,
            'is_staff'     => $isStaff,
            'is_superuser' => $isSuperuser,
        ]);
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /**
     * A staff user (is_staff: true) gets a 200 with the correct summed byte
     * size of the files under the cache directory.
     */
    public function testStaffUserGetsCacheSize(): void
    {
        $this->makeCacheFile('a.cache', 10);
        $this->makeCacheFile('nested/b.cache', 25);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->with('GET', 'http://backend:8080/users/status.json', $this->anything())
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(['size' => 35], json_decode($response->body(), true));
    }

    /**
     * A superuser (is_superuser: true, is_staff: false) also gets a 200:
     * either flag alone is sufficient.
     */
    public function testSuperuserAloneGetsCacheSize(): void
    {
        $this->makeCacheFile('a.cache', 12);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, false, true),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(['size' => 12], json_decode($response->body(), true));
    }

    /**
     * An empty cache directory returns 200 with size 0.
     */
    public function testEmptyCacheDirectoryReturnsZeroSize(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(['size' => 0], json_decode($response->body(), true));
    }

    /**
     * Not logged in: 403, regardless of the (irrelevant) staff/superuser
     * flags, and no filesystem work is attempted.
     */
    public function testNotLoggedInReturnsForbidden(): void
    {
        $this->makeCacheFile('a.cache', 10);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest();

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(false, true, true),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(403, $response->httpCode());
    }

    /**
     * Logged in, but neither staff nor superuser: 403.
     */
    public function testLoggedInWithoutStaffOrSuperuserReturnsForbidden(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest();

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, false, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(403, $response->httpCode());
    }

    /**
     * A non-200 response from /users/status.json (e.g. a backend 500) is
     * propagated as-is, not collapsed to 403.
     */
    public function testUpstreamFailureIsPropagatedAsIs(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest();

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 500,
                'body'     => 'Internal Server Error',
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(500, $response->httpCode());
        $this->assertSame('Internal Server Error', $response->body());
    }

    /**
     * build() sets cachePath from the 'cache_path' configuration parameter.
     */
    public function testBuildSetsCachePathFromParams(): void
    {
        $handler = CacheSizeHandler::build([
            'host'       => 'http://backend:8080',
            'cache_path' => $this->cacheDir,
        ]
        );

        $reflection = new \ReflectionClass($handler);
        $prop       = $reflection->getProperty('cachePath');
        $prop->setAccessible(true);

        $this->assertSame($this->cacheDir, $prop->getValue($handler));
    }
}
