<?php

namespace Tent\Middlewares\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Content\FileCache;
use Tent\Http\HttpClientInterface;
use Tent\Middlewares\ResponseCacheClearMiddleware;
use Tent\Models\FolderLocation;
use Tent\Models\ProcessingRequest;
use Tent\Models\Response;
use Tent\RequestHandlers\DefaultProxyRequestHandler;

/**
 * Unit tests for ResponseCacheClearMiddleware (issue #1469).
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class ResponseCacheClearMiddlewareTest extends TestCase
{
    /** @var string Temporary cache folder. */
    private string $cacheDir;

    protected function setUp(): void
    {
        $this->cacheDir = sys_get_temp_dir() . '/test_response_cache_clear_mw_' . uniqid();
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
     * Creates a cache entry for GET $path (Tent's <cache>/<path>/GET/ layout)
     * and returns its GET/ dir.
     */
    private function makeCacheEntry(string $path): string
    {
        $dir = $this->cacheDir . $path . '/GET';
        mkdir($dir, 0755, true);
        file_put_contents($dir . '/abc.body.dat', '{}');
        return $dir;
    }

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
            is_dir($path) && !is_link($path) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }

    private function makeRequest(string $method, string $path, array $headers = []): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => $path,
            'requestMethod' => $method,
            'headers'       => $headers,
            'query'         => '',
            'body'          => '',
            'uploadedFiles' => [],
            'postFields'    => [],
        ]);
    }

    /**
     * Mirrors the backend.php rule: a default_proxy handler caching under
     * the cache folder, with the middleware prepended ahead of its built-in
     * FileCacheMiddleware.
     */
    private function makeProxyHandler(HttpClientInterface $httpClient): DefaultProxyRequestHandler
    {
        $handler = new DefaultProxyRequestHandler(
            'http://backend:8080',
            $this->cacheDir,
            ['2xx'],
            $httpClient,
            'X-Skip-Cache'
        );
        $handler->prependMiddlewares([
            [
                'class'    => ResponseCacheClearMiddleware::class,
                'location' => $this->cacheDir,
            ],
        ]);

        return $handler;
    }

    // -------------------------------------------------------------------------
    // processResponse
    // -------------------------------------------------------------------------

    /**
     * A 2xx response clears the listed paths and loses the header; other
     * headers pass through in order.
     */
    public function testSuccessfulResponseClearsAndStrips(): void
    {
        $listed   = $this->makeCacheEntry('/staff/photos.json');
        $other    = $this->makeCacheEntry('/games/foo.json');
        $response = new Response([
            'httpCode' => 204,
            'headers'  => ['X-Request-Id: 1', 'x-cache-clear: /staff/photos.json', 'Content-Length: 0'],
        ]);

        $result = (new ResponseCacheClearMiddleware($this->cacheDir))->processResponse($response);

        $this->assertSame(['X-Request-Id: 1', 'Content-Length: 0'], $result->headers());
        $this->assertDirectoryDoesNotExist($listed);
        $this->assertDirectoryExists($other);
    }

    /**
     * A non-2xx response clears nothing, but the header is still stripped.
     */
    public function testFailureResponseStripsWithoutClearing(): void
    {
        $entry = $this->makeCacheEntry('/staff/photos.json');

        foreach ([302, 400, 403, 404, 500] as $code) {
            $response = new Response([
                'httpCode' => $code,
                'headers'  => ['X-Cache-Clear: /staff/photos.json', 'X-Request-Id: 1'],
            ]);

            $result = (new ResponseCacheClearMiddleware($this->cacheDir))->processResponse($response);

            $this->assertSame(['X-Request-Id: 1'], $result->headers(), "status $code");
            $this->assertDirectoryExists($entry, "status $code");
        }
    }

    /**
     * Without a cache location the header is still stripped (nothing to clear).
     */
    public function testWithoutLocationStillStrips(): void
    {
        $entry    = $this->makeCacheEntry('/staff/photos.json');
        $response = new Response(['httpCode' => 200, 'headers' => ['X-Cache-Clear: /staff/photos.json']]);

        $result = ResponseCacheClearMiddleware::build([])->processResponse($response);

        $this->assertSame([], $result->headers());
        $this->assertDirectoryExists($entry);
    }

    /**
     * A response without the header is left untouched.
     */
    public function testResponseWithoutHeaderIsUntouched(): void
    {
        $entry    = $this->makeCacheEntry('/staff/photos.json');
        $response = new Response(['httpCode' => 200, 'headers' => ['Content-Type: application/json']]);

        $result = (new ResponseCacheClearMiddleware($this->cacheDir))->processResponse($response);

        $this->assertSame(['Content-Type: application/json'], $result->headers());
        $this->assertDirectoryExists($entry);
    }

    /**
     * build() reads the cache folder from 'location'.
     */
    public function testBuildReadsLocation(): void
    {
        $middleware = ResponseCacheClearMiddleware::build(['location' => $this->cacheDir]);

        $this->assertSame($this->cacheDir, $middleware->cachePath());
    }

    // -------------------------------------------------------------------------
    // processRequest
    // -------------------------------------------------------------------------

    /**
     * A client-sent X-Cache-Clear request header is dropped (any casing);
     * other request headers are kept.
     */
    public function testClientSentHeaderIsDroppedFromRequest(): void
    {
        $request = $this->makeRequest('DELETE', '/staff/photos/main/3.json', [
            'X-Cache-Clear' => '/games/foo.json',
            'x-cache-clear' => '/games/bar.json',
            'Accept'        => 'application/json',
        ]);

        $result = (new ResponseCacheClearMiddleware($this->cacheDir))->processRequest($request);

        $this->assertSame(['Accept' => 'application/json'], $result->headers());
    }

    // -------------------------------------------------------------------------
    // Through a default_proxy handler (backend.php rule shape)
    // -------------------------------------------------------------------------

    /**
     * A proxied 2xx carrying X-Cache-Clear clears the listed paths and the
     * header never reaches the client.
     */
    public function testProxiedSuccessClearsAndStrips(): void
    {
        $listed  = $this->makeCacheEntry('/staff/photos.json');
        $other   = $this->makeCacheEntry('/games/foo.json');
        $client  = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturn([
            'httpCode' => 204,
            'body'     => '',
            'headers'  => ['X-Request-Id: 1', 'X-Cache-Clear: /staff/photos.json'],
        ]);

        $response = $this->makeProxyHandler($client)
            ->handleRequest($this->makeRequest('DELETE', '/staff/photos/main/3.json'));

        $this->assertSame(204, $response->httpCode());
        $this->assertSame(['X-Request-Id: 1'], $response->headers());
        $this->assertDirectoryDoesNotExist($listed);
        $this->assertDirectoryExists($other);
    }

    /**
     * A cacheable proxied 2xx is stored without the X-Cache-Clear header, so
     * a later cache hit can neither leak nor replay it.
     */
    public function testHeaderIsNeverStoredInCache(): void
    {
        $client = $this->createMock(HttpClientInterface::class);
        $client->expects($this->once())->method('request')->willReturn([
            'httpCode' => 200,
            'body'     => '{}',
            'headers'  => ['Content-Type: application/json', 'X-Cache-Clear: /games/bar.json'],
        ]);
        $handler = $this->makeProxyHandler($client);

        $first = $handler->handleRequest($this->makeRequest('GET', '/games/foo.json'));
        $this->assertSame(['Content-Type: application/json'], $first->headers());

        $cache = new FileCache(
            $this->makeRequest('GET', '/games/foo.json'),
            new FolderLocation($this->cacheDir)
        );
        $this->assertTrue($cache->exists());
        foreach ($cache->headers() as $line) {
            $this->assertStringStartsNotWith('x-cache-clear', strtolower($line));
        }

        // Served from cache (the mock only allows one upstream call).
        $second = $handler->handleRequest($this->makeRequest('GET', '/games/foo.json'));
        foreach ($second->headers() as $line) {
            $this->assertStringStartsNotWith('x-cache-clear', strtolower($line));
        }
    }

    /**
     * A proxied non-2xx clears nothing and the header is still stripped.
     */
    public function testProxiedFailureStripsWithoutClearing(): void
    {
        $entry  = $this->makeCacheEntry('/staff/photos.json');
        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturn([
            'httpCode' => 403,
            'body'     => '',
            'headers'  => ['X-Cache-Clear: /staff/photos.json'],
        ]);

        $response = $this->makeProxyHandler($client)
            ->handleRequest($this->makeRequest('DELETE', '/staff/photos/main/3.json'));

        $this->assertSame(403, $response->httpCode());
        $this->assertSame([], $response->headers());
        $this->assertDirectoryExists($entry);
    }

    /**
     * A client-sent X-Cache-Clear is not forwarded upstream and clears
     * nothing when the backend response doesn't carry the header.
     */
    public function testProxiedClientSentHeaderHasNoEffect(): void
    {
        $entry  = $this->makeCacheEntry('/staff/photos.json');
        $client = $this->createMock(HttpClientInterface::class);
        $client->expects($this->once())
            ->method('request')
            ->with(
                $this->anything(),
                $this->anything(),
                $this->callback(function (array $headers): bool {
                    foreach (array_keys($headers) as $name) {
                        if (strcasecmp((string) $name, 'X-Cache-Clear') === 0) {
                            return false;
                        }
                    }
                    return true;
                })
            )
            ->willReturn(['httpCode' => 204, 'body' => '', 'headers' => []]);

        $response = $this->makeProxyHandler($client)->handleRequest(
            $this->makeRequest('DELETE', '/staff/photos/main/3.json', ['X-Cache-Clear' => '/staff/photos.json'])
        );

        $this->assertSame(204, $response->httpCode());
        $this->assertDirectoryExists($entry);
    }
}
