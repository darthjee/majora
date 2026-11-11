<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Configuration;
use Tent\Models\ProcessingRequest;
use Tent\Models\Request;
use Tent\Models\Rule;
use Tent\RequestHandlers\StaticFileHandler;

/**
 * Guards the `Cache-Control` each production static rule sends (issue
 * #1733).
 *
 * Until #1733 the production `.htaccess` stamped `max-age=10, public` on
 * every response, whatever the rule had set. It now only fills in a missing
 * `Cache-Control`, so the value each static rule sends is the one clients
 * receive:
 *  - `/` (index.html), `/assets` and `/domain` must keep a 10-second
 *    `max-age=10, public`. A longer max-age on `/` would delay every
 *    frontend release;
 *  - `/files` and `/photos` send `no-cache` (revalidate on every use).
 *
 * The four prod rule files are loaded with inline locals pointing at a
 * temporary static root (prod's `locals.php` is generated at deploy time
 * and is not part of the repo), and each request goes through the handler
 * of the first matching rule, middlewares included.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class ProdStaticCacheControlTest extends TestCase
{
    private const RULE_FILES = ['frontend.php', 'photos.php', 'files.php', 'domain.php'];

    /** @var string Temporary $staticRoot. */
    private string $staticRoot;

    protected function setUp(): void
    {
        Configuration::reset();
        $this->staticRoot = sys_get_temp_dir() . '/test_prod_static_cache_control_' . uniqid();

        $files = [
            'static/index.html',
            'static/assets/app.js',
            'domain/example.com/favicon.png',
            'files/1/sheet.pdf',
            'photos/1/photo.png',
        ];
        foreach ($files as $file) {
            $path = $this->staticRoot . '/' . $file;
            mkdir(dirname($path), 0755, true);
            file_put_contents($path, 'content');
        }

        $staticRoot = $this->staticRoot;
        foreach (self::RULE_FILES as $ruleFile) {
            require dirname(__DIR__, 3) . '/proxy/prod_configuration/rules/' . $ruleFile;
        }
    }

    protected function tearDown(): void
    {
        Configuration::reset();
        $this->removeDir($this->staticRoot);
    }

    public static function pathProvider(): array
    {
        return [
            'index.html'       => ['/', 'max-age=10, public'],
            'asset'            => ['/assets/app.js', 'max-age=10, public'],
            'missing asset'    => ['/assets/missing.js', 'max-age=10, public'],
            'domain favicon'   => ['/domain/example.com/favicon.png', 'max-age=10, public'],
            'file'             => ['/files/1/sheet.pdf', 'no-cache'],
            'photo'            => ['/photos/1/photo.png', 'no-cache'],
        ];
    }

    /**
     * @dataProvider pathProvider
     */
    public function testStaticRuleSendsASingleCacheControl(string $path, string $expected): void
    {
        $this->assertSame([$expected], $this->cacheControlValues($this->get($path)));
    }

    /**
     * An `Authorization` request header does not change what a static rule
     * sends (the `.htaccess` default is skipped for such requests, so the
     * rule's own value is all the client gets).
     *
     * @dataProvider pathProvider
     */
    public function testAuthorizationHeaderDoesNotChangeTheValue(string $path, string $expected): void
    {
        $response = $this->get($path, ['Authorization' => 'Token abc']);

        $this->assertSame([$expected], $this->cacheControlValues($response));
    }

    public function testExistingFilesAreServed(): void
    {
        foreach (self::pathProvider() as $name => [$path]) {
            $expected = $name === 'missing asset' ? 404 : 200;
            $this->assertSame($expected, $this->get($path)->httpCode(), $path);
        }
    }

    private function get(string $path, array $headers = [])
    {
        $rule = $this->firstMatchingRule($path);
        $this->assertNotNull($rule, "no rule matched GET $path");
        $this->assertInstanceOf(StaticFileHandler::class, $rule->handler());

        return $rule->handler()->handleRequest(
            new ProcessingRequest(
                [
                'requestPath'   => $path,
                'requestMethod' => 'GET',
                'headers'       => $headers,
                'query'         => '',
                'body'          => '',
                'uploadedFiles' => [],
                ]
            )
        );
    }

    /**
     * Mirrors Tent\Service\RequestProcessor::getRequestHandler(): the first
     * rule, in registration order, whose matchers apply to the request.
     */
    private function firstMatchingRule(string $path): ?Rule
    {
        $request = new Request(['requestMethod' => 'GET', 'requestPath' => $path]);

        foreach (Configuration::getRules() as $rule) {
            if ($rule->match($request)) {
                return $rule;
            }
        }

        return null;
    }

    /**
     * @return array<int, string> Every Cache-Control value on the response.
     */
    private function cacheControlValues($response): array
    {
        $values = [];
        foreach ($response->headers() as $headerLine) {
            [$name, $value] = array_pad(explode(':', $headerLine, 2), 2, '');
            if (strtolower(trim($name)) === 'cache-control') {
                $values[] = trim($value);
            }
        }

        return $values;
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
            is_dir($path) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }
}
