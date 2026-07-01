<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\RequestHandlers\UploadBackendClient;

/**
 * Unit tests for UploadBackendClient.
 */
class UploadBackendClientTest extends TestCase
{
    /**
     * updateStatus() issues a PATCH to /uploads/:id.json with the status in
     * the JSON body, forwards the given headers, and overrides Content-Type
     * to application/json regardless of what was passed in.
     */
    public function testUpdateStatusSendsPatchWithStatusBody(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new UploadBackendClient('http://backend:8080', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/42.json',
                [
                    'Authorization' => 'Bearer tok',
                    'Content-Type'  => 'application/json',
                    'Host'          => 'backend',
                ],
                json_encode(['status' => 'uploading'])
            )
            ->willReturn(['httpCode' => 200, 'body' => '{"file_path":"42/photo.jpg"}', 'headers' => []]);

        $result = $client->updateStatus('42', 'uploading', [
            'Authorization' => 'Bearer tok',
            'Content-Type'  => 'multipart/form-data',
        ]);

        $this->assertSame(200, $result['httpCode']);
        $this->assertSame('{"file_path":"42/photo.jpg"}', $result['body']);
    }

    /**
     * updateStatus() overrides the Host header with the backend's own host
     * (derived from the client's configured host URL), even when the caller
     * forwards a Host header of its own — e.g. the browser's original
     * request-facing host — so edge providers in front of the backend (which
     * may reject a mismatched Host header) never see it.
     */
    public function testUpdateStatusOverridesForwardedHostHeader(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new UploadBackendClient('https://moria-api.ffavs.net', $httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'https://moria-api.ffavs.net/uploads/2.json',
                [
                    'Host'         => 'moria-api.ffavs.net',
                    'Content-Type' => 'application/json',
                ],
                json_encode(['status' => 'uploaded'])
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $client->updateStatus('2', 'uploaded', [
            'Host' => 'moria.ffavs.net',
        ]);
    }

    /**
     * The result returned by the underlying HTTP client is passed through
     * unchanged, including non-200 status codes.
     */
    public function testUpdateStatusReturnsBackendErrorUnchanged(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new UploadBackendClient('http://backend:8080', $httpClient);

        $httpClient->method('request')
            ->willReturn(['httpCode' => 403, 'body' => 'Forbidden', 'headers' => []]);

        $result = $client->updateStatus('7', 'uploaded', []);

        $this->assertSame(403, $result['httpCode']);
        $this->assertSame('Forbidden', $result['body']);
    }
}
