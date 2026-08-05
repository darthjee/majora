<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\RequestHandlers\CacheSizeHandler;
use Tent\RequestHandlers\DirectorySizeCalculator;
use Tent\RequestHandlers\ShellCommandFailedException;

/**
 * Unit tests for CacheSizeHandler.
 *
 * Covers only staff-gating and response shaping at the HTTP layer: the
 * actual directory-size computation is delegated to DirectorySizeCalculator,
 * which is faked here (see DirectorySizeCalculatorTest and the per-strategy
 * suites under tests/support/ for that computation's own coverage) so no
 * real filesystem fixture is needed in this file.
 */
class CacheSizeHandlerTest extends TestCase
{
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Builds a CacheSizeHandler wired to a fake DirectorySizeCalculator that
     * always returns $size for the configured cache path.
     */
    private function makeHandler(HttpClientInterface $httpClient, int $size = 0): CacheSizeHandler
    {
        $calculator = $this->createMock(DirectorySizeCalculator::class);
        $calculator->method('sizeOf')->willReturn($size);

        return new CacheSizeHandler('http://backend:8080', $httpClient, '/cache', 'php_walk', $calculator);
    }

    /**
     * Builds a ProcessingRequest for a GET /staff/cache/size.json.
     */
    private function makeRequest(array $headers = []): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => '/staff/cache/size.json',
            'requestMethod' => 'GET',
            'headers'       => $headers,
            'uploadedFiles' => [],
            'postFields'    => [],
        ]
        );
    }

    /**
     * Builds a fake /users/status.json response body.
     */
    private function statusBody(bool $loggedIn, bool $isStaff = false, bool $isSuperuser = false): string
    {
        return json_encode([
            'logged_in'    => $loggedIn,
            'is_staff'     => $isStaff,
            'is_superuser' => $isSuperuser,
        ]);
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /**
     * A staff user (is_staff: true) gets a 200 with the calculator's
     * returned size in the body.
     */
    public function testStaffUserGetsCacheSize(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient, 35);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->with('GET', 'http://backend:8080/users/status.json', $this->anything())
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(['size' => 35], json_decode($response->body(), true));
        $this->assertSame(['Content-Type: application/json'], $response->headers());
    }

    /**
     * A trailing slash on the configured 'host' never produces a double
     * slash at the host/path boundary of the backend URL.
     */
    public function testTrailingSlashOnHostDoesNotProduceDoubleSlash(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $calculator = $this->createMock(DirectorySizeCalculator::class);
        $calculator->method('sizeOf')->willReturn(0);
        $handler = new CacheSizeHandler('http://backend:8080/', $httpClient, '/cache', 'php_walk', $calculator);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->with('GET', 'http://backend:8080/users/status.json', $this->anything())
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
    }

    /**
     * A superuser (is_superuser: true, is_staff: false) also gets a 200:
     * either flag alone is sufficient.
     */
    public function testSuperuserAloneGetsCacheSize(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient, 12);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, false, true),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(['size' => 12], json_decode($response->body(), true));
    }

    /**
     * When the calculator reports a size of 0 (e.g. an empty/missing cache
     * directory), the response is still a 200 with size 0.
     */
    public function testEmptyCacheDirectoryReturnsZeroSize(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient, 0);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(['size' => 0], json_decode($response->body(), true));
    }

    /**
     * When the configured DirectorySizeCalculator strategy fails at runtime
     * (e.g. the `du` binary missing or exiting non-zero, surfaced as a
     * ShellCommandFailedException), the handler turns that into a
     * controlled 500 response rather than letting the exception propagate,
     * the same way BackendErrorException failures are handled.
     */
    public function testCalculatorFailureReturnsControlledServerError(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $calculator = $this->createMock(DirectorySizeCalculator::class);
        $calculator->method('sizeOf')->willThrowException(new ShellCommandFailedException('du -sb /cache', 1));
        $handler = new CacheSizeHandler('http://backend:8080', $httpClient, '/cache', 'du', $calculator);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(500, $response->httpCode());
        $this->assertSame('Internal Server Error', $response->body());
    }

    /**
     * Not logged in: 403, regardless of the (irrelevant) staff/superuser
     * flags, and the calculator is never consulted.
     */
    public function testNotLoggedInReturnsForbidden(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $calculator = $this->createMock(DirectorySizeCalculator::class);
        $calculator->expects($this->never())->method('sizeOf');
        $handler = new CacheSizeHandler('http://backend:8080', $httpClient, '/cache', 'php_walk', $calculator);

        $request = $this->makeRequest();

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(false, true, true),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(403, $response->httpCode());
    }

    /**
     * Logged in, but neither staff nor superuser: 403.
     */
    public function testLoggedInWithoutStaffOrSuperuserReturnsForbidden(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest();

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, false, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(403, $response->httpCode());
    }

    /**
     * A non-200 response from /users/status.json (e.g. a backend 500) is
     * propagated as-is, not collapsed to 403.
     */
    public function testUpstreamFailureIsPropagatedAsIs(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest();

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 500,
                'body'     => 'Internal Server Error',
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(500, $response->httpCode());
        $this->assertSame('Internal Server Error', $response->body());
    }

    /**
     * Only allow-listed headers are forwarded to the backend call, with Host
     * overridden to the backend's own host regardless of what the client
     * sent. Non-allow-listed headers (e.g. X-Trace-Id) are dropped.
     */
    public function testOnlyAllowListedHeadersAreForwardedToBackend(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest([
            'Authorization'   => 'Bearer tok',
            'X-Trace-Id'      => 'trace-abc',
            'Cookie'          => 'session=abc',
            'X-Skip-Cache'    => '1',
            'Referer'         => 'http://client/photo',
            'Accept-Language' => 'en-US',
            'Accept'          => 'application/json',
            'Host'            => 'majora.example.com',
        ]);

        $expectedHeaders = [
            'Authorization'    => 'Bearer tok',
            'Cookie'           => 'session=abc',
            'X-Skip-Cache'     => '1',
            'Referer'          => 'http://client/photo',
            'Accept-Language'  => 'en-US',
            'Accept'           => 'application/json',
            'Host'             => 'backend',
            'X-Forwarded-Host' => 'majora.example.com',
            'Accept-Encoding'  => 'gzip',
        ];

        $httpClient->expects($this->once())
            ->method('request')
            ->with('GET', 'http://backend:8080/users/status.json', $expectedHeaders)
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
    }

    /**
     * build() sets cachePath from the 'cache_path' configuration parameter.
     */
    public function testBuildSetsCachePathFromParams(): void
    {
        $handler = CacheSizeHandler::build([
            'host'       => 'http://backend:8080',
            'cache_path' => '/some/cache/path',
        ]
        );

        $reflection = new \ReflectionClass($handler);
        $prop       = $reflection->getProperty('cachePath');
        $prop->setAccessible(true);

        $this->assertSame('/some/cache/path', $prop->getValue($handler));
    }

    /**
     * build() reads 'cache_size_tool' from params and passes it through to
     * the DirectorySizeCalculator it builds.
     */
    public function testBuildPassesCacheSizeToolThroughToCalculator(): void
    {
        $handler = CacheSizeHandler::build([
            'host'            => 'http://backend:8080',
            'cache_path'      => '/some/cache/path',
            'cache_size_tool' => 'du',
        ]
        );

        $reflection    = new \ReflectionClass($handler);
        $calculatorProp = $reflection->getProperty('calculator');
        $calculatorProp->setAccessible(true);
        $calculator = $calculatorProp->getValue($handler);

        $toolProp = new \ReflectionProperty(DirectorySizeCalculator::class, 'tool');
        $toolProp->setAccessible(true);

        $this->assertSame('du', $toolProp->getValue($calculator));
    }

    /**
     * When 'cache_size_tool' is omitted from params, build() defaults to
     * 'php_walk' rather than silently trying to shell out.
     */
    public function testBuildDefaultsCacheSizeToolToPhpWalk(): void
    {
        $handler = CacheSizeHandler::build([
            'host'       => 'http://backend:8080',
            'cache_path' => '/some/cache/path',
        ]
        );

        $reflection    = new \ReflectionClass($handler);
        $calculatorProp = $reflection->getProperty('calculator');
        $calculatorProp->setAccessible(true);
        $calculator = $calculatorProp->getValue($handler);

        $toolProp = new \ReflectionProperty(DirectorySizeCalculator::class, 'tool');
        $toolProp->setAccessible(true);

        $this->assertSame('php_walk', $toolProp->getValue($calculator));
    }
}
