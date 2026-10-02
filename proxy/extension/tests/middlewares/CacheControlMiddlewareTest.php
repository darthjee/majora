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

    /**
     * build() with 'directive' => 'no-cache' emits that directive verbatim.
     */
    public function testBuildWithNoCacheDirectiveEmitsNoCache(): void
    {
        $middleware = CacheControlMiddleware::build(['directive' => 'no-cache']);
        $response = $this->makeResponse(['Content-Type: image/png']);

        $result = $middleware->processResponse($response);

        $this->assertSame([
            'Content-Type: image/png',
            'Cache-Control: no-cache',
        ], $result->headers());
    }

    /**
     * 'directive' takes precedence over 'maxAgeSeconds' when both are set.
     */
    public function testDirectiveTakesPrecedenceOverMaxAgeSeconds(): void
    {
        $middleware = CacheControlMiddleware::build([
            'maxAgeSeconds' => 604800,
            'directive' => 'no-cache',
        ]);
        $response = $this->makeResponse([]);

        $result = $middleware->processResponse($response);

        $this->assertSame(['Cache-Control: no-cache'], $result->headers());
    }

    /**
     * The directive replaces any existing Cache-Control header.
     */
    public function testDirectiveReplacesExistingCacheControlHeader(): void
    {
        $response = $this->makeResponse([
            'Cache-Control: max-age=604800',
            'ETag: "abc"',
        ]);
        $middleware = new CacheControlMiddleware(0, 'no-cache');

        $result = $middleware->processResponse($response);

        $this->assertSame([
            'ETag: "abc"',
            'Cache-Control: no-cache',
        ], $result->headers());
    }

    /**
     * An empty directive is ignored, falling back to max-age.
     */
    public function testEmptyDirectiveFallsBackToMaxAge(): void
    {
        $middleware = CacheControlMiddleware::build([
            'maxAgeSeconds' => 3600,
            'directive' => '',
        ]);
        $response = $this->makeResponse([]);

        $result = $middleware->processResponse($response);

        $this->assertSame(['Cache-Control: max-age=3600'], $result->headers());
    }

    /**
     * The header is also set on a 304 Not Modified response, and the status
     * code is left untouched.
     */
    public function testSetsHeaderOnNotModifiedResponse(): void
    {
        $response = new Response([
            'httpCode' => 304,
            'headers' => ['ETag: "abc"'],
        ]);
        $middleware = CacheControlMiddleware::build(['directive' => 'no-cache']);

        $result = $middleware->processResponse($response);

        $this->assertSame(304, $result->httpCode());
        $this->assertSame([
            'ETag: "abc"',
            'Cache-Control: no-cache',
        ], $result->headers());
    }
}
