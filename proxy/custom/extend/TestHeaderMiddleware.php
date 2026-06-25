<?php

namespace Tent\Middlewares;

use Tent\Request;
use Tent\Response;

/**
 * Sample custom middleware that adds x-test-header to the response.
 *
 * This file demonstrates the pattern for writing custom Tent middleware.
 * Custom middleware classes belong in proxy/custom/extend/ and use the Tent\ namespace.
 * Tests belong in proxy/custom/tests/.
 */
class TestHeaderMiddleware
{
    /**
     * Add the x-test-header response header.
     *
     * @param Request  $request  The incoming HTTP request.
     * @param Response $response The HTTP response to be sent to the client.
     */
    public function handle(Request $request, Response $response): void
    {
        $response->addHeader('x-test-header', 'added');
    }
}
