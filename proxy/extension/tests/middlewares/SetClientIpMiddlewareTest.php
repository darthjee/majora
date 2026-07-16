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
     * build() ignores its attributes argument and always returns a usable
     * instance, since this middleware is not configurable.
     */
    public function testBuildReturnsUsableInstance(): void
    {
        $_SERVER['REMOTE_ADDR'] = '198.51.100.42';
        $middleware = SetClientIpMiddleware::build([]);
        $request = $this->makeRequest([]);

        $result = $middleware->processRequest($request);

        $this->assertSame(['X-Forwarded-For' => '198.51.100.42'], $result->headers());
    }
}
