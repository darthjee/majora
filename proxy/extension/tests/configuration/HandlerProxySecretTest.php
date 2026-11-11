<?php

namespace Tent\Configuration\Tests;

use PHPUnit\Framework\TestCase;
use ReflectionProperty;
use Tent\Configuration;
use Tent\Models\Request;
use Tent\Models\Rule;
use Tent\RequestHandlers\BackendClient;
use Tent\RequestHandlers\CacheClearHandler;
use Tent\RequestHandlers\CacheSizeHandler;
use Tent\RequestHandlers\DeleteHandler;
use Tent\RequestHandlers\LinkHandler;
use Tent\RequestHandlers\UploadHandler;

/**
 * Every custom-handler rule must hand the proxy secret ($proxySecret) to its
 * handler, so the handler's backend calls carry the signed client IP
 * (X-Forwarded-For + X-Proxy-Secret) like the plain proxy rules do through
 * SetClientIpMiddleware (issue #1738). Loads the real dev/prod `uploads.php`,
 * `delete.php` and `cache.php` rule files from temporary copies (see
 * BackendRuleCacheClearTest for why copies are required) with a dummy secret.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class HandlerProxySecretTest extends TestCase
{
    private const SECRET = 'dummy-secret';

    private const RULE_FILES = ['uploads.php', 'delete.php', 'cache.php'];

    /** @var string Temporary folder holding the rule file copies and cache. */
    private string $tmpDir;

    protected function setUp(): void
    {
        Configuration::reset();
        $this->tmpDir = sys_get_temp_dir() . '/test_handler_proxy_secret_' . uniqid();
        mkdir($this->tmpDir, 0755, true);
    }

    protected function tearDown(): void
    {
        Configuration::reset();
        foreach (glob($this->tmpDir . '/*') as $file) {
            unlink($file);
        }
        rmdir($this->tmpDir);
    }

    public function testDevHandlersReceiveTheProxySecret(): void
    {
        $cacheFolder = $this->tmpDir;
        $proxySecret = self::SECRET;
        foreach (self::RULE_FILES as $ruleFile) {
            require $this->copyOf('/proxy/dev_configuration/rules/' . $ruleFile);
        }

        $this->assertHandlersSecret(self::SECRET);
    }

    public function testProdHandlersReceiveTheProxySecret(): void
    {
        $cacheFolder = $this->tmpDir;
        $backendHost = 'https://localhost:3030/';
        $photosPath  = '/var/www/html';
        $filesPath   = '/var/www/html';
        $proxySecret = self::SECRET;
        foreach (self::RULE_FILES as $ruleFile) {
            require $this->copyOf('/proxy/prod_configuration/rules/' . $ruleFile);
        }

        $this->assertHandlersSecret(self::SECRET);
    }

    /**
     * An empty $proxySecret reaches the handlers as no secret at all.
     */
    public function testProdHandlersReceiveNoSecretWhenEmpty(): void
    {
        $cacheFolder = $this->tmpDir;
        $backendHost = 'https://localhost:3030/';
        $photosPath  = '/var/www/html';
        $filesPath   = '/var/www/html';
        $proxySecret = '';
        foreach (self::RULE_FILES as $ruleFile) {
            require $this->copyOf('/proxy/prod_configuration/rules/' . $ruleFile);
        }

        $this->assertHandlersSecret('');
    }

    private function assertHandlersSecret(string $expected): void
    {
        $routes = [
            UploadHandler::class     => ['POST', '/uploads/image/7/submit'],
            LinkHandler::class       => ['POST', '/uploads/link/image/7/submit'],
            DeleteHandler::class     => ['DELETE', '/staff/photos/main/3.json'],
            CacheSizeHandler::class  => ['GET', '/staff/cache/size.json'],
            CacheClearHandler::class => ['DELETE', '/staff/cache/disk.json'],
        ];

        foreach ($routes as $handlerClass => [$method, $path]) {
            $handler = $this->matchedHandler($method, $path);

            $this->assertInstanceOf($handlerClass, $handler);
            $this->assertSame($expected, $this->secretOf($handler), $handlerClass);
        }
    }

    private function secretOf(object $handler): string
    {
        $clientProp = new ReflectionProperty($handler, 'client');
        $clientProp->setAccessible(true);

        $secretProp = new ReflectionProperty(BackendClient::class, 'secret');
        $secretProp->setAccessible(true);

        return $secretProp->getValue($clientProp->getValue($handler));
    }

    private function copyOf(string $relativePath): string
    {
        $copy = $this->tmpDir . '/rule_' . uniqid() . '.php';
        copy(dirname(__DIR__, 3) . $relativePath, $copy);
        return $copy;
    }

    private function matchedHandler(string $method, string $path)
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
}
