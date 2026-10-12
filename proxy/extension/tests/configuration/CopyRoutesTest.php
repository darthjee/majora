<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;
use ReflectionProperty;
use Tent\Cache\DomainHash;
use Tent\Configuration;
use Tent\Http\HttpClientInterface;
use Tent\Middlewares\ResponseCacheClearMiddleware;
use Tent\Middlewares\SetClientIpMiddleware;
use Tent\Models\ProcessingRequest;
use Tent\Models\Request;
use Tent\Models\Rule;
use Tent\RequestHandlers\DefaultProxyRequestHandler;
use Tent\RequestHandlers\LinkHandler;
use Tent\RequestHandlers\ProxyRequestHandler;
use Tent\RequestHandlers\RequestHandler;
use Tent\RequestHandlers\ResponseCacheClearer;
use Tent\RequestHandlers\UploadHandler;

/**
 * Routing for game content copy (issue #1570), loading the real dev/prod
 * `uploads.php`, `staff_copies.php` and `backend.php` rule files in
 * configure.php's order, from temporary copies (see
 * BackendRuleCacheClearTest for why copies are required):
 *
 *   - the narrowed UploadHandler matcher and the new LinkHandler matcher;
 *   - UploadHandler's clearer wired with the cache root ($cacheFolder), so it
 *     clears across every domain folder (issue #1580);
 *   - the copy request rule (`POST /staff/copies/<type>/<id>.json`), whose
 *     ResponseCacheClearMiddleware runs in cross-domain mode, while other
 *     staff/copies routes keep going through backend.php.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class CopyRoutesTest extends TestCase
{
    /** @var string Temporary $cacheFolder. */
    private string $cacheFolder;

    /** @var string Temporary folder holding the rule file copies. */
    private string $rulesDir;

    protected function setUp(): void
    {
        Configuration::reset();
        $id = uniqid();
        $this->cacheFolder = sys_get_temp_dir() . '/test_copy_routes_cache_' . $id;
        $this->rulesDir    = sys_get_temp_dir() . '/test_copy_routes_rules_' . $id;
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
    // Tests
    // -------------------------------------------------------------------------

    public function testDevRouting(): void
    {
        $this->loadDev();

        $this->assertRouting();
    }

    public function testProdRouting(): void
    {
        $this->loadProd();

        $this->assertRouting();
    }

    public function testDevCopyRuleClearsAcrossDomainsAndStrips(): void
    {
        $this->loadDev();

        $this->assertCopyRuleClearsAcrossDomainsAndStrips();
    }

    public function testProdCopyRuleClearsAcrossDomainsAndStrips(): void
    {
        $this->loadProd();

        $this->assertCopyRuleClearsAcrossDomainsAndStrips();
    }

    // -------------------------------------------------------------------------
    // Shared assertions
    // -------------------------------------------------------------------------

    private function assertRouting(): void
    {
        $uploadHandler = $this->matchedHandler('POST', '/uploads/image/1/submit');
        $this->assertInstanceOf(UploadHandler::class, $uploadHandler);
        $this->assertSame($this->cacheFolder, $this->clearerRootOf($uploadHandler));
        $this->assertInstanceOf(UploadHandler::class, $this->matchedHandler('POST', '/uploads/file/1/submit'));
        $this->assertInstanceOf(LinkHandler::class, $this->matchedHandler('POST', '/uploads/link/image/1/submit'));
        $this->assertInstanceOf(LinkHandler::class, $this->matchedHandler('POST', '/uploads/link/file/1/submit'));

        foreach ([
            '/uploads/foo/1/submit',
            '/uploads/link/foo/1/submit',
            '/uploads/image/1/submit/extra',
            '/uploads/link/image/x/submit',
        ] as $path) {
            $this->assertNull($this->matchedHandler('POST', $path), $path);
        }
        $this->assertNull($this->matchedHandler('GET', '/uploads/link/image/1/submit'));

        $copyHandler = $this->matchedHandler('POST', '/staff/copies/items/3.json');
        $this->assertInstanceOf(DefaultProxyRequestHandler::class, $copyHandler);
        $this->assertCopyMiddlewares($copyHandler);

        $backendHandler = $this->matchedHandler('GET', '/staff/copies/items.json');
        $this->assertInstanceOf(DefaultProxyRequestHandler::class, $backendHandler);
        $this->assertNotSame($copyHandler, $backendHandler);
        $this->assertFalse($this->clearMiddlewareOf($backendHandler)->isCrossDomain());

        $renewHandler = $this->matchedHandler('POST', '/staff/copies/links/5/renew.json');
        $this->assertInstanceOf(DefaultProxyRequestHandler::class, $renewHandler);
        $this->assertFalse($this->clearMiddlewareOf($renewHandler)->isCrossDomain());

        $this->assertFalse(
            $this->clearMiddlewareOf($this->matchedHandler('GET', '/staff/copies/items/3.json'))->isCrossDomain()
        );
    }

    private function assertCopyMiddlewares(RequestHandler $handler): void
    {
        $clear = $this->clearMiddlewareOf($handler);
        $this->assertTrue($clear->isCrossDomain());
        $this->assertSame($this->cacheFolder, $clear->cachePath());

        $middlewares = $this->middlewaresOf($handler);
        $this->assertNotEmpty(array_filter(
            $middlewares,
            fn ($middleware): bool => $middleware instanceof SetClientIpMiddleware
        ));
    }

    private function assertCopyRuleClearsAcrossDomainsAndStrips(): void
    {
        $handler = $this->matchedHandler('POST', '/staff/copies/items/3.json');
        $domainA = $this->cacheFolder . '/domain_' . hash('sha256', 'a.example');
        $domainB = $this->cacheFolder . '/' . DomainHash::hash(new Request());
        $entries = [];
        foreach ([$this->cacheFolder, $domainA, $domainB] as $folder) {
            $entries[] = $this->makeCacheEntry($folder, '/games/target/items.json');
        }
        $other = $this->makeCacheEntry($domainA, '/games/other/items.json');

        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturn([
            'httpCode' => 201,
            'body'     => '{}',
            'headers'  => ['Content-Type: application/json', 'X-Cache-Clear: /games/target/items.json'],
        ]);
        (new ReflectionProperty(ProxyRequestHandler::class, 'httpClient'))->setValue($handler, $client);

        $response = $handler->handleRequest(new ProcessingRequest([
            'requestPath'   => '/staff/copies/items/3.json',
            'requestMethod' => 'POST',
            'headers'       => [],
            'query'         => '',
            'body'          => '{"to":"target"}',
            'uploadedFiles' => [],
            'postFields'    => [],
        ]));

        $this->assertSame(201, $response->httpCode());
        foreach ($response->headers() as $line) {
            $this->assertStringStartsNotWith('x-cache-clear', strtolower($line));
        }
        foreach ($entries as $entry) {
            $this->assertDirectoryDoesNotExist($entry);
        }
        $this->assertDirectoryExists($other);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function loadDev(): void
    {
        $cacheFolder     = $this->cacheFolder;
        $cacheCleanupMap = [];
        $proxySecret     = '';
        require $this->copyOf('/proxy/dev_configuration/rules/uploads.php');
        require $this->copyOf('/proxy/dev_configuration/rules/staff_copies.php');
        require $this->copyOf('/proxy/dev_configuration/rules/backend.php');
    }

    private function loadProd(): void
    {
        $cacheFolder     = $this->cacheFolder;
        $backendHost     = 'https://localhost:3030/';
        $photosPath      = '/var/www/html';
        $filesPath       = '/var/www/html';
        $cacheCleanupMap = [];
        $proxySecret     = '';
        require $this->copyOf('/proxy/prod_configuration/rules/uploads.php');
        require $this->copyOf('/proxy/prod_configuration/rules/staff_copies.php');
        require $this->copyOf('/proxy/prod_configuration/rules/backend.php');
    }

    private function middlewaresOf(RequestHandler $handler): array
    {
        return (new ReflectionProperty(RequestHandler::class, 'middlewares'))->getValue($handler);
    }

    private function clearMiddlewareOf(RequestHandler $handler): ResponseCacheClearMiddleware
    {
        foreach ($this->middlewaresOf($handler) as $middleware) {
            if ($middleware instanceof ResponseCacheClearMiddleware) {
                return $middleware;
            }
        }

        $this->fail('No ResponseCacheClearMiddleware on handler');
    }

    private function clearerRootOf(UploadHandler $handler): ?string
    {
        $clearer = (new ReflectionProperty(UploadHandler::class, 'cacheClearer'))->getValue($handler);

        return (new ReflectionProperty(ResponseCacheClearer::class, 'root'))->getValue($clearer);
    }

    private function copyOf(string $relativePath): string
    {
        $copy = $this->rulesDir . '/rule_' . uniqid() . '.php';
        copy(dirname(__DIR__, 3) . $relativePath, $copy);
        return $copy;
    }

    private function matchedHandler(string $method, string $path): ?RequestHandler
    {
        $request = new Request(['requestMethod' => $method, 'requestPath' => $path]);
        foreach (Configuration::getRules() as $rule) {
            /** @var Rule $rule */
            if ($rule->match($request)) {
                return $rule->handler();
            }
        }

        return null;
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
}
