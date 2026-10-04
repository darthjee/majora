<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;
use ReflectionProperty;
use Tent\Cache\DomainHash;
use Tent\Configuration;
use Tent\Http\HttpClientInterface;
use Tent\Middlewares\FileCacheMiddleware;
use Tent\Middlewares\ResponseCacheClearMiddleware;
use Tent\Models\ProcessingRequest;
use Tent\Models\Request;
use Tent\Models\Rule;
use Tent\RequestHandlers\ProxyRequestHandler;
use Tent\RequestHandlers\RequestHandler;

/**
 * Exercises the real dev/prod `rules/backend.php` files (issue #1469): a
 * plain proxied mutation reaching the generic `.json` rule must have its
 * backend `X-Cache-Clear` paths cleared on 2xx, and the header must never
 * reach the client or be stored in the cache. `backend.php` is loaded on its
 * own here, so the sample `DELETE /staff/photos/<type>/<id>.json` request
 * reaches it; in the full configuration that route is taken earlier by
 * `rules/delete.php` (DeleteHandler, see StaffDeleteRouteTest).
 *
 * Rule files are loaded with inline locals (like DomainRouteOrderingTest
 * does for prod), pointing $cacheFolder at a temporary directory; the
 * handler's HTTP client is swapped for a mock. Each rule file is required
 * from a temporary copy: requiring the original would mark it as included
 * and turn configure.php's later `require_once` of it (in
 * DomainRouteOrderingTest) into a no-op.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class BackendRuleCacheClearTest extends TestCase
{
    /** @var string Temporary $cacheFolder. */
    private string $cacheFolder;

    /** @var string Temporary folder holding the rule file copies. */
    private string $rulesDir;

    protected function setUp(): void
    {
        Configuration::reset();
        $id = uniqid();
        $this->cacheFolder = sys_get_temp_dir() . '/test_backend_rule_cache_clear_' . $id;
        $this->rulesDir    = sys_get_temp_dir() . '/test_backend_rule_files_' . $id;
        mkdir($this->cacheFolder, 0755, true);
        mkdir($this->rulesDir, 0755, true);
    }

    protected function tearDown(): void
    {
        Configuration::reset();
        $this->removeDir($this->cacheFolder);
        $this->removeDir($this->rulesDir);
    }

    // -------------------------------------------------------------------------
    // Dev
    // -------------------------------------------------------------------------

    public function testDevMiddlewareRunsBeforeCacheAndSharesItsFolder(): void
    {
        $handler = $this->loadDevRule();

        $this->assertMiddlewareOrderAndLocation($handler, $this->cacheFolder);
    }

    public function testDevSuccessClearsAndStrips(): void
    {
        $this->assertSuccessClearsAndStrips($this->loadDevRule(), $this->cacheFolder);
    }

    public function testDevFailureStripsWithoutClearing(): void
    {
        $this->assertFailureStripsWithoutClearing($this->loadDevRule(), $this->cacheFolder);
    }

    public function testDevClientSentHeaderHasNoEffect(): void
    {
        $this->assertClientSentHeaderHasNoEffect($this->loadDevRule(), $this->cacheFolder);
    }

    // -------------------------------------------------------------------------
    // Prod
    // -------------------------------------------------------------------------

    public function testProdMiddlewareRunsBeforeCacheAndSharesItsFolder(): void
    {
        $handler = $this->loadProdRule();

        $this->assertMiddlewareOrderAndLocation($handler, $this->prodLocation());
    }

    public function testProdSuccessClearsAndStrips(): void
    {
        $this->assertSuccessClearsAndStrips($this->loadProdRule(), $this->prodLocation());
    }

    public function testProdFailureStripsWithoutClearing(): void
    {
        $this->assertFailureStripsWithoutClearing($this->loadProdRule(), $this->prodLocation());
    }

    public function testProdClientSentHeaderHasNoEffect(): void
    {
        $this->assertClientSentHeaderHasNoEffect($this->loadProdRule(), $this->prodLocation());
    }

    // -------------------------------------------------------------------------
    // Shared assertions
    // -------------------------------------------------------------------------

    /**
     * The middleware is the first one on the handler (so its response side
     * runs before the built-in FileCacheMiddleware stores anything) and
     * clears the same folder the handler caches under.
     */
    private function assertMiddlewareOrderAndLocation(RequestHandler $handler, string $location): void
    {
        $middlewares = (new ReflectionProperty(RequestHandler::class, 'middlewares'))->getValue($handler);

        $this->assertInstanceOf(ResponseCacheClearMiddleware::class, $middlewares[0]);
        $this->assertSame($location, $middlewares[0]->cachePath());

        $fileCaches = array_values(array_filter(
            $middlewares,
            fn ($middleware): bool => $middleware instanceof FileCacheMiddleware
        ));
        $this->assertCount(1, $fileCaches);
        $cacheLocation = (new ReflectionProperty(FileCacheMiddleware::class, 'location'))->getValue($fileCaches[0]);
        $this->assertSame($location, $cacheLocation->basePath());
    }

    private function assertSuccessClearsAndStrips(RequestHandler $handler, string $location): void
    {
        $listed = $this->makeCacheEntry($location, '/staff/photos.json');
        $other  = $this->makeCacheEntry($location, '/games/foo.json');
        $this->injectClient($handler, [
            'httpCode' => 204,
            'body'     => '',
            'headers'  => ['X-Request-Id: 1', 'X-Cache-Clear: /staff/photos.json'],
        ]);

        $response = $handler->handleRequest($this->deleteRequest());

        $this->assertSame(204, $response->httpCode());
        $this->assertSame(['X-Request-Id: 1'], $response->headers());
        $this->assertDirectoryDoesNotExist($listed);
        $this->assertDirectoryExists($other);
        $this->assertNoStoredCacheClearHeader($location);
    }

    private function assertFailureStripsWithoutClearing(RequestHandler $handler, string $location): void
    {
        $entry = $this->makeCacheEntry($location, '/staff/photos.json');
        $this->injectClient($handler, [
            'httpCode' => 403,
            'body'     => '',
            'headers'  => ['X-Cache-Clear: /staff/photos.json'],
        ]);

        $response = $handler->handleRequest($this->deleteRequest());

        $this->assertSame(403, $response->httpCode());
        $this->assertSame([], $response->headers());
        $this->assertDirectoryExists($entry);
    }

    private function assertClientSentHeaderHasNoEffect(RequestHandler $handler, string $location): void
    {
        $entry  = $this->makeCacheEntry($location, '/staff/photos.json');
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
        (new ReflectionProperty(ProxyRequestHandler::class, 'httpClient'))->setValue($handler, $client);

        $response = $handler->handleRequest(
            $this->deleteRequest(['X-Cache-Clear' => '/staff/photos.json'])
        );

        $this->assertSame(204, $response->httpCode());
        $this->assertDirectoryExists($entry);
    }

    /**
     * No cache meta file under $location may contain an X-Cache-Clear line.
     */
    private function assertNoStoredCacheClearHeader(string $location): void
    {
        if (!is_dir($location)) {
            return;
        }
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($location, \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($files as $file) {
            $this->assertStringNotContainsStringIgnoringCase(
                'X-Cache-Clear',
                (string) file_get_contents($file->getPathname()),
                $file->getPathname()
            );
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function loadDevRule(): RequestHandler
    {
        $cacheFolder     = $this->cacheFolder;
        $cacheCleanupMap = [];
        $proxySecret     = '';
        require $this->copyOf('/proxy/dev_configuration/rules/backend.php');

        return $this->matchedHandler();
    }

    private function loadProdRule(): RequestHandler
    {
        $cacheFolder     = $this->cacheFolder;
        $backendHost     = 'https://localhost:3030/';
        $cacheCleanupMap = [];
        $proxySecret     = '';
        require $this->copyOf('/proxy/prod_configuration/rules/backend.php');

        return $this->matchedHandler();
    }

    /**
     * Copies a rule file (relative to sharedRoot()) into the temporary
     * rules folder and returns the copy's path.
     */
    private function copyOf(string $relativePath): string
    {
        $copy = $this->rulesDir . '/rule_' . uniqid() . '.php';
        copy(self::sharedRoot() . $relativePath, $copy);
        return $copy;
    }

    private function prodLocation(): string
    {
        return $this->cacheFolder . '/' . DomainHash::hash(new Request());
    }

    private function matchedHandler(): RequestHandler
    {
        $request = new Request(['requestMethod' => 'DELETE', 'requestPath' => '/staff/photos/main/3.json']);
        foreach (Configuration::getRules() as $rule) {
            /** @var Rule $rule */
            if ($rule->match($request)) {
                return $rule->handler();
            }
        }

        $this->fail('backend.php rule did not match DELETE /staff/photos/main/3.json');
    }

    private function injectClient(RequestHandler $handler, array $backendResponse): void
    {
        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturn($backendResponse);
        (new ReflectionProperty(ProxyRequestHandler::class, 'httpClient'))->setValue($handler, $client);
    }

    private function deleteRequest(array $headers = []): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => '/staff/photos/main/3.json',
            'requestMethod' => 'DELETE',
            'headers'       => $headers,
            'query'         => '',
            'body'          => '',
            'uploadedFiles' => [],
            'postFields'    => [],
        ]);
    }

    private function makeCacheEntry(string $location, string $path): string
    {
        $dir = $location . $path . '/GET';
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

    /**
     * Root directory containing both `extension/` and `proxy/` (see
     * DomainRouteOrderingTest::sharedRoot()).
     */
    private static function sharedRoot(): string
    {
        return dirname(__DIR__, 3);
    }
}
