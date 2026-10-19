<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;
use ReflectionProperty;
use Tent\Cache\DomainHash;
use Tent\Configuration;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\Models\Request;
use Tent\Models\Rule;
use Tent\RequestHandlers\ProxyRequestHandler;
use Tent\RequestHandlers\RequestHandler;

/**
 * Exercises the real dev/prod `rules/backend.php` files end to end (issue
 * #1643): requests authenticated with a scoped API token
 * (`Authorization: Bearer ...`) must never be served from, nor written to,
 * the shared backend cache, while Bearer writes still clear stale entries
 * (CacheCleanupMiddleware and ResponseCacheClearMiddleware). `Token` and
 * cookie requests keep being cached, and a forged `X-Skip-Cache` only
 * affects the forging request.
 *
 * Rule files are loaded from temporary copies with inline locals and a
 * temporary $cacheFolder, and the handler's HTTP client is swapped for a
 * mock (see BackendRuleCacheClearTest for the rationale).
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class BackendRuleBearerCacheTest extends TestCase
{
    private const PATH = '/games/foo/npcs/3.json';

    /** @var string Temporary $cacheFolder. */
    private string $cacheFolder;

    /** @var string Temporary folder holding the rule file copies. */
    private string $rulesDir;

    /** @var array<int, array> Headers sent to the backend, one entry per call. */
    private array $backendCalls = [];

    /** @var array Response the mocked backend returns for mutating requests. */
    private array $writeResponse = ['httpCode' => 204, 'body' => '', 'headers' => []];

    protected function setUp(): void
    {
        Configuration::reset();
        $id = uniqid();
        $this->cacheFolder = sys_get_temp_dir() . '/test_backend_rule_bearer_cache_' . $id;
        $this->rulesDir    = sys_get_temp_dir() . '/test_backend_rule_bearer_files_' . $id;
        mkdir($this->cacheFolder, 0755, true);
        mkdir($this->rulesDir, 0755, true);
        $this->backendCalls = [];
    }

    protected function tearDown(): void
    {
        Configuration::reset();
        $this->removeDir($this->cacheFolder);
        $this->removeDir($this->rulesDir);
    }

    public static function environmentProvider(): array
    {
        return [
            'dev'  => ['dev'],
            'prod' => ['prod'],
        ];
    }

    // -------------------------------------------------------------------------
    // Bearer reads
    // -------------------------------------------------------------------------

    /**
     * @dataProvider environmentProvider
     */
    public function testBearerGetIsNeverWrittenToCache(string $env): void
    {
        $handler = $this->loadRule($env);

        $first  = $handler->handleRequest($this->get(['Authorization' => 'Bearer abc']));
        $second = $handler->handleRequest($this->get(['Authorization' => 'Bearer abc']));

        $this->assertSame('{"call":1}', $first->body());
        $this->assertSame('{"call":2}', $second->body());
        $this->assertCount(2, $this->backendCalls);
        $this->assertSame([], $this->cacheFiles());
    }

    /**
     * @dataProvider environmentProvider
     */
    public function testEntryPrimedByPlainGetIsNotServedToBearer(string $env): void
    {
        $handler = $this->loadRule($env);

        $handler->handleRequest($this->get());
        $filesAfterPriming = $this->cacheFiles();
        $bearer = $handler->handleRequest($this->get(['Authorization' => 'Bearer abc']));

        $this->assertNotEmpty($filesAfterPriming);
        $this->assertSame('{"call":2}', $bearer->body());
        $this->assertCount(2, $this->backendCalls);
        $this->assertSame($filesAfterPriming, $this->cacheFiles());
    }

    /**
     * @dataProvider environmentProvider
     */
    public function testBearerRequestReachesBackendWithItsAuthorization(string $env): void
    {
        $handler = $this->loadRule($env);

        $handler->handleRequest($this->get(['Authorization' => 'Bearer abc']));

        $this->assertSame('Bearer abc', $this->backendCalls[0]['Authorization'] ?? null);
    }

    // -------------------------------------------------------------------------
    // Bearer writes
    // -------------------------------------------------------------------------

    public static function writeProvider(): array
    {
        return [
            'dev POST'    => ['dev', 'POST'],
            'dev PATCH'   => ['dev', 'PATCH'],
            'dev DELETE'  => ['dev', 'DELETE'],
            'prod POST'   => ['prod', 'POST'],
            'prod PATCH'  => ['prod', 'PATCH'],
            'prod DELETE' => ['prod', 'DELETE'],
        ];
    }

    /**
     * CacheCleanupMiddleware ('collection' and 'entity' targets) still runs
     * for Bearer writes.
     *
     * @dataProvider writeProvider
     */
    public function testBearerWriteRunsCacheCleanup(string $env, string $method): void
    {
        $handler    = $this->loadRule($env);
        $entity     = $this->makeCacheEntry($env, self::PATH);
        $collection = $this->makeCacheEntry($env, '/games/foo/npcs');
        $other      = $this->makeCacheEntry($env, '/games/bar.json');

        $response = $handler->handleRequest(
            $this->request($method, ['Authorization' => 'Bearer abc'])
        );

        $this->assertSame(204, $response->httpCode());
        $this->assertDirectoryDoesNotExist($entity);
        $this->assertDirectoryDoesNotExist($collection);
        $this->assertDirectoryExists($other);
    }

    /**
     * ResponseCacheClearMiddleware still clears the backend's X-Cache-Clear
     * paths for Bearer writes.
     *
     * @dataProvider writeProvider
     */
    public function testBearerWriteRunsResponseCacheClear(string $env, string $method): void
    {
        $handler = $this->loadRule($env);
        $listed  = $this->makeCacheEntry($env, '/games/foo/npcs/all.json');
        $other   = $this->makeCacheEntry($env, '/games/bar.json');
        $this->writeResponse = [
            'httpCode' => 200,
            'body'     => '{}',
            'headers'  => ['X-Cache-Clear: /games/foo/npcs/all.json', 'X-Skip-Cache: true'],
        ];

        $response = $handler->handleRequest(
            $this->request($method, ['Authorization' => 'Bearer abc'])
        );

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(['X-Skip-Cache: true'], $response->headers());
        $this->assertDirectoryDoesNotExist($listed);
        $this->assertDirectoryExists($other);
    }

    // -------------------------------------------------------------------------
    // Non-Bearer requests
    // -------------------------------------------------------------------------

    public static function cachedHeadersProvider(): array
    {
        return [
            'dev token'   => ['dev', ['Authorization' => 'Token abc']],
            'dev cookie'  => ['dev', ['Cookie' => 'sessionid=abc']],
            'dev none'    => ['dev', []],
            'prod token'  => ['prod', ['Authorization' => 'Token abc']],
            'prod cookie' => ['prod', ['Cookie' => 'sessionid=abc']],
            'prod none'   => ['prod', []],
        ];
    }

    /**
     * @dataProvider cachedHeadersProvider
     */
    public function testNonBearerGetIsStillCached(string $env, array $headers): void
    {
        $handler = $this->loadRule($env);

        $first  = $handler->handleRequest($this->get($headers));
        $second = $handler->handleRequest($this->get($headers));

        $this->assertSame('{"call":1}', $first->body());
        $this->assertSame('{"call":1}', $second->body());
        $this->assertCount(1, $this->backendCalls);
        $this->assertNotEmpty($this->cacheFiles());
    }

    /**
     * A forged `X-Skip-Cache` on a non-Bearer request only bypasses that
     * request's own cache use: the entry primed by another caller stays
     * intact and keeps being served to that caller.
     *
     * @dataProvider environmentProvider
     */
    public function testForgedSkipCacheOnlyAffectsTheForgingRequest(string $env): void
    {
        $handler = $this->loadRule($env);

        $handler->handleRequest($this->get(['Authorization' => 'Token abc']));
        $filesAfterPriming = $this->cacheFiles();
        $forged = $handler->handleRequest(
            $this->get(['Authorization' => 'Token xyz', 'X-Skip-Cache' => 'true'])
        );
        $other = $handler->handleRequest($this->get(['Authorization' => 'Token abc']));

        $this->assertSame('{"call":2}', $forged->body());
        $this->assertSame('{"call":1}', $other->body());
        $this->assertCount(2, $this->backendCalls);
        $this->assertSame($filesAfterPriming, $this->cacheFiles());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function loadRule(string $env): RequestHandler
    {
        $cacheFolder     = $this->cacheFolder;
        $backendHost     = 'https://localhost:3030/';
        $cacheCleanupMap = [];
        $proxySecret     = '';
        require $this->copyOf("/proxy/{$env}_configuration/rules/backend.php");

        $handler = $this->matchedHandler();
        $this->injectClient($handler);

        return $handler;
    }

    /**
     * Folder the rule caches under for the given environment.
     */
    private function location(string $env): string
    {
        return $env === 'prod'
            ? $this->cacheFolder . '/' . DomainHash::hash(new Request())
            : $this->cacheFolder;
    }

    private function copyOf(string $relativePath): string
    {
        $copy = $this->rulesDir . '/rule_' . uniqid() . '.php';
        copy(self::sharedRoot() . $relativePath, $copy);
        return $copy;
    }

    private function matchedHandler(): RequestHandler
    {
        $request = new Request(['requestMethod' => 'GET', 'requestPath' => self::PATH]);
        foreach (Configuration::getRules() as $rule) {
            /** @var Rule $rule */
            if ($rule->match($request)) {
                return $rule->handler();
            }
        }

        $this->fail('backend.php rule did not match GET ' . self::PATH);
    }

    /**
     * Swaps the handler's HTTP client for a mock that records the headers
     * of each call and answers GETs with a body numbering the call.
     */
    private function injectClient(RequestHandler $handler): void
    {
        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturnCallback(
            function (string $method, string $url, array $headers): array {
                $this->backendCalls[] = $headers;
                if ($method !== 'GET') {
                    return $this->writeResponse;
                }
                return [
                    'httpCode' => 200,
                    'body'     => '{"call":' . count($this->backendCalls) . '}',
                    'headers'  => ['Content-Type: application/json'],
                ];
            }
        );
        (new ReflectionProperty(ProxyRequestHandler::class, 'httpClient'))->setValue($handler, $client);
    }

    private function get(array $headers = []): ProcessingRequest
    {
        return $this->request('GET', $headers);
    }

    private function request(string $method, array $headers = []): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => self::PATH,
            'requestMethod' => $method,
            'headers'       => $headers,
            'query'         => '',
            'body'          => '',
            'uploadedFiles' => [],
            'postFields'    => [],
        ]);
    }

    private function makeCacheEntry(string $env, string $path): string
    {
        $dir = $this->location($env) . $path . '/GET';
        mkdir($dir, 0755, true);
        file_put_contents($dir . '/abc.body.dat', '{}');
        return $dir;
    }

    /**
     * Sorted list of every file currently stored under the cache folder.
     */
    private function cacheFiles(): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->cacheFolder, \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            $files[] = $file->getPathname();
        }
        sort($files);
        return $files;
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
