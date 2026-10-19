<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;
use ReflectionProperty;
use Tent\Configuration;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\Models\Request;
use Tent\Models\Rule;
use Tent\RequestHandlers\ProxyRequestHandler;
use Tent\RequestHandlers\RequestHandler;

/**
 * Exercises the real dev/prod `rules/private_game_data_cache.php` files end
 * to end (issue #1643): the per-caller cache must never serve or store a
 * response for a Bearer request (`Authorization: Bearer ...`) nor for a
 * request without a non-empty `X-Cache-Token`, while `Token`
 * requests carrying an `X-Cache-Token` keep being cached per token. The
 * backend's unconditional `X-Skip-Cache: true` on these routes keeps being
 * ignored by this rule.
 *
 * Rule files are loaded from temporary copies with inline locals and a
 * temporary $cacheFolder, and the handler's HTTP client is swapped for a
 * mock (see BackendRuleCacheClearTest for the rationale). The working
 * directory is moved to a temporary folder as well, so any cache written
 * relative to it stays inside that folder.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class PrivateRuleBearerCacheTest extends TestCase
{
    private const PATH = '/games/foo/npcs/all.json';

    /** @var string Temporary folder holding every cache the rule may write. */
    private string $workDir;

    /** @var string Temporary $cacheFolder (inside $workDir). */
    private string $cacheFolder;

    /** @var string Temporary folder holding the rule file copies. */
    private string $rulesDir;

    /** @var string Working directory restored after each test. */
    private string $originalCwd;

    /** @var int Number of backend calls so far. */
    private int $backendCalls = 0;

    protected function setUp(): void
    {
        Configuration::reset();
        $id = uniqid();
        $this->workDir     = sys_get_temp_dir() . '/test_private_rule_bearer_' . $id;
        $this->cacheFolder = $this->workDir . '/cache_folder';
        $this->rulesDir    = sys_get_temp_dir() . '/test_private_rule_bearer_files_' . $id;
        mkdir($this->cacheFolder, 0755, true);
        mkdir($this->rulesDir, 0755, true);
        $this->originalCwd = (string) getcwd();
        chdir($this->workDir);
        $this->backendCalls = 0;
    }

    protected function tearDown(): void
    {
        chdir($this->originalCwd);
        Configuration::reset();
        $this->removeDir($this->workDir);
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
    // Bearer requests
    // -------------------------------------------------------------------------

    /**
     * @dataProvider environmentProvider
     */
    public function testBearerGetWithCacheTokenIsNeverWritten(string $env): void
    {
        $handler = $this->loadRule($env);
        $headers = ['Authorization' => 'Bearer abc', 'X-Cache-Token' => 't1'];

        $first  = $handler->handleRequest($this->get($headers));
        $second = $handler->handleRequest($this->get($headers));

        $this->assertSame('{"call":1}', $first->body());
        $this->assertSame('{"call":2}', $second->body());
        $this->assertSame(2, $this->backendCalls);
        $this->assertSame([], $this->cacheFiles());
    }

    /**
     * @dataProvider environmentProvider
     */
    public function testBearerGetWithCacheTokenIsNeverServed(string $env): void
    {
        $handler = $this->loadRule($env);

        $handler->handleRequest($this->get(['Authorization' => 'Token abc', 'X-Cache-Token' => 't1']));
        $filesAfterPriming = $this->cacheFiles();
        $bearer = $handler->handleRequest(
            $this->get(['Authorization' => 'Bearer abc', 'X-Cache-Token' => 't1'])
        );

        $this->assertNotEmpty($filesAfterPriming);
        $this->assertSame('{"call":2}', $bearer->body());
        $this->assertSame(2, $this->backendCalls);
        $this->assertSame($filesAfterPriming, $this->cacheFiles());
    }

    // -------------------------------------------------------------------------
    // Missing / empty X-Cache-Token
    // -------------------------------------------------------------------------

    public static function tokenlessProvider(): array
    {
        return [
            'dev missing'  => ['dev', []],
            'dev empty'    => ['dev', ['X-Cache-Token' => '']],
            'dev blank'    => ['dev', ['X-Cache-Token' => '  ']],
            'prod missing' => ['prod', []],
            'prod empty'   => ['prod', ['X-Cache-Token' => '']],
            'prod blank'   => ['prod', ['X-Cache-Token' => '  ']],
        ];
    }

    /**
     * @dataProvider tokenlessProvider
     */
    public function testTokenlessGetIsNeverStoredNorServed(string $env, array $headers): void
    {
        $handler = $this->loadRule($env);

        $first = $handler->handleRequest(
            $this->get(array_merge(['Authorization' => 'Token abc'], $headers))
        );
        $anonymous = $handler->handleRequest($this->get());

        $this->assertSame('{"call":1}', $first->body());
        $this->assertSame('{"call":2}', $anonymous->body());
        $this->assertSame(2, $this->backendCalls);
        $this->assertSame([], $this->cacheFiles());
    }

    // -------------------------------------------------------------------------
    // Token requests with X-Cache-Token
    // -------------------------------------------------------------------------

    /**
     * @dataProvider environmentProvider
     */
    public function testTokenGetIsStillCachedPerToken(string $env): void
    {
        $handler = $this->loadRule($env);

        $first  = $handler->handleRequest($this->get(['Authorization' => 'Token abc', 'X-Cache-Token' => 't1']));
        $cached = $handler->handleRequest($this->get(['Authorization' => 'Token abc', 'X-Cache-Token' => 't1']));
        $other  = $handler->handleRequest($this->get(['Authorization' => 'Token xyz', 'X-Cache-Token' => 't2']));

        $this->assertSame('{"call":1}', $first->body());
        $this->assertSame('{"call":1}', $cached->body());
        $this->assertSame('{"call":2}', $other->body());
        $this->assertSame(2, $this->backendCalls);
    }

    /**
     * A forged `X-Bearer-Request` on a non-Bearer request only bypasses that
     * request's own cache use: the entry stored for the token stays intact
     * and keeps being served.
     *
     * @dataProvider environmentProvider
     */
    public function testForgedBearerMarkerOnlyAffectsTheForgingRequest(string $env): void
    {
        $handler = $this->loadRule($env);
        $headers = ['Authorization' => 'Token abc', 'X-Cache-Token' => 't1'];

        $handler->handleRequest($this->get($headers));
        $filesAfterPriming = $this->cacheFiles();
        $forged = $handler->handleRequest(
            $this->get(array_merge($headers, ['X-Bearer-Request' => 'true']))
        );
        $other = $handler->handleRequest($this->get($headers));

        $this->assertSame('{"call":2}', $forged->body());
        $this->assertSame('{"call":1}', $other->body());
        $this->assertSame(2, $this->backendCalls);
        $this->assertSame($filesAfterPriming, $this->cacheFiles());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function loadRule(string $env): RequestHandler
    {
        $cacheFolder = $this->cacheFolder;
        $backendHost = 'https://localhost:3030/';
        $proxySecret = '';
        require $this->copyOf("/proxy/{$env}_configuration/rules/private_game_data_cache.php");

        $handler = $this->matchedHandler();
        $this->injectClient($handler);

        return $handler;
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

        $this->fail('private_game_data_cache.php rule did not match GET ' . self::PATH);
    }

    /**
     * Swaps the handler's HTTP client for a mock that answers with a body
     * numbering the call and, like the real routes, `X-Skip-Cache: true`.
     */
    private function injectClient(RequestHandler $handler): void
    {
        $client = $this->createMock(HttpClientInterface::class);
        $client->method('request')->willReturnCallback(
            function (): array {
                $this->backendCalls++;
                return [
                    'httpCode' => 200,
                    'body'     => '{"call":' . $this->backendCalls . '}',
                    'headers'  => ['Content-Type: application/json', 'X-Skip-Cache: true'],
                ];
            }
        );
        (new ReflectionProperty(ProxyRequestHandler::class, 'httpClient'))->setValue($handler, $client);
    }

    private function get(array $headers = []): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => self::PATH,
            'requestMethod' => 'GET',
            'headers'       => $headers,
            'query'         => '',
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
