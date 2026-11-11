<?php

namespace Tent\RequestHandlers\Tests;

use Tent\Http\HttpClientInterface;
use Tent\RequestHandlers\BackendClient;

require_once __DIR__ . '/RemoteAddrFixture.php';

/**
 * Helpers for handler tests checking that a handler's backend calls carry
 * the signed client IP: X-Forwarded-For set to the client's address and,
 * when the handler was given a secret, X-Proxy-Secret.
 *
 * Pulls in RemoteAddrFixture, so the client's address is a known
 * documentation-range one. Not auto-loaded: `require_once` it from the test
 * file using it.
 */
trait SignedClientIpAssertions
{
    use RemoteAddrFixture;

    /**
     * @var array[] Headers of every backend call made through
     *              recordingHttpClient(), in order.
     */
    private array $recordedHeaders = [];

    /**
     * @return string The dummy secret handlers are configured with.
     */
    private static function dummySecret(): string
    {
        return 'dummy-secret';
    }

    /**
     * Headers a client would send trying to forge its own IP.
     */
    private static function spoofedHeaders(): array
    {
        return [
            'Cookie'          => 'sessionid=abc',
            'X-Upload-Token'  => 'up-tok',
            'x-forwarded-for' => '192.0.2.1',
            'X-PROXY-SECRET'  => 'guess',
        ];
    }

    /**
     * An HTTP client recording the headers of each backend call and
     * answering 500, so the handler stops right after its first call.
     */
    private function recordingHttpClient(): HttpClientInterface
    {
        $this->recordedHeaders = [];
        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->method('request')->willReturnCallback(
            function (string $method, string $url, array $headers = []): array {
                $this->recordedHeaders[] = $headers;

                return ['httpCode' => 500, 'body' => '{}', 'headers' => []];
            }
        );

        return $httpClient;
    }

    /**
     * The secret the handler's BackendClient was built with.
     *
     * @param object $handler A handler holding a BackendClient in `$client`.
     */
    private function backendSecretOf(object $handler): string
    {
        $clientProp = new \ReflectionProperty($handler, 'client');
        $clientProp->setAccessible(true);

        $secretProp = new \ReflectionProperty(BackendClient::class, 'secret');
        $secretProp->setAccessible(true);

        return $secretProp->getValue($clientProp->getValue($handler));
    }

    /**
     * Asserts every recorded backend call carried the client's address
     * and exactly $secret ('' meaning no X-Proxy-Secret at all), with no
     * client-supplied variant of either header left.
     */
    private function assertBackendCallsCarryClientIp(string $secret): void
    {
        $this->assertNotEmpty($this->recordedHeaders, 'No backend call was made.');

        foreach ($this->recordedHeaders as $headers) {
            $clientIpHeaders = [];
            foreach ($headers as $name => $value) {
                if (in_array(strtolower($name), ['x-forwarded-for', 'x-proxy-secret'], true)) {
                    $clientIpHeaders[$name] = $value;
                }
            }

            $expected = ['X-Forwarded-For' => self::clientAddress()];
            if ($secret !== '') {
                $expected['X-Proxy-Secret'] = $secret;
            }

            $this->assertSame($expected, $clientIpHeaders);
        }
    }
}
