<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\RequestHandlers\BackendClient;
use Tent\RequestHandlers\BackendErrorException;
use Tent\RequestHandlers\UploadStatusClient;

/**
 * Unit tests for UploadStatusClient.
 */
class UploadStatusClientTest extends TestCase
{
    // -------------------------------------------------------------------------
    // requestUploadingStatus() - success
    // -------------------------------------------------------------------------

    /**
     * A successful PATCH targets /uploads/:upload_type/:id.json with a
     * status=uploading body, forwarding X-Upload-Token on top of the base
     * allow-list, and returns the file_path from the response body.
     */
    public function testRequestUploadingStatusReturnsFilePathOnSuccess(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);
        $statusClient = new UploadStatusClient($client, 'image');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/image/42.json',
                [
                    'X-Upload-Token'  => 'up-tok',
                    'Content-Type'    => 'application/json',
                    'Host'            => 'backend',
                    'Accept-Encoding' => 'gzip',
                ],
                json_encode(['status' => 'uploading'])
            )
            ->willReturn(['httpCode' => 200, 'body' => '{"file_path":"42/photo.jpg"}', 'headers' => []]);

        $filePath = $statusClient->requestUploadingStatus('42', [
            'X-Upload-Token' => 'up-tok',
            'X-Trace-Id'     => 'trace-abc',
        ]);

        $this->assertSame('42/photo.jpg', $filePath);
    }

    /**
     * The 'file' upload type is reflected in the PATCH URL.
     */
    public function testRequestUploadingStatusUsesUploadTypeInUrl(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);
        $statusClient = new UploadStatusClient($client, 'file');

        $httpClient->expects($this->once())
            ->method('request')
            ->with('PATCH', 'http://backend:8080/uploads/file/99.json', $this->anything(), $this->anything())
            ->willReturn(['httpCode' => 200, 'body' => '{"file_path":"99/document.pdf"}', 'headers' => []]);

        $filePath = $statusClient->requestUploadingStatus('99', []);

        $this->assertSame('99/document.pdf', $filePath);
    }

    // -------------------------------------------------------------------------
    // requestUploadingStatus() - error paths
    // -------------------------------------------------------------------------

    /**
     * A non-200 response raises a BackendErrorException carrying the
     * backend's httpCode and body.
     */
    public function testRequestUploadingStatusThrowsOnBackendError(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);
        $statusClient = new UploadStatusClient($client, 'image');

        $httpClient->method('request')
            ->willReturn(['httpCode' => 403, 'body' => 'Forbidden', 'headers' => []]);

        try {
            $statusClient->requestUploadingStatus('42', []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (BackendErrorException $e) {
            $this->assertSame(403, $e->httpCode());
            $this->assertSame('Forbidden', $e->body());
        }
    }

    /**
     * A 200 response missing file_path in its JSON body raises a
     * BackendErrorException with httpCode 500.
     */
    public function testRequestUploadingStatusThrowsWhenFilePathIsMissing(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);
        $statusClient = new UploadStatusClient($client, 'image');

        $httpClient->method('request')
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        try {
            $statusClient->requestUploadingStatus('42', []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (BackendErrorException $e) {
            $this->assertSame(500, $e->httpCode());
            $this->assertSame('Internal Server Error', $e->body());
        }
    }

    // -------------------------------------------------------------------------
    // requestUploadedStatus() - success and error paths
    // -------------------------------------------------------------------------

    /**
     * A successful PATCH targets /uploads/:upload_type/:id.json with a
     * status=uploaded body and returns void.
     */
    public function testRequestUploadedStatusSucceedsOnTwoHundred(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);
        $statusClient = new UploadStatusClient($client, 'image');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/image/42.json',
                $this->anything(),
                json_encode(['status' => 'uploaded'])
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $statusClient->requestUploadedStatus('42', []);

        $this->addToAssertionCount(1);
    }

    /**
     * A non-200 response raises a BackendErrorException carrying the
     * backend's httpCode and body.
     */
    public function testRequestUploadedStatusThrowsOnBackendError(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $client     = new BackendClient('http://backend:8080', $httpClient);
        $statusClient = new UploadStatusClient($client, 'file');

        $httpClient->method('request')
            ->willReturn(['httpCode' => 500, 'body' => 'Internal Server Error', 'headers' => []]);

        try {
            $statusClient->requestUploadedStatus('99', []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (BackendErrorException $e) {
            $this->assertSame(500, $e->httpCode());
            $this->assertSame('Internal Server Error', $e->body());
        }
    }
}
