<?php

namespace Tent\Middlewares\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Middlewares\TestHeaderMiddleware;
use Tent\Request;
use Tent\Response;

/**
 * Unit tests for TestHeaderMiddleware.
 *
 * Run via docker-compose:
 *   docker-compose run proxy_tests
 */
class TestHeaderMiddlewareTest extends TestCase
{
    public function testAddsTestHeader(): void
    {
        $request    = $this->createMock(Request::class);
        $response   = $this->createMock(Response::class);
        $middleware = new TestHeaderMiddleware();

        $response->expects($this->once())
            ->method('addHeader')
            ->with('x-test-header', 'added');

        $middleware->handle($request, $response);
    }
}
