<?php

namespace Tent\Middlewares\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Middlewares\SetClientIpMiddleware;
use Tent\Models\ProcessingRequest;

/**
 * Unit tests for SetClientIpMiddleware.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class SetClientIpMiddlewareTest extends TestCase
{
    /**
     * @var string|null Original REMOTE_ADDR, restored after each test.
     */
    private $originalRemoteAddr;

    protected function setUp(): void
    {
        $this->originalRemoteAddr = $_SERVER['REMOTE_ADDR'] ?? null;
    }

    protected function tearDown(): void
    {
        if ($this->originalRemoteAddr === null) {
            unset($_SERVER['REMOTE_ADDR']);
        } else {
            $_SERVER['REMOTE_ADDR'] = $this->originalRemoteAddr;
        }
    }

    /**
     * Builds a real ProcessingRequest instance with the given headers.
     */
    private function makeRequest(array $headers): ProcessingRequest
    {
        return new ProcessingRequest(['headers' => $headers]);
    }

    /**
     * When no X-Forwarded-For header is present on the incoming request, one
     * is added carrying the request's own remote address.
     */
    public function testAddsHeaderWhenAbsent(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';
        $request = $this->makeRequest(['Content-Type' => 'application/json']);
        $middleware = new SetClientIpMiddleware();

        $result = $middleware->processRequest($request);

        $this->assertSame([
            'Content-Type' => 'application/json',
            'X-Forwarded-For' => '203.0.113.7',
        ], $result->headers());
    }

    /**
     * A client-supplied X-Forwarded-For value must never survive: it is
     * fully replaced by the real remote address, not appended to or left in
     * place.
     */
    public function testReplacesSpoofedHeader(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';
        $request = $this->makeRequest([
            'Content-Type' => 'application/json',
            'X-Forwarded-For' => '10.0.0.1',
        ]);
        $middleware = new SetClientIpMiddleware();

        $result = $middleware->processRequest($request);

        $this->assertSame([
            'Content-Type' => 'application/json',
            'X-Forwarded-For' => '203.0.113.7',
        ], $result->headers());
    }

    /**
     * A differently-cased X-Forwarded-For header sent by the client is also
     * fully replaced, guarding against case-insensitive spoofing.
     */
    public function testReplacesSpoofedHeaderRegardlessOfCase(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';
        $request = $this->makeRequest([
            'x-forwarded-for' => '10.0.0.1',
        ]);
        $middleware = new SetClientIpMiddleware();

        $result = $middleware->processRequest($request);

        $this->assertSame([
            'X-Forwarded-For' => '203.0.113.7',
        ], $result->headers());
    }

    /**
     * Every other request header is left untouched.
     */
    public function testOnlyForwardedForHeaderIsChanged(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';
        $request = $this->makeRequest([
            'Host' => 'backend:8080',
            'Authorization' => 'Bearer token',
            'X-Forwarded-For' => '10.0.0.1',
        ]);
        $middleware = new SetClientIpMiddleware();

        $result = $middleware->processRequest($request);

        $this->assertSame([
            'Host' => 'backend:8080',
            'Authorization' => 'Bearer token',
            'X-Forwarded-For' => '203.0.113.7',
        ], $result->headers());
    }

    /**
     * build([]) returns a usable instance that sets X-Forwarded-For and,
     * having no secret, sends no X-Proxy-Secret.
     */
    public function testBuildReturnsUsableInstance(): void
    {
        $_SERVER['REMOTE_ADDR'] = '198.51.100.42';
        $middleware = SetClientIpMiddleware::build([]);
        $request = $this->makeRequest([]);

        $result = $middleware->processRequest($request);

        $this->assertSame(['X-Forwarded-For' => '198.51.100.42'], $result->headers());
    }

    /**
     * build() with a secret returns an instance that sends it.
     */
    public function testBuildWithSecretReturnsUsableInstance(): void
    {
        $_SERVER['REMOTE_ADDR'] = '198.51.100.42';
        $middleware = SetClientIpMiddleware::build(['secret' => 'x']);
        $request = $this->makeRequest([]);

        $result = $middleware->processRequest($request);

        $this->assertSame([
            'X-Forwarded-For' => '198.51.100.42',
            'X-Proxy-Secret' => 'x',
        ], $result->headers());
    }

    /**
     * When a secret is configured, it is sent in X-Proxy-Secret alongside
     * the client IP.
     */
    public function testSetsSecretWhenConfigured(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';
        $request = $this->makeRequest(['Content-Type' => 'application/json']);
        $middleware = new SetClientIpMiddleware('s3cr3t');

        $result = $middleware->processRequest($request);

        $this->assertSame([
            'Content-Type' => 'application/json',
            'X-Forwarded-For' => '203.0.113.7',
            'X-Proxy-Secret' => 's3cr3t',
        ], $result->headers());
    }

    /**
     * A client-supplied X-Proxy-Secret is stripped and replaced by the
     * configured secret.
     */
    public function testReplacesClientSecretWhenConfigured(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';
        $request = $this->makeRequest(['X-Proxy-Secret' => 'guess']);
        $middleware = new SetClientIpMiddleware('s3cr3t');

        $result = $middleware->processRequest($request);

        $this->assertSame([
            'X-Forwarded-For' => '203.0.113.7',
            'X-Proxy-Secret' => 's3cr3t',
        ], $result->headers());
    }

    /**
     * A differently-cased client-supplied X-Proxy-Secret is also stripped
     * and replaced by the configured secret.
     */
    public function testReplacesClientSecretRegardlessOfCase(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';
        $request = $this->makeRequest([
            'x-proxy-secret' => 'guess',
            'X-PROXY-SECRET' => 'other-guess',
        ]);
        $middleware = new SetClientIpMiddleware('s3cr3t');

        $result = $middleware->processRequest($request);

        $this->assertSame([
            'X-Forwarded-For' => '203.0.113.7',
            'X-Proxy-Secret' => 's3cr3t',
        ], $result->headers());
    }

    /**
     * With an empty secret, a client-supplied X-Proxy-Secret is stripped and
     * nothing is sent in its place.
     */
    public function testStripsClientSecretWhenSecretEmpty(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';
        $request = $this->makeRequest(['x-Proxy-Secret' => 'guess']);
        $middleware = new SetClientIpMiddleware('');

        $result = $middleware->processRequest($request);

        $this->assertSame(['X-Forwarded-For' => '203.0.113.7'], $result->headers());
    }

    /**
     * With no secret attribute at all, a client-supplied X-Proxy-Secret is
     * stripped and nothing is sent in its place.
     */
    public function testStripsClientSecretWhenSecretMissing(): void
    {
        $_SERVER['REMOTE_ADDR'] = '203.0.113.7';
        $request = $this->makeRequest(['X-Proxy-Secret' => 'guess']);
        $middleware = SetClientIpMiddleware::build([]);

        $result = $middleware->processRequest($request);

        $this->assertSame(['X-Forwarded-For' => '203.0.113.7'], $result->headers());
    }
}
