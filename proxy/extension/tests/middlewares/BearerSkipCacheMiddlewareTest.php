<?php

namespace Tent\Middlewares\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Middlewares\BearerSkipCacheMiddleware;
use Tent\Models\ProcessingRequest;

/**
 * Unit tests for BearerSkipCacheMiddleware.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class BearerSkipCacheMiddlewareTest extends TestCase
{
    /**
     * Builds a real ProcessingRequest instance with the given headers.
     */
    private function makeRequest(array $headers): ProcessingRequest
    {
        return new ProcessingRequest(['headers' => $headers]);
    }

    public static function bearerProvider(): array
    {
        return [
            'capitalised' => [['Authorization' => 'Bearer x']],
            'lowercase' => [['Authorization' => 'bearer x']],
            'uppercase' => [['Authorization' => 'BEARER x']],
            'tab separator' => [['Authorization' => "Bearer\tx"]],
            'leading spaces' => [['Authorization' => '   Bearer x']],
            'lone bearer' => [['Authorization' => 'Bearer']],
            'lowercase header name' => [['authorization' => 'Bearer x']],
            'comma in one header' => [['Authorization' => 'Token x, Bearer y']],
            'two separate headers' => [[
                'Authorization' => 'Token x',
                'authorization' => 'Bearer y',
            ]],
            'array value' => [['Authorization' => ['Token x', 'Bearer y']]],
        ];
    }

    public static function nonBearerProvider(): array
    {
        return [
            'token' => [['Authorization' => 'Token x']],
            'missing' => [['Content-Type' => 'application/json']],
            'basic' => [['Authorization' => 'Basic x']],
            'bearerish' => [['Authorization' => 'Bearerish x']],
        ];
    }

    /**
     * @dataProvider bearerProvider
     */
    public function testSetsMarkerForBearerRequests(array $headers): void
    {
        $middleware = new BearerSkipCacheMiddleware();

        $result = $middleware->processRequest($this->makeRequest($headers));

        $this->assertSame(
            array_merge($headers, ['X-Skip-Cache' => 'true']),
            $result->headers()
        );
    }

    /**
     * @dataProvider nonBearerProvider
     */
    public function testDoesNotSetMarkerForNonBearerRequests(array $headers): void
    {
        $middleware = new BearerSkipCacheMiddleware();

        $result = $middleware->processRequest($this->makeRequest($headers));

        $this->assertSame($headers, $result->headers());
    }

    public function testBuildDefaultsToXSkipCache(): void
    {
        $middleware = BearerSkipCacheMiddleware::build([]);

        $result = $middleware->processRequest(
            $this->makeRequest(['Authorization' => 'Bearer x'])
        );

        $this->assertSame('true', $result->headers()['X-Skip-Cache']);
    }

    public function testBuildRespectsCustomHeader(): void
    {
        $middleware = BearerSkipCacheMiddleware::build(['header' => 'X-Bearer-Request']);

        $result = $middleware->processRequest(
            $this->makeRequest(['Authorization' => 'Bearer x'])
        );

        $this->assertSame([
            'Authorization' => 'Bearer x',
            'X-Bearer-Request' => 'true',
        ], $result->headers());
    }

    public function testSkipWhenMissingSetsMarkerWhenTokenMissing(): void
    {
        $middleware = BearerSkipCacheMiddleware::build([
            'header' => 'X-Bearer-Request',
            'skipWhenMissing' => 'X-Cache-Token',
        ]);

        $result = $middleware->processRequest(
            $this->makeRequest(['Authorization' => 'Token x'])
        );

        $this->assertSame('true', $result->headers()['X-Bearer-Request'] ?? null);
    }

    public function testSkipWhenMissingSetsMarkerWhenTokenBlank(): void
    {
        $middleware = BearerSkipCacheMiddleware::build([
            'header' => 'X-Bearer-Request',
            'skipWhenMissing' => 'X-Cache-Token',
        ]);

        $result = $middleware->processRequest(
            $this->makeRequest(['X-Cache-Token' => '   '])
        );

        $this->assertSame('true', $result->headers()['X-Bearer-Request'] ?? null);
    }

    public function testSkipWhenMissingSetsMarkerWhenTokenEmpty(): void
    {
        $middleware = BearerSkipCacheMiddleware::build([
            'header' => 'X-Bearer-Request',
            'skipWhenMissing' => 'X-Cache-Token',
        ]);

        $result = $middleware->processRequest(
            $this->makeRequest(['X-Cache-Token' => ''])
        );

        $this->assertSame('true', $result->headers()['X-Bearer-Request'] ?? null);
    }

    public function testSkipWhenMissingDoesNotSetMarkerWhenTokenPresent(): void
    {
        $headers = [
            'Authorization' => 'Token x',
            'x-cache-token' => 'abc',
        ];
        $middleware = BearerSkipCacheMiddleware::build([
            'header' => 'X-Bearer-Request',
            'skipWhenMissing' => 'X-Cache-Token',
        ]);

        $result = $middleware->processRequest($this->makeRequest($headers));

        $this->assertSame($headers, $result->headers());
    }

    public function testSkipWhenMissingStillSetsMarkerForBearerWithToken(): void
    {
        $middleware = BearerSkipCacheMiddleware::build([
            'header' => 'X-Bearer-Request',
            'skipWhenMissing' => 'X-Cache-Token',
        ]);

        $result = $middleware->processRequest($this->makeRequest([
            'Authorization' => 'Bearer x',
            'X-Cache-Token' => 'abc',
        ]));

        $this->assertSame('true', $result->headers()['X-Bearer-Request'] ?? null);
    }

    public function testInboundMarkerIsLeftAsIs(): void
    {
        $headers = [
            'Authorization' => 'Token x',
            'X-Skip-Cache' => 'true',
        ];
        $middleware = new BearerSkipCacheMiddleware();

        $result = $middleware->processRequest($this->makeRequest($headers));

        $this->assertSame($headers, $result->headers());
    }

    public function testInboundDifferentlyCasedMarkerIsNotStripped(): void
    {
        $middleware = new BearerSkipCacheMiddleware();

        $result = $middleware->processRequest($this->makeRequest([
            'Authorization' => 'Bearer x',
            'x-skip-cache' => '1',
        ]));

        $this->assertSame([
            'Authorization' => 'Bearer x',
            'x-skip-cache' => '1',
            'X-Skip-Cache' => 'true',
        ], $result->headers());
    }
}
