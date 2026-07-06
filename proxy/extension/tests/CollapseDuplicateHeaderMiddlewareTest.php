<?php

namespace Tent\Middlewares\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Middlewares\CollapseDuplicateHeaderMiddleware;
use Tent\Models\Response;

/**
 * Unit tests for CollapseDuplicateHeaderMiddleware.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class CollapseDuplicateHeaderMiddlewareTest extends TestCase
{
    /**
     * Builds a real Response instance with the given header lines.
     */
    private function makeResponse(array $headers): Response
    {
        return new Response(['headers' => $headers]);
    }

    /**
     * When the configured header appears twice, only the first occurrence is
     * kept and the duplicate is dropped.
     */
    public function testCollapsesDuplicateHeaderToFirstOccurrence(): void
    {
        $response = $this->makeResponse([
            'Cache-Control: public, max-age=3600',
            'Cache-Control: max-age=172800',
        ]);
        $middleware = new CollapseDuplicateHeaderMiddleware('Cache-Control');

        $result = $middleware->processResponse($response);

        $this->assertSame(['Cache-Control: public, max-age=3600'], $result->headers());
    }

    /**
     * A single occurrence of the configured header is left unchanged.
     */
    public function testSingleOccurrenceIsUnchanged(): void
    {
        $response = $this->makeResponse([
            'Cache-Control: public, max-age=3600',
        ]);
        $middleware = new CollapseDuplicateHeaderMiddleware('Cache-Control');

        $result = $middleware->processResponse($response);

        $this->assertSame(['Cache-Control: public, max-age=3600'], $result->headers());
    }

    /**
     * A response without the configured header at all is left unchanged.
     */
    public function testNoOccurrenceIsUnchanged(): void
    {
        $headers  = ['Content-Type: application/json'];
        $response = $this->makeResponse($headers);
        $middleware = new CollapseDuplicateHeaderMiddleware('Cache-Control');

        $result = $middleware->processResponse($response);

        $this->assertSame($headers, $result->headers());
    }

    /**
     * Other header lines are preserved untouched and in their original order,
     * with only the duplicate Cache-Control line removed. The header name
     * match is also case-insensitive.
     */
    public function testOtherHeadersArePreservedInOrder(): void
    {
        $response = $this->makeResponse([
            'Content-Type: application/json',
            'cache-control: public, max-age=3600',
            'X-Skip-Cache: 1',
            'Cache-Control: max-age=172800',
            'X-Request-Id: abc-123',
        ]);
        $middleware = new CollapseDuplicateHeaderMiddleware('Cache-Control');

        $result = $middleware->processResponse($response);

        $this->assertSame([
            'Content-Type: application/json',
            'cache-control: public, max-age=3600',
            'X-Skip-Cache: 1',
            'X-Request-Id: abc-123',
        ], $result->headers());
    }

    /**
     * build() defaults to 'Cache-Control' when no 'header' key is provided.
     */
    public function testBuildDefaultsToCacheControlHeader(): void
    {
        $middleware = CollapseDuplicateHeaderMiddleware::build([]);
        $response = $this->makeResponse([
            'Cache-Control: public, max-age=3600',
            'Cache-Control: max-age=172800',
        ]);

        $result = $middleware->processResponse($response);

        $this->assertSame(['Cache-Control: public, max-age=3600'], $result->headers());
    }

    /**
     * build() reads the header name to dedupe from the 'header' attribute.
     */
    public function testBuildUsesConfiguredHeader(): void
    {
        $middleware = CollapseDuplicateHeaderMiddleware::build(['header' => 'X-Custom']);
        $response = $this->makeResponse([
            'X-Custom: first',
            'X-Custom: second',
            'Cache-Control: public, max-age=3600',
            'Cache-Control: max-age=172800',
        ]);

        $result = $middleware->processResponse($response);

        $this->assertSame([
            'X-Custom: first',
            'Cache-Control: public, max-age=3600',
            'Cache-Control: max-age=172800',
        ], $result->headers());
    }
}
