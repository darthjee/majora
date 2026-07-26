<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\RequestHandlers\UploadHandler;

/**
 * Unit tests for UploadHandler.
 *
 * Uses temporary directories for photo/file storage to avoid touching the
 * real /var/www/html/photos and /var/www/html/files volumes during tests.
 */
class UploadHandlerTest extends TestCase
{
    /** @var string Temporary directory used as the photos base path */
    private string $photosDir;

    /** @var string Temporary directory used as the files base path */
    private string $filesDir;

    protected function setUp(): void
    {
        $this->photosDir = sys_get_temp_dir() . '/test_photos_' . uniqid();
        mkdir($this->photosDir, 0755, true);

        $this->filesDir = sys_get_temp_dir() . '/test_files_' . uniqid();
        mkdir($this->filesDir, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->photosDir);
        $this->removeDir($this->filesDir);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Builds an UploadHandler wired to the temporary photos/files directories.
     */
    private function makeHandler(HttpClientInterface $httpClient): UploadHandler
    {
        return new UploadHandler('http://backend:8080', $httpClient, $this->photosDir, $this->filesDir);
    }

    /**
     * Returns the value of the private $photosBasePath property of $handler via
     * reflection, so tests can assert on it without changing the visibility of
     * the property itself.
     */
    private function photosBasePathOf(UploadHandler $handler): string
    {
        return $this->privatePropertyOf($handler, 'photosBasePath');
    }

    /**
     * Returns the value of the private $filesBasePath property of $handler via
     * reflection, so tests can assert on it without changing the visibility of
     * the property itself.
     */
    private function filesBasePathOf(UploadHandler $handler): string
    {
        return $this->privatePropertyOf($handler, 'filesBasePath');
    }

    private function privatePropertyOf(UploadHandler $handler, string $property): string
    {
        $reflection = new \ReflectionClass($handler);
        $prop       = $reflection->getProperty($property);
        $prop->setAccessible(true);
        return (string) $prop->getValue($handler);
    }

    /**
     * Recursively removes a directory and all its contents.
     */
    private function removeDir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        foreach (scandir($dir) as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $path = $dir . '/' . $entry;
            is_dir($path) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }

    /**
     * Creates a temporary upload file with the given content and returns its path.
     */
    private function makeTmpFile(string $content = 'fake image data'): string
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'test_upload_');
        file_put_contents($tmpFile, $content);
        return $tmpFile;
    }

    /**
     * Builds the /uploads/:upload_type/:id/submit path for $uploadType and $id.
     */
    private function submitPath(string $uploadType, string $id): string
    {
        return '/uploads/' . $uploadType . '/' . $id . '/submit';
    }

    /**
     * Builds a ProcessingRequest for a valid POST /uploads/:upload_type/:id/submit.
     */
    private function makeRequest(
        string $path,
        array $fileEntry,
        array $headers = []
    ): ProcessingRequest {
        return new ProcessingRequest([
            'requestPath'   => $path,
            'requestMethod' => 'POST',
            'headers'       => $headers,
            'uploadedFiles' => $fileEntry ? ['file' => $fileEntry] : [],
            'postFields'    => [],
        ]
        );
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /**
     * Valid image upload: two backend PATCH calls are made in order and a 200
     * response is returned.
     */
    public function testValidImageUploadReturnsTwoHundred(): void
    {
        $tmpFile    = $this->makeTmpFile();
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('image', '42'),
            ['tmp_name' => $tmpFile, 'type' => 'image/jpeg', 'name' => 'photo.jpg', 'size' => 10, 'error' => 0],
            ['Authorization' => 'Bearer tok', 'X-Upload-Token' => 'up-tok']
        );

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"file_path":"42/photo.jpg"}', 'headers' => []],
                ['httpCode' => 200, 'body' => '{}', 'headers' => []]
            );

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertContains('Content-Type: application/json', $response->headers());
        $this->assertSame(
            ['file_path' => $this->photosDir . '/42/photo.jpg'],
            json_decode($response->body(), true)
        );

        unlink($tmpFile);
    }

    /**
     * Valid file (PDF) upload: two backend PATCH calls are made in order, the
     * file is written under filesBasePath (not photosBasePath), and a 200
     * response is returned.
     */
    public function testValidFileUploadReturnsTwoHundred(): void
    {
        $tmpFile    = $this->makeTmpFile('%PDF-1.4 fake pdf data');
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('file', '99'),
            ['tmp_name' => $tmpFile, 'type' => 'application/pdf', 'name' => 'document.pdf', 'size' => 20, 'error' => 0],
            ['Authorization' => 'Bearer tok', 'X-Upload-Token' => 'up-tok']
        );

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"file_path":"99/document.pdf"}', 'headers' => []],
                ['httpCode' => 200, 'body' => '{}', 'headers' => []]
            );

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertContains('Content-Type: application/json', $response->headers());
        $this->assertSame(
            ['file_path' => $this->filesDir . '/99/document.pdf'],
            json_decode($response->body(), true)
        );

        unlink($tmpFile);
    }

    /**
     * The finalize PATCH calls target /uploads/:upload_type/:id.json — the
     * upload_type parsed from the submit path is forwarded to the backend on
     * both the 'uploading' and 'uploaded' PATCH calls.
     */
    public function testFinalizePatchUrlIncludesUploadType(): void
    {
        $tmpFile    = $this->makeTmpFile('%PDF-1.4 fake pdf data');
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('file', '99'),
            ['tmp_name' => $tmpFile, 'type' => 'application/pdf', 'name' => 'document.pdf', 'size' => 20, 'error' => 0]
        );

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->with(
                'PATCH',
                'http://backend:8080/uploads/file/99.json',
                $this->anything(),
                $this->anything()
            )
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"file_path":"99/document.pdf"}', 'headers' => []],
                ['httpCode' => 200, 'body' => '{}', 'headers' => []]
            );

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());

        unlink($tmpFile);
    }

    /**
     * Only allow-listed headers are forwarded to both backend PATCH calls,
     * with Content-Type overridden to application/json and Host overridden to
     * the backend's own host, regardless of what the client sent.
     * Non-allow-listed headers (e.g. X-Trace-Id and Accept-Encoding) must be
     * dropped before reaching the backend, while allow-listed ones such as
     * Authorization and X-Upload-Token are forwarded as-is. Accept-Encoding
     * is deliberately not forwarded so the backend never compresses these
     * internal-only response bodies.
     */
    public function testOnlyAllowListedHeadersAreForwardedToBackend(): void
    {
        $tmpFile    = $this->makeTmpFile();
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('image', '7'),
            ['tmp_name' => $tmpFile, 'type' => 'image/png', 'name' => 'img.png', 'size' => 8, 'error' => 0],
            [
                'Authorization'   => 'Bearer tok',
                'X-Upload-Token'  => 'up-tok',
                'X-Trace-Id'      => 'trace-abc',
                'Content-Type'    => 'multipart/form-data',
                'Cookie'          => 'session=abc',
                'X-Skip-Cache'    => '1',
                'Referer'         => 'http://client/upload',
                'Accept-Encoding' => 'gzip',
                'Accept-Language' => 'en-US',
                'Accept'          => 'application/json',
            ]
        );

        $expectedHeaders = [
            'Authorization'   => 'Bearer tok',
            'X-Upload-Token'  => 'up-tok',
            'Cookie'          => 'session=abc',
            'X-Skip-Cache'    => '1',
            'Referer'         => 'http://client/upload',
            'Accept-Language' => 'en-US',
            'Accept'          => 'application/json',
            'Content-Type'    => 'application/json',
            'Host'            => 'backend',
        ];

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->with(
                $this->anything(),
                $this->anything(),
                $expectedHeaders,
                $this->anything()
            )
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"file_path":"7/img.png"}', 'headers' => []],
                ['httpCode' => 200, 'body' => '{}', 'headers' => []]
            );

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(
            ['file_path' => $this->photosDir . '/7/img.png'],
            json_decode($response->body(), true)
        );

        unlink($tmpFile);
    }

    /**
     * Allow-listed headers are matched case-insensitively: non-canonical
     * casing (e.g. lowercase 'cookie', uppercase 'REFERER') is still
     * forwarded to the backend, under the casing the client sent it as.
     * A genuinely non-allow-listed header (X-Trace-Id) is still dropped
     * regardless of casing.
     */
    public function testAllowListedHeadersAreMatchedCaseInsensitively(): void
    {
        $tmpFile    = $this->makeTmpFile();
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('image', '7'),
            ['tmp_name' => $tmpFile, 'type' => 'image/png', 'name' => 'img.png', 'size' => 8, 'error' => 0],
            [
                'cookie'         => 'session=abc',
                'REFERER'        => 'http://client/upload',
                'x-trace-id'     => 'trace-abc',
            ]
        );

        $expectedHeaders = [
            'cookie'       => 'session=abc',
            'REFERER'      => 'http://client/upload',
            'Content-Type' => 'application/json',
            'Host'         => 'backend',
        ];

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->with(
                $this->anything(),
                $this->anything(),
                $expectedHeaders,
                $this->anything()
            )
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"file_path":"7/img.png"}', 'headers' => []],
                ['httpCode' => 200, 'body' => '{}', 'headers' => []]
            );

        $response = $handler->handleRequest($request);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(
            ['file_path' => $this->photosDir . '/7/img.png'],
            json_decode($response->body(), true)
        );

        unlink($tmpFile);
    }

    /**
     * Invalid file type for an 'image' upload (both unsupported MIME type and
     * extension): 422 is returned with a structured JSON body reporting
     * 'unsupported_mime_type' (MIME type takes precedence over extension),
     * and no backend call is made. A PDF is still rejected under the 'image'
     * upload type — only the 'file' upload type accepts PDFs.
     */
    public function testImageTypePdfUploadIsRejected(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('image', '42'),
            ['tmp_name' => '/tmp/x', 'type' => 'application/pdf', 'name' => 'doc.pdf', 'size' => 10, 'error' => 0]
        );

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(422, $response->httpCode());
        $this->assertContains('Content-Type: application/json', $response->headers());
        $this->assertSame(
            [
                'error'    => 'Unprocessable Entity',
                'reason'   => 'unsupported_mime_type',
                'filename' => 'doc.pdf',
                'mimeType' => 'application/pdf',
            ],
            json_decode($response->body(), true)
        );
    }

    /**
     * A non-PDF upload under the 'file' upload type is rejected with
     * 'unsupported_mime_type', and no backend call is made.
     */
    public function testFileTypeNonPdfUploadIsRejected(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('file', '42'),
            ['tmp_name' => '/tmp/x', 'type' => 'image/jpeg', 'name' => 'photo.jpg', 'size' => 10, 'error' => 0]
        );

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(422, $response->httpCode());
        $this->assertSame(
            [
                'error'    => 'Unprocessable Entity',
                'reason'   => 'unsupported_mime_type',
                'filename' => 'photo.jpg',
                'mimeType' => 'image/jpeg',
            ],
            json_decode($response->body(), true)
        );
    }

    /**
     * A PDF upload with an unsupported extension (MIME type correct, but the
     * filename doesn't end in .pdf) is rejected with 'unsupported_extension'
     * under the 'file' upload type.
     */
    public function testFileTypeUnsupportedExtensionIsRejected(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('file', '42'),
            ['tmp_name' => '/tmp/x', 'type' => 'application/pdf', 'name' => 'document.txt', 'size' => 10, 'error' => 0]
        );

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(422, $response->httpCode());
        $this->assertSame(
            [
                'error'    => 'Unprocessable Entity',
                'reason'   => 'unsupported_extension',
                'filename' => 'document.txt',
                'mimeType' => 'application/pdf',
            ],
            json_decode($response->body(), true)
        );
    }

    /**
     * No file sent at all: 422 is returned with reason 'missing_file' and
     * empty filename/mimeType, and no backend call is made.
     */
    public function testMissingFileReturnsUnprocessableEntity(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest($this->submitPath('image', '42'), []);

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(422, $response->httpCode());
        $this->assertSame(
            [
                'error'    => 'Unprocessable Entity',
                'reason'   => 'missing_file',
                'filename' => '',
                'mimeType' => '',
            ],
            json_decode($response->body(), true)
        );
    }

    /**
     * Valid MIME type but unsupported extension: 422 is returned with reason
     * 'unsupported_extension', and no backend call is made.
     */
    public function testUnsupportedExtensionReturnsUnprocessableEntity(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('image', '42'),
            ['tmp_name' => '/tmp/x', 'type' => 'image/jpeg', 'name' => 'photo.txt', 'size' => 10, 'error' => 0]
        );

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(422, $response->httpCode());
        $this->assertSame(
            [
                'error'    => 'Unprocessable Entity',
                'reason'   => 'unsupported_extension',
                'filename' => 'photo.txt',
                'mimeType' => 'image/jpeg',
            ],
            json_decode($response->body(), true)
        );
    }

    /**
     * Invalid path (no numeric id segment): 400 is returned.
     */
    public function testInvalidPathReturnsBadRequest(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest($this->submitPath('image', 'abc'), []);

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(400, $response->httpCode());
    }

    /**
     * Path missing the upload_type segment altogether (the old
     * /uploads/:id/submit shape): 400 is returned.
     */
    public function testPathMissingUploadTypeReturnsBadRequest(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest('/uploads/42/submit', []);

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(400, $response->httpCode());
    }

    /**
     * An upload_type outside the 'image'/'file' allow-list: 400 is returned.
     */
    public function testUnknownUploadTypeReturnsBadRequest(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest($this->submitPath('video', '42'), []);

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(400, $response->httpCode());
    }

    /**
     * Backend error on first PATCH: the backend status code is forwarded and
     * no file is written to the photos directory.
     */
    public function testBackendErrorOnFirstPatchForwardsErrorCode(): void
    {
        $tmpFile    = $this->makeTmpFile();
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('image', '42'),
            ['tmp_name' => $tmpFile, 'type' => 'image/jpeg', 'name' => 'photo.jpg', 'size' => 10, 'error' => 0],
            ['Authorization' => 'Bearer tok', 'X-Upload-Token' => 'up-tok']
        );

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn(['httpCode' => 403, 'body' => 'Forbidden', 'headers' => []]);

        $response = $handler->handleRequest($request);

        $this->assertSame(403, $response->httpCode());

        // No file should have been written
        $files = array_diff(scandir($this->photosDir), ['.', '..']);
        $this->assertEmpty($files);

        unlink($tmpFile);
    }

    /**
     * build() sets photosBasePath and filesBasePath from the 'photos_path'
     * and 'files_path' configuration parameters, respectively.
     */
    public function testBuildSetsBasePathsFromParams(): void
    {
        $handler = UploadHandler::build([
            'host'        => 'http://backend:8080',
            'photos_path' => $this->photosDir,
            'files_path'  => $this->filesDir,
        ]
        );

        $this->assertSame(
            $this->photosDir,
            $this->photosBasePathOf($handler)
        );
        $this->assertSame(
            $this->filesDir,
            $this->filesBasePathOf($handler)
        );
    }
}
