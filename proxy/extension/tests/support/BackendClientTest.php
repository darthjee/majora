<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\RequestHandlers\BackendClient;

/**
 * Unit tests for BackendClient.
 */
class BackendClientTest extends TestCase
{
    // -------------------------------------------------------------------------
    // url()
    // -------------------------------------------------------------------------

    /**
     * A host without a trailing slash and a path with a leading slash are
     * joined with exactly one slash.
     */
    public function testUrlJoinsHostWithoutTrailingSlashAndPathWithLeadingSlash(): void
    {
        $client = new BackendClient('http://backend:8080', $this->createMock(HttpClientInterface::class));

        $this->assertSame('http://backend:8080/users/status.json', $client->url('/users/status.json'));
    }

    /**
     * A host with a trailing slash never produces a double slash once
     * joined with a path that also has a leading slash.
     */
    public function testUrlJoinsHostWithTrailingSlashAndPathWithLeadingSlash(): void
    {
        $client = new BackendClient('http://backend:8080/', $this->createMock(HttpClientInterface::class));

        $this->assertSame('http://backend:8080/users/status.json', $client->url('/users/status.json'));
    }

    /**
     * A host without a trailing slash and a path without a leading slash
     * are still joined with exactly one slash.
     */
    public function testUrlJoinsHostWithoutTrailingSlashAndPathWithoutLeadingSlash(): void
    {
        $client = new BackendClient('http://backend:8080', $this->createMock(HttpClientInterface::class));

        $this->assertSame('http://backend:8080/users/status.json', $client->url('users/status.json'));
    }

    /**
     * A host with a trailing slash and a path without a leading slash are
     * still joined with exactly one slash.
     */
    public function testUrlJoinsHostWithTrailingSlashAndPathWithoutLeadingSlash(): void
    {
        $client = new BackendClient('http://backend:8080/', $this->createMock(HttpClientInterface::class));

        $this->assertSame('http://backend:8080/users/status.json', $client->url('users/status.json'));
    }

    // -------------------------------------------------------------------------
    // request() - header filtering
    // -------------------------------------------------------------------------

    /**
     * Only headers on ForwardedHeaderFilter's base allow-list are forwarded
     * to the backend call; a non-allow-listed header (e.g. X-Trace-Id) is
     * dropped.
     */
    public function testRequestFiltersHeadersDownToBaseAllowList(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'Authorization'   => 'Bearer tok',
                    'Host'            => 'backend',
                    'Accept-Encoding' => 'gzip',
                ],
                null
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $client->request('GET', '/users/status.json', [
            'Authorization' => 'Bearer tok',
            'X-Trace-Id'    => 'trace-abc',
        ]);
    }

    /**
     * A header supplied via $extraAllowedHeaders (e.g. X-Upload-Token) is
     * forwarded, on top of the base allow-list.
     */
    public function testRequestFiltersHeadersDownToBaseAllowListPlusExtraAllowedHeaders(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/image/1.json',
                [
                    'X-Upload-Token'  => 'up-tok',
                    'Host'            => 'backend',
                    'Accept-Encoding' => 'gzip',
                ],
                null
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $client->request(
            'PATCH',
            '/uploads/image/1.json',
            [
                'X-Upload-Token' => 'up-tok',
                'X-Trace-Id'     => 'trace-abc',
            ],
            null,
            ['X-Upload-Token']
        );
    }

    // -------------------------------------------------------------------------
    // request() - Host / X-Forwarded-Host remapping
    // -------------------------------------------------------------------------

    /**
     * Host is overridden to the backend's own bare host, and
     * X-Forwarded-Host is set from the original incoming Host header.
     */
    public function testRequestOverridesHostAndSetsForwardedHost(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'Host'             => 'backend',
                    'X-Forwarded-Host' => 'majora.example.com',
                    'Accept-Encoding'  => 'gzip',
                ],
                null
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $client->request('GET', '/users/status.json', ['Host' => 'majora.example.com']);
    }

    /**
     * The original Host header is looked up case-insensitively.
     */
    public function testRequestLooksUpOriginalHostCaseInsensitively(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'X-Forwarded-Host' => 'majora.example.com',
                    'Accept-Encoding'  => 'gzip',
                    'Host'             => 'backend',
                ],
                null
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $client->request('GET', '/users/status.json', ['host' => 'majora.example.com']);
    }

    /**
     * When the incoming request has no Host header at all, Host is still
     * overridden to the backend's own host, but no X-Forwarded-Host is set.
     */
    public function testRequestSetsNoForwardedHostWhenIncomingHostIsAbsent(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'Authorization'   => 'Bearer tok',
                    'Host'            => 'backend',
                    'Accept-Encoding' => 'gzip',
                ],
                null
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $client->request('GET', '/users/status.json', ['Authorization' => 'Bearer tok']);
    }

    /**
     * A client-supplied X-Forwarded-Host header (regardless of casing) must
     * never survive into the outgoing request — only the server-computed
     * value (derived from the incoming Host) is forwarded.
     */
    public function testRequestDiscardsClientSuppliedForwardedHost(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'Host'             => 'backend',
                    'X-Forwarded-Host' => 'majora.example.com',
                    'Accept-Encoding'  => 'gzip',
                ],
                null
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $client->request('GET', '/users/status.json', [
            'Host'             => 'majora.example.com',
            'x-forwarded-host' => 'evil.com',
        ]);
    }

    // -------------------------------------------------------------------------
    // request() - overrideHeaders
    // -------------------------------------------------------------------------

    /**
     * $overrideHeaders are applied after filtering/host-remap, overriding
     * any value that survived filtering (e.g. Content-Type forced to
     * application/json even though the incoming request was multipart).
     */
    public function testRequestAppliesOverrideHeadersAfterFiltering(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/image/1.json',
                [
                    'Content-Type'    => 'application/json',
                    'Host'            => 'backend',
                    'Accept-Encoding' => 'gzip',
                ],
                '{"status":"uploaded"}'
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $client->request(
            'PATCH',
            '/uploads/image/1.json',
            ['Content-Type' => 'multipart/form-data'],
            '{"status":"uploaded"}',
            [],
            ['Content-Type' => 'application/json']
        );
    }

    // -------------------------------------------------------------------------
    // request() - Accept-Encoding: gzip
    // -------------------------------------------------------------------------

    /**
     * Accept-Encoding: gzip is added to every outgoing request.
     */
    public function testRequestAddsAcceptEncodingGzip(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                $this->callback(function (array $headers): bool {
                    return ($headers['Accept-Encoding'] ?? null) === 'gzip';
                }),
                null
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $client->request('GET', '/users/status.json', []);
    }

    // -------------------------------------------------------------------------
    // request() - gzip response decoding
    // -------------------------------------------------------------------------

    /**
     * A response whose headers report Content-Encoding: gzip has its body
     * gzdecode()-d before being returned.
     */
    public function testRequestDecodesGzipEncodedResponseBody(): void
    {
        $decodedBody = '{"logged_in":true}';
        $encodedBody = gzencode($decodedBody);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $encodedBody,
                'headers'  => ['Content-Type: application/json', 'Content-Encoding: gzip'],
            ]);

        $result = $client->request('GET', '/users/status.json', []);

        $this->assertSame($decodedBody, $result['body']);
    }

    /**
     * A response without a Content-Encoding: gzip header is passed through
     * unchanged.
     */
    public function testRequestPassesThroughNonGzipResponseBodyUnchanged(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => '{"logged_in":true}',
                'headers'  => ['Content-Type: application/json'],
            ]);

        $result = $client->request('GET', '/users/status.json', []);

        $this->assertSame('{"logged_in":true}', $result['body']);
    }

    /**
     * The gzip decoding check is case-insensitive with respect to both the
     * header name and its value, matching how CurlUtils::mapHeaderLines()
     * normalizes header names to lowercase.
     */
    public function testRequestDecodesGzipEncodedResponseBodyWithCaseInsensitiveHeader(): void
    {
        $decodedBody = '{"logged_in":true}';
        $encodedBody = gzencode($decodedBody);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $encodedBody,
                'headers'  => ['content-encoding: gzip'],
            ]);

        $result = $client->request('GET', '/users/status.json', []);

        $this->assertSame($decodedBody, $result['body']);
    }

    // -------------------------------------------------------------------------
    // Constructor defaults
    // -------------------------------------------------------------------------

    /**
     * Omitting $httpClient still allows the client to be constructed (it
     * defaults internally to CurlHttpClient).
     */
    public function testConstructorAcceptsNoExplicitHttpClient(): void
    {
        $client = new BackendClient('http://backend:8080');

        $this->assertSame('http://backend:8080/users/status.json', $client->url('/users/status.json'));
    }
}
