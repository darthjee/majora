<?php

namespace Tent\Middlewares\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Middlewares\CacheControlMiddleware;
use Tent\Models\Response;

/**
 * Unit tests for CacheControlMiddleware.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class CacheControlMiddlewareTest extends TestCase
{
    /**
     * Builds a real Response instance with the given header lines.
     */
    private function makeResponse(array $headers): Response
    {
        return new Response(['headers' => $headers]);
    }

    /**
     * When no Cache-Control header is present, one is appended with the
     * configured max-age.
     */
    public function testAddsCacheControlHeaderWhenAbsent(): void
    {
        $response = $this->makeResponse(['Content-Type: application/json']);
        $middleware = new CacheControlMiddleware(604800);

        $result = $middleware->processResponse($response);

        $this->assertSame([
            'Content-Type: application/json',
            'Cache-Control: max-age=604800',
        ], $result->headers());
    }

    /**
     * An existing Cache-Control header is replaced by the configured value,
     * rather than resulting in a duplicate header line.
     */
    public function testReplacesExistingCacheControlHeader(): void
    {
        $response = $this->makeResponse([
            'Content-Type: application/json',
            'Cache-Control: no-store, no-cache, must-revalidate',
        ]);
        $middleware = new CacheControlMiddleware(86400);

        $result = $middleware->processResponse($response);

        $this->assertSame([
            'Content-Type: application/json',
            'Cache-Control: max-age=86400',
        ], $result->headers());
    }

    /**
     * Every occurrence of the header is removed (case-insensitive) before the
     * single, configured value is appended, guarding against duplicates.
     */
    public function testReplacesAllOccurrencesCaseInsensitively(): void
    {
        $response = $this->makeResponse([
            'cache-control: public, max-age=3600',
            'X-Request-Id: abc-123',
            'Cache-Control: no-store',
        ]);
        $middleware = new CacheControlMiddleware(604800);

        $result = $middleware->processResponse($response);

        $this->assertSame([
            'X-Request-Id: abc-123',
            'Cache-Control: max-age=604800',
        ], $result->headers());
    }

    /**
     * build() reads 'maxAgeSeconds' from the given attributes.
     */
    public function testBuildUsesMaxAgeSecondsAttribute(): void
    {
        $middleware = CacheControlMiddleware::build(['maxAgeSeconds' => 604800]);
        $response = $this->makeResponse([]);

        $result = $middleware->processResponse($response);

        $this->assertSame(['Cache-Control: max-age=604800'], $result->headers());
    }

    /**
     * build() also accepts the snake_case 'max_age_seconds' attribute.
     */
    public function testBuildUsesSnakeCaseMaxAgeSecondsAttribute(): void
    {
        $middleware = CacheControlMiddleware::build(['max_age_seconds' => 86400]);
        $response = $this->makeResponse([]);

        $result = $middleware->processResponse($response);

        $this->assertSame(['Cache-Control: max-age=86400'], $result->headers());
    }

    /**
     * build() defaults to a max-age of 0 when no attribute is provided.
     */
    public function testBuildDefaultsToZeroMaxAge(): void
    {
        $middleware = CacheControlMiddleware::build([]);
        $response = $this->makeResponse([]);

        $result = $middleware->processResponse($response);

        $this->assertSame(['Cache-Control: max-age=0'], $result->headers());
    }
}
