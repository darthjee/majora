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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'Authorization'   => 'Bearer tok',
                    'Host'            => 'backend',
                    'X-Forwarded-For' => '203.0.113.7',
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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/image/1.json',
                [
                    'X-Upload-Token'  => 'up-tok',
                    'Host'            => 'backend',
                    'X-Forwarded-For' => '203.0.113.7',
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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'Host'             => 'backend',
                    'X-Forwarded-Host' => 'majora.example.com',
                    'X-Forwarded-For'  => '203.0.113.7',
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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'X-Forwarded-Host' => 'majora.example.com',
                    'X-Forwarded-For'  => '203.0.113.7',
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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'Authorization'   => 'Bearer tok',
                    'Host'            => 'backend',
                    'X-Forwarded-For' => '203.0.113.7',
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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/users/status.json',
                [
                    'Host'             => 'backend',
                    'X-Forwarded-Host' => 'majora.example.com',
                    'X-Forwarded-For'  => '203.0.113.7',
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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/image/1.json',
                [
                    'Content-Type'    => 'application/json',
                    'Host'            => 'backend',
                    'X-Forwarded-For' => '203.0.113.7',
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
    // request() - signed client IP (X-Forwarded-For / X-Proxy-Secret)
    // -------------------------------------------------------------------------

    /**
     * Issues a GET through a BackendClient built with $secret and
     * $remoteAddress, and returns the headers it sent to the backend.
     */
    private function sentHeaders(
        array $incomingHeaders,
        string $secret = '',
        ?string $remoteAddress = '203.0.113.7',
        array $extraAllowedHeaders = [],
        array $overrideHeaders = []
    ): array {
        $sent       = null;
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient, $secret, $remoteAddress);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturnCallback(function ($method, $url, $headers) use (&$sent) {
                $sent = $headers;

                return ['httpCode' => 200, 'body' => '{}', 'headers' => []];
            });

        $client->request('GET', '/users/status.json', $incomingHeaders, null, $extraAllowedHeaders, $overrideHeaders);

        return $sent;
    }

    /**
     * X-Forwarded-For carries the client's remote address; without a secret
     * no X-Proxy-Secret is sent.
     */
    public function testRequestSetsForwardedForFromRemoteAddress(): void
    {
        $headers = $this->sentHeaders(['Cookie' => 'session=abc']);

        $this->assertSame('203.0.113.7', $headers['X-Forwarded-For']);
        $this->assertArrayNotHasKey('X-Proxy-Secret', $headers);
    }

    /**
     * With a secret configured, it is sent in X-Proxy-Secret alongside the
     * client IP.
     */
    public function testRequestSetsProxySecretWhenConfigured(): void
    {
        $headers = $this->sentHeaders(['Cookie' => 'session=abc'], 'dummy-secret');

        $this->assertSame('203.0.113.7', $headers['X-Forwarded-For']);
        $this->assertSame('dummy-secret', $headers['X-Proxy-Secret']);
    }

    /**
     * Client-supplied values of both headers, whatever their casing, never
     * reach the backend: only Tent's own values are sent.
     */
    public function testRequestDropsClientSuppliedClientIpHeaders(): void
    {
        $headers = $this->sentHeaders(
            [
                'X-Forwarded-For' => '192.0.2.1',
                'x-forwarded-for' => '192.0.2.2',
                'X-Proxy-Secret'  => 'guess',
                'x-PROXY-secret'  => 'other-guess',
            ],
            'dummy-secret'
        );

        $this->assertSame(
            [
                'Host'            => 'backend',
                'X-Forwarded-For' => '203.0.113.7',
                'X-Proxy-Secret'  => 'dummy-secret',
                'Accept-Encoding' => 'gzip',
            ],
            $headers
        );
    }

    /**
     * Without a secret, a client-supplied X-Proxy-Secret is dropped and
     * nothing is sent in its place.
     */
    public function testRequestDropsClientSuppliedSecretWhenNoSecretConfigured(): void
    {
        $headers = $this->sentHeaders(['x-proxy-secret' => 'guess', 'X-Forwarded-For' => '192.0.2.1']);

        $this->assertSame(
            [
                'Host'            => 'backend',
                'X-Forwarded-For' => '203.0.113.7',
                'Accept-Encoding' => 'gzip',
            ],
            $headers
        );
    }

    /**
     * Even when a caller lists the headers in $extraAllowedHeaders, the
     * client's values are dropped and replaced by Tent's own.
     */
    public function testRequestDropsClientSuppliedClientIpHeadersAllowedAsExtra(): void
    {
        $headers = $this->sentHeaders(
            [
                'x-forwarded-for' => '192.0.2.1',
                'X-PROXY-SECRET'  => 'guess',
            ],
            'dummy-secret',
            '203.0.113.7',
            ['X-Forwarded-For', 'X-Proxy-Secret']
        );

        $this->assertSame(
            [
                'Host'            => 'backend',
                'X-Forwarded-For' => '203.0.113.7',
                'X-Proxy-Secret'  => 'dummy-secret',
                'Accept-Encoding' => 'gzip',
            ],
            $headers
        );
    }

    /**
     * Same as above without a secret: the extra-allowed client secret is
     * still dropped.
     */
    public function testRequestDropsExtraAllowedClientSecretWhenNoSecretConfigured(): void
    {
        $headers = $this->sentHeaders(
            ['X-Proxy-Secret' => 'guess'],
            '',
            '203.0.113.7',
            ['X-Proxy-Secret']
        );

        $this->assertArrayNotHasKey('X-Proxy-Secret', $headers);
    }

    /**
     * $overrideHeaders are still applied last, after the client-IP headers.
     */
    public function testRequestAppliesOverrideHeadersAfterClientIpHeaders(): void
    {
        $headers = $this->sentHeaders(
            [],
            'dummy-secret',
            '203.0.113.7',
            [],
            ['X-Forwarded-For' => '192.0.2.50', 'Content-Type' => 'application/json']
        );

        $this->assertSame('192.0.2.50', $headers['X-Forwarded-For']);
        $this->assertSame('dummy-secret', $headers['X-Proxy-Secret']);
        $this->assertSame('application/json', $headers['Content-Type']);
    }

    /**
     * Without an injected address, the client's address is read from
     * $_SERVER['REMOTE_ADDR'].
     */
    public function testRequestReadsRemoteAddressFromServerByDefault(): void
    {
        $original = $_SERVER['REMOTE_ADDR'] ?? null;
        $_SERVER['REMOTE_ADDR'] = '192.0.2.99';

        try {
            $headers = $this->sentHeaders([], '', null);
        } finally {
            if ($original === null) {
                unset($_SERVER['REMOTE_ADDR']);
            } else {
                $_SERVER['REMOTE_ADDR'] = $original;
            }
        }

        $this->assertSame('192.0.2.99', $headers['X-Forwarded-For']);
    }

    /**
     * With no remote address known at all, X-Forwarded-For is sent empty,
     * matching SetClientIpMiddleware.
     */
    public function testRequestSendsEmptyForwardedForWhenRemoteAddressUnknown(): void
    {
        $original = $_SERVER['REMOTE_ADDR'] ?? null;
        unset($_SERVER['REMOTE_ADDR']);

        try {
            $headers = $this->sentHeaders([], '', null);
        } finally {
            if ($original !== null) {
                $_SERVER['REMOTE_ADDR'] = $original;
            }
        }

        $this->assertSame('', $headers['X-Forwarded-For']);
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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

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
        $client     = new BackendClient('http://backend:8080', $httpClient, '', '203.0.113.7');

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
