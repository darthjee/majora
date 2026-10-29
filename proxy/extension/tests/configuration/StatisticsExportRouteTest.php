<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;
use ReflectionProperty;
use Tent\Configuration;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\Models\Request;
use Tent\Models\Rule;
use Tent\RequestHandlers\DefaultProxyRequestHandler;
use Tent\RequestHandlers\ProxyRequestHandler;
use Tent\RequestHandlers\RequestHandler;

/**
 * Guards `GET /staff/statistics/export.json` (issue #1699): the raw
 * statistics export carries IP addresses and user ids, is readable by
 * `statistics:read` scoped tokens (`Authorization: Bearer ...`), and is
 * listed in docs/agents/no-private-cache-routes.md. It must never be served
 * from, nor written to, any Tent cache.
 *
 * The whole dev/prod rule chain is loaded, in the order each
 * `configure.php` requires it, from temporary copies with inline locals
 * and a temporary $cacheFolder. The tests check that:
 *  - the route (with and without a query string) is matched first by
 *    `rules/backend.php`'s generic `.json` rule — not by
 *    `rules/private_game_data_cache.php` (which ignores the backend's
 *    `X-Skip-Cache`) nor by any other rule;
 *  - through that rule, the backend's `X-Skip-Cache: true` (and, for Bearer
 *    requests, BearerSkipCacheMiddleware) keep every response out of the
 *    cache: each request reaches the backend and no cache file is written,
 *    whatever the caller's authentication.
 *
 * The handler's HTTP client is swapped for a mock (see
 * BackendRuleCacheClearTest for the rationale). The working directory is
 * moved to a temporary folder as well, so any cache written relative to it
 * stays inside that folder.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class StatisticsExportRouteTest extends TestCase
{
    private const PATH = '/staff/statistics/export.json';

    private const QUERY = 'from=2026-01-01&to=2026-01-31&page=2';

    /** Rule files in the order both configure.php files require them. */
    private const RULE_FILES = [
        'frontend.php',
        'photos.php',
        'files.php',
        'uploads.php',
        'delete.php',
        'staff_copies.php',
        'cache.php',
        'private_game_data_cache.php',
        'backend.php',
        'domain.php',
        'admin.php',
        'redirects.php',
    ];

    /** @var string Temporary folder holding every cache the rules may write. */
    private string $workDir;

    /** @var string Temporary $cacheFolder (inside $workDir). */
    private string $cacheFolder;

    /** @var string Temporary folder holding the rule file copies. */
    private string $rulesDir;

    /** @var string Working directory restored after each test. */
    private string $originalCwd;

    /** @var array<int, string> Rule file that registered each rule, by index. */
    private array $ruleSources = [];

    /** @var array<int, string> URLs requested from the backend, one per call. */
    private array $backendCalls = [];

    protected function setUp(): void
    {
        Configuration::reset();
        $id = uniqid();
        $this->workDir     = sys_get_temp_dir() . '/test_statistics_export_' . $id;
        $this->cacheFolder = $this->workDir . '/cache_folder';
        $this->rulesDir    = sys_get_temp_dir() . '/test_statistics_export_files_' . $id;
        mkdir($this->cacheFolder, 0755, true);
        mkdir($this->rulesDir, 0755, true);
        $this->originalCwd = (string) getcwd();
        chdir($this->workDir);
        $this->ruleSources  = [];
        $this->backendCalls = [];
    }

    protected function tearDown(): void
    {
        chdir($this->originalCwd);
        Configuration::reset();
        $this->removeDir($this->workDir);
        $this->removeDir($this->rulesDir);
    }

    public static function routeProvider(): array
    {
        return [
            'dev without query'  => ['dev', ''],
            'dev with query'     => ['dev', self::QUERY],
            'prod without query' => ['prod', ''],
            'prod with query'    => ['prod', self::QUERY],
        ];
    }

    public static function callerProvider(): array
    {
        $callers = [
            'bearer' => ['Authorization' => 'Bearer abc'],
            'token'  => ['Authorization' => 'Token abc'],
            'cookie' => ['Cookie' => 'sessionid=abc'],
            'none'   => [],
        ];

        $cases = [];
        foreach (self::routeProvider() as $routeName => [$env, $query]) {
            foreach ($callers as $callerName => $headers) {
                $cases["$routeName, $callerName"] = [$env, $query, $headers];
            }
        }
        return $cases;
    }

    // -------------------------------------------------------------------------
    // Rule matching
    // -------------------------------------------------------------------------

    /**
     * @dataProvider routeProvider
     */
    public function testRouteIsMatchedByTheBackendRuleOnly(string $env, string $query): void
    {
        $this->loadRules($env);

        $matching = $this->matchingRuleSources($this->routeRequest($query));

        $this->assertNotEmpty($matching, 'no rule matched GET ' . self::PATH);
        $this->assertSame('backend.php', $matching[0]);
        $this->assertNotContains('private_game_data_cache.php', $matching);
        $this->assertInstanceOf(
            DefaultProxyRequestHandler::class,
            $this->firstMatchingRule($this->routeRequest($query))->handler()
        );
    }

    // -------------------------------------------------------------------------
    // Caching
    // -------------------------------------------------------------------------

    /**
     * @dataProvider callerProvider
     */
    public function testResponsesAreNeverStoredNorServed(string $env, string $query, array $headers): void
    {
        $handler = $this->loadHandler($env, $query);

        $first  = $handler->handleRequest($this->get($query, $headers));
        $second = $handler->handleRequest($this->get($query, $headers));

        $this->assertSame('{"call":1}', $first->body());
        $this->assertSame('{"call":2}', $second->body());
        $this->assertCount(2, $this->backendCalls);
        $this->assertSame([], $this->cacheFiles());
    }

    /**
     * A token/cookie caller and a Bearer caller of the same URL never share
     * a response either way round.
     *
     * @dataProvider routeProvider
     */
    public function testResponsesAreNotSharedBetweenCallers(string $env, string $query): void
    {
        $handler = $this->loadHandler($env, $query);

        $token  = $handler->handleRequest($this->get($query, ['Authorization' => 'Token abc']));
        $bearer = $handler->handleRequest($this->get($query, ['Authorization' => 'Bearer abc']));
        $cookie = $handler->handleRequest($this->get($query, ['Cookie' => 'sessionid=xyz']));

        $this->assertSame('{"call":1}', $token->body());
        $this->assertSame('{"call":2}', $bearer->body());
        $this->assertSame('{"call":3}', $cookie->body());
        $this->assertCount(3, $this->backendCalls);
        $this->assertSame([], $this->cacheFiles());
    }

    /**
     * @dataProvider routeProvider
     */
    public function testQueryStringReachesTheBackend(string $env, string $query): void
    {
        $handler = $this->loadHandler($env, $query);

        $handler->handleRequest($this->get($query, ['Authorization' => 'Bearer abc']));

        $this->assertCount(1, $this->backendCalls);
        $this->assertStringContainsString(self::PATH, $this->backendCalls[0]);
        if ($query !== '') {
            $this->assertStringEndsWith('?' . $query, $this->backendCalls[0]);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Registers every rule file of the environment, in configure.php order,
     * with inline locals, recording which file registered each rule.
     */
    private function loadRules(string $env): void
    {
        $cacheFolder     = $this->cacheFolder;
        $backendHost     = 'https://localhost:3030/';
        $photosPath      = $this->workDir;
        $filesPath       = $this->workDir;
        $staticRoot      = $this->workDir;
        $cacheCleanupMap = [];
        $proxySecret     = '';

        foreach (self::RULE_FILES as $file) {
            require $this->copyOf("/proxy/{$env}_configuration/rules/{$file}");
            // getRules() always appends Tent's MissingRequestHandler fallback.
            $count = count(Configuration::getRules()) - 1;
            for ($index = count($this->ruleSources); $index < $count; $index++) {
                $this->ruleSources[$index] = $file;
            }
        }
    }

    private function loadHandler(string $env, string $query): RequestHandler
    {
        $this->loadRules($env);
        $rule = $this->firstMatchingRule($this->routeRequest($query));
        if ($rule === null) {
            $this->fail('no rule matched GET ' . self::PATH);
        }

        $handler = $rule->handler();
        $this->injectClient($handler);

        return $handler;
    }

    private function copyOf(string $relativePath): string
    {
        $copy = $this->rulesDir . '/rule_' . uniqid() . '.php';
        copy(self::sharedRoot() . $relativePath, $copy);
        return $copy;
    }

    /**
     * Request parsed from a full URI, the way Tent builds it from
     * REQUEST_URI, so the query string is split off the matched path.
     */
    private function routeRequest(string $query): Request
    {
        $uri = $query === '' ? self::PATH : self::PATH . '?' . $query;
        return new Request(['requestMethod' => 'GET', 'requestUri' => $uri]);
    }

    /**
     * Mirrors Tent\Service\RequestProcessor::getRequestHandler(): the first
     * rule, in registration order, whose matchers apply to the request.
     */
    private function firstMatchingRule(Request $request): ?Rule
    {
        foreach (Configuration::getRules() as $rule) {
            /** @var Rule $rule */
            if ($rule->match($request)) {
                return $rule;
            }
        }
        return null;
    }

    /**
     * Rule files of every rule matching the request, in registration order.
     */
    private function matchingRuleSources(Request $request): array
    {
        $sources = [];
        foreach (Configuration::getRules() as $index => $rule) {
            /** @var Rule $rule */
            if ($rule->match($request)) {
                $sources[] = $this->ruleSources[$index] ?? 'fallback';
            }
        }
        return $sources;
    }

    /**
     * Swaps the handler's HTTP client for a mock that records each requested
     * URL and answers like the real endpoint: a body numbering the call,
     * `X-Skip-Cache: true` and `Cache-Control: private, no-store`.
     */
    private function injectClient(RequestHandler $handler): void
    {
        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturnCallback(
            function (string $method, string $url): array {
                $this->backendCalls[] = $url;
                return [
                    'httpCode' => 200,
                    'body'     => '{"call":' . count($this->backendCalls) . '}',
                    'headers'  => [
                        'Content-Type: application/json',
                        'X-Skip-Cache: true',
                        'Cache-Control: private, no-store',
                    ],
                ];
            }
        );
        (new ReflectionProperty(ProxyRequestHandler::class, 'httpClient'))->setValue($handler, $client);
    }

    private function get(string $query, array $headers = []): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => self::PATH,
            'requestMethod' => 'GET',
            'headers'       => $headers,
            'query'         => $query,
            'body'          => '',
            'uploadedFiles' => [],
            'postFields'    => [],
        ]);
    }

    /**
     * Sorted list of every file currently stored under the work folder,
     * which holds $cacheFolder and any cache written relative to the
     * working directory.
     */
    private function cacheFiles(): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->workDir, \FilesystemIterator::SKIP_DOTS)
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
