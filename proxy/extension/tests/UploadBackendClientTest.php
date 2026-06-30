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
