<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\RequestHandlers\BackendClient;
use Tent\RequestHandlers\BackendErrorException;
use Tent\RequestHandlers\UploadCleanupRequiredException;
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
     * status=uploaded body and returns the response's header lines.
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
            ->willReturn(
                ['httpCode' => 200, 'body' => '{}', 'headers' => ['X-Cache-Clear: /games/foo/factions.json']]
            );

        $result = $statusClient->requestUploadedStatus('42', []);

        $this->assertSame(['X-Cache-Clear: /games/foo/factions.json'], $result->headers());
        $this->assertNull($result->previousPath());
    }

    /**
     * Builds an UploadStatusClient whose single backend call returns
     * $httpCode/$body.
     */
    private function statusClientReturning(int $httpCode, string $body): UploadStatusClient
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->method('request')
            ->willReturn(['httpCode' => $httpCode, 'body' => $body, 'headers' => []]);

        return new UploadStatusClient(new BackendClient('http://backend:8080', $httpClient), 'image');
    }

    /**
     * A 200 carrying previous_path exposes it.
     */
    public function testRequestUploadedStatusExposesPreviousPath(): void
    {
        $result = $this->statusClientReturning(200, '{"previous_path":"staff/3/photo.png"}')
            ->requestUploadedStatus('42', []);

        $this->assertSame('staff/3/photo.png', $result->previousPath());
    }

    /**
     * A 200 with an empty body has no previous_path.
     */
    public function testRequestUploadedStatusWithEmptyBodyHasNoPreviousPath(): void
    {
        $result = $this->statusClientReturning(200, '')->requestUploadedStatus('42', []);

        $this->assertNull($result->previousPath());
    }

    /**
     * A non-string or empty previous_path is ignored.
     */
    public function testRequestUploadedStatusIgnoresInvalidPreviousPath(): void
    {
        $this->assertNull(
            $this->statusClientReturning(200, '{"previous_path":""}')->requestUploadedStatus('42', [])->previousPath()
        );
        $this->assertNull(
            $this->statusClientReturning(200, '{"previous_path":["a"]}')->requestUploadedStatus('42', [])->previousPath()
        );
    }

    /**
     * A 404 carrying cleanup_path raises UploadCleanupRequiredException with
     * the path, the code and the original body.
     */
    public function testRequestUploadedStatusThrowsCleanupOnNotFoundWithCleanupPath(): void
    {
        $body = '{"cleanup_path":"staff/3/photo.jpg"}';

        try {
            $this->statusClientReturning(404, $body)->requestUploadedStatus('42', []);
            $this->fail('Expected UploadCleanupRequiredException to be thrown.');
        } catch (UploadCleanupRequiredException $e) {
            $this->assertSame('staff/3/photo.jpg', $e->cleanupPath());
            $this->assertSame(404, $e->httpCode());
            $this->assertSame($body, $e->body());
        }
    }

    /**
     * A 404 without cleanup_path raises a plain BackendErrorException.
     */
    public function testRequestUploadedStatusThrowsBackendErrorOnNotFoundWithoutCleanupPath(): void
    {
        try {
            $this->statusClientReturning(404, '{"detail":"Not found."}')->requestUploadedStatus('42', []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (UploadCleanupRequiredException $e) {
            $this->fail('Did not expect UploadCleanupRequiredException.');
        } catch (BackendErrorException $e) {
            $this->assertSame(404, $e->httpCode());
        }
    }

    /**
     * A 404 with a non-JSON body raises a plain BackendErrorException.
     */
    public function testRequestUploadedStatusThrowsBackendErrorOnNonJsonNotFound(): void
    {
        try {
            $this->statusClientReturning(404, 'Not Found')->requestUploadedStatus('42', []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (UploadCleanupRequiredException $e) {
            $this->fail('Did not expect UploadCleanupRequiredException.');
        } catch (BackendErrorException $e) {
            $this->assertSame(404, $e->httpCode());
            $this->assertSame('Not Found', $e->body());
        }
    }

    /**
     * requestUploadingStatus() treats a 404 with cleanup_path as a plain
     * BackendErrorException.
     */
    public function testRequestUploadingStatusDoesNotSurfaceCleanupPath(): void
    {
        try {
            $this->statusClientReturning(404, '{"cleanup_path":"staff/3/photo.jpg"}')
                ->requestUploadingStatus('42', []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (UploadCleanupRequiredException $e) {
            $this->fail('Did not expect UploadCleanupRequiredException.');
        } catch (BackendErrorException $e) {
            $this->assertSame(404, $e->httpCode());
        }
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

    // -------------------------------------------------------------------------
    // requestLinkStartStatus() / requestFailedStatus() (issue #1570)
    // -------------------------------------------------------------------------

    /**
     * The link start sends status=uploading (forwarding X-Upload-Token) and
     * returns both paths.
     */
    public function testRequestLinkStartStatusReturnsBothPaths(): void
    {
        $httpClient   = $this->createMock(HttpClientInterface::class);
        $statusClient = new UploadStatusClient(new BackendClient('http://backend:8080', $httpClient), 'file');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/file/7.json',
                [
                    'X-Upload-Token'  => 'up-tok',
                    'Content-Type'    => 'application/json',
                    'Host'            => 'backend',
                    'Accept-Encoding' => 'gzip',
                ],
                json_encode(['status' => 'uploading'])
            )
            ->willReturn([
                'httpCode' => 200,
                'body'     => '{"file_path":"files/9/doc.pdf","source_path":"files/3/doc.pdf"}',
                'headers'  => [],
            ]);

        $this->assertSame(
            ['file_path' => 'files/9/doc.pdf', 'source_path' => 'files/3/doc.pdf'],
            $statusClient->requestLinkStartStatus('7', ['X-Upload-Token' => 'up-tok', 'X-Trace-Id' => 'x'])
        );
    }

    /**
     * A 200 missing (or with an empty / non-string) source_path or file_path
     * raises a 500.
     *
     * @dataProvider incompleteLinkBodies
     */
    public function testRequestLinkStartStatusThrowsWhenAPathIsMissing(string $body): void
    {
        $httpClient   = $this->createMock(HttpClientInterface::class);
        $statusClient = new UploadStatusClient(new BackendClient('http://backend:8080', $httpClient), 'image');
        $httpClient->method('request')->willReturn(['httpCode' => 200, 'body' => $body, 'headers' => []]);

        try {
            $statusClient->requestLinkStartStatus('7', []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (BackendErrorException $e) {
            $this->assertSame(500, $e->httpCode());
            $this->assertSame('Internal Server Error', $e->body());
        }
    }

    public static function incompleteLinkBodies(): array
    {
        return [
            'missing source_path' => ['{"file_path":"photos/9/a.jpg"}'],
            'missing file_path'   => ['{"source_path":"photos/3/a.jpg"}'],
            'empty source_path'   => ['{"file_path":"photos/9/a.jpg","source_path":""}'],
            'non-string path'     => ['{"file_path":["x"],"source_path":"photos/3/a.jpg"}'],
            'not json'            => ['nope'],
        ];
    }

    /**
     * A backend 403/404 on link start is relayed as-is.
     *
     * @dataProvider relayedCodes
     */
    public function testRequestLinkStartStatusRelaysBackendError(int $code, string $body): void
    {
        $httpClient   = $this->createMock(HttpClientInterface::class);
        $statusClient = new UploadStatusClient(new BackendClient('http://backend:8080', $httpClient), 'image');
        $httpClient->method('request')->willReturn(['httpCode' => $code, 'body' => $body, 'headers' => []]);

        try {
            $statusClient->requestLinkStartStatus('7', []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (BackendErrorException $e) {
            $this->assertSame($code, $e->httpCode());
            $this->assertSame($body, $e->body());
        }
    }

    public static function relayedCodes(): array
    {
        return [
            'forbidden' => [403, '{"detail":"Forbidden"}'],
            'not found' => [404, '{"detail":"Not found"}'],
        ];
    }

    /**
     * The failed call sends status=failed with the error code.
     */
    public function testRequestFailedStatusSendsErrorField(): void
    {
        $httpClient   = $this->createMock(HttpClientInterface::class);
        $statusClient = new UploadStatusClient(new BackendClient('http://backend:8080', $httpClient), 'image');

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/image/7.json',
                $this->anything(),
                json_encode(['status' => 'failed', 'error' => 'cross_device'])
            )
            ->willReturn(['httpCode' => 200, 'body' => '{}', 'headers' => []]);

        $statusClient->requestFailedStatus('7', 'cross_device', ['X-Upload-Token' => 'up-tok']);
    }

    /**
     * A non-200 failed call throws with the backend's code and body.
     */
    public function testRequestFailedStatusThrowsOnNonTwoHundred(): void
    {
        $httpClient   = $this->createMock(HttpClientInterface::class);
        $statusClient = new UploadStatusClient(new BackendClient('http://backend:8080', $httpClient), 'image');
        $httpClient->method('request')->willReturn(['httpCode' => 400, 'body' => 'bad', 'headers' => []]);

        try {
            $statusClient->requestFailedStatus('7', 'bogus', []);
            $this->fail('Expected BackendErrorException to be thrown.');
        } catch (BackendErrorException $e) {
            $this->assertSame(400, $e->httpCode());
            $this->assertSame('bad', $e->body());
        }
    }
}
