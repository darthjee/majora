<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\Models\Response;
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
     *
     * Defaults to real, minimal-but-valid JPEG bytes (rather than arbitrary
     * text) so that tests exercising the happy path also satisfy the
     * content-based (fileinfo) validation added in UploadHandler, without
     * every caller having to spell out real bytes explicitly.
     */
    private function makeTmpFile(string $content = self::REAL_JPEG_BYTES): string
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'test_upload_');
        file_put_contents($tmpFile, $content);
        return $tmpFile;
    }

    /**
     * Minimal byte sequence that is a genuine JPEG per its magic header
     * (SOI + APP0/JFIF marker), so finfo_file() detects it as image/jpeg.
     */
    private const REAL_JPEG_BYTES =
        "\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00";

    /**
     * A genuine 1x1 transparent PNG, so finfo_file() detects it as
     * image/png. A bare 8-byte PNG signature isn't enough for libmagic to
     * recognize the file — it needs a real (even if tiny) IHDR chunk.
     */
    private const REAL_PNG_BYTES_BASE64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    /**
     * @return string Real PNG bytes decoded from REAL_PNG_BYTES_BASE64.
     */
    private function realPngBytes(): string
    {
        return base64_decode(self::REAL_PNG_BYTES_BASE64);
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

    /**
     * Sets up $httpClient to expect exactly two consecutive request() calls
     * (the 'uploading' PATCH followed by the 'uploaded' PATCH), each
     * returning a 200 response — $firstBody for the first call, $secondBody
     * for the second. When $withArgs is given, the mock also constrains the
     * calls to those request() argument matchers via ->with(...$withArgs).
     */
    private function expectTwoForwardedRequests(
        HttpClientInterface $httpClient,
        string $firstBody,
        string $secondBody = '{}',
        ?array $withArgs = null
    ): void {
        $expectation = $httpClient->expects($this->exactly(2))->method('request');

        if ($withArgs !== null) {
            $expectation->with(...$withArgs);
        }

        $expectation->willReturnOnConsecutiveCalls(
            ['httpCode' => 200, 'body' => $firstBody, 'headers' => []],
            ['httpCode' => 200, 'body' => $secondBody, 'headers' => []]
        );
    }

    /**
     * Asserts $response is a 200, optionally also asserting the
     * Content-Type: application/json header is present and/or that the
     * decoded JSON body equals $expectedBody.
     */
    private function assertSuccessResponse(
        Response $response,
        ?array $expectedBody = null,
        bool $checkContentType = false
    ): void {
        $this->assertSame(200, $response->httpCode());

        if ($checkContentType) {
            $this->assertContains('Content-Type: application/json', $response->headers());
        }

        if ($expectedBody !== null) {
            $this->assertSame($expectedBody, json_decode($response->body(), true));
        }
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

        $this->expectTwoForwardedRequests($httpClient, '{"file_path":"42/photo.jpg"}');

        $response = $handler->handleRequest($request);

        $this->assertSuccessResponse(
            $response,
            ['file_path' => $this->photosDir . '/42/photo.jpg'],
            true
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

        $this->expectTwoForwardedRequests($httpClient, '{"file_path":"99/document.pdf"}');

        $response = $handler->handleRequest($request);

        $this->assertSuccessResponse(
            $response,
            ['file_path' => $this->filesDir . '/99/document.pdf'],
            true
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

        $this->expectTwoForwardedRequests(
            $httpClient,
            '{"file_path":"99/document.pdf"}',
            '{}',
            ['PATCH', 'http://backend:8080/uploads/file/99.json', $this->anything(), $this->anything()]
        );

        $response = $handler->handleRequest($request);

        $this->assertSuccessResponse($response);

        unlink($tmpFile);
    }

    /**
     * A trailing slash on the configured 'host' never produces a double
     * slash at the host/path boundary of the backend URL.
     */
    public function testTrailingSlashOnHostDoesNotProduceDoubleSlash(): void
    {
        $tmpFile    = $this->makeTmpFile('%PDF-1.4 fake pdf data');
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new UploadHandler('http://backend:8080/', $httpClient, $this->photosDir, $this->filesDir);

        $request = $this->makeRequest(
            $this->submitPath('file', '99'),
            ['tmp_name' => $tmpFile, 'type' => 'application/pdf', 'name' => 'document.pdf', 'size' => 20, 'error' => 0]
        );

        $this->expectTwoForwardedRequests(
            $httpClient,
            '{"file_path":"99/document.pdf"}',
            '{}',
            ['PATCH', 'http://backend:8080/uploads/file/99.json', $this->anything(), $this->anything()]
        );

        $response = $handler->handleRequest($request);

        $this->assertSuccessResponse($response);

        unlink($tmpFile);
    }

    /**
     * Only allow-listed headers are forwarded to both backend PATCH calls,
     * with Content-Type overridden to application/json and Host overridden to
     * the backend's own host, regardless of what the client sent.
     * Non-allow-listed headers (e.g. X-Trace-Id) must be dropped before
     * reaching the backend, while allow-listed ones such as Authorization
     * and X-Upload-Token are forwarded as-is. The client's own
     * Accept-Encoding header is not itself forwarded (it isn't on the
     * allow-list), but BackendClient always sets its own
     * Accept-Encoding: gzip on the outgoing request regardless, and
     * transparently decodes a gzip response before it reaches this handler.
     */
    public function testOnlyAllowListedHeadersAreForwardedToBackend(): void
    {
        $tmpFile    = $this->makeTmpFile($this->realPngBytes());
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
            'Accept-Encoding' => 'gzip',
        ];

        $this->expectTwoForwardedRequests(
            $httpClient,
            '{"file_path":"7/img.png"}',
            '{}',
            [$this->anything(), $this->anything(), $expectedHeaders, $this->anything()]
        );

        $response = $handler->handleRequest($request);

        $this->assertSuccessResponse($response, ['file_path' => $this->photosDir . '/7/img.png']);

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
        $tmpFile    = $this->makeTmpFile($this->realPngBytes());
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
            'cookie'          => 'session=abc',
            'REFERER'         => 'http://client/upload',
            'Content-Type'    => 'application/json',
            'Host'            => 'backend',
            'Accept-Encoding' => 'gzip',
        ];

        $this->expectTwoForwardedRequests(
            $httpClient,
            '{"file_path":"7/img.png"}',
            '{}',
            [$this->anything(), $this->anything(), $expectedHeaders, $this->anything()]
        );

        $response = $handler->handleRequest($request);

        $this->assertSuccessResponse($response, ['file_path' => $this->photosDir . '/7/img.png']);

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
     * A 'file' (PDF) upload whose Content-Type and .pdf extension both claim
     * to be a PDF, but whose actual on-disk content is plain text/HTML (not
     * a real PDF), is rejected with 'unsupported_mime_type' based on the
     * fileinfo content check, and no backend call is made. This guards
     * against an attacker spoofing Content-Type/filename to smuggle
     * arbitrary content (e.g. HTML with an embedded <script>) past
     * validation and have it served back statically via /files.
     */
    public function testFileTypeWithMismatchedContentIsRejected(): void
    {
        $tmpFile    = $this->makeTmpFile('<html><script>alert(1)</script></html>');
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('file', '42'),
            ['tmp_name' => $tmpFile, 'type' => 'application/pdf', 'name' => 'document.pdf', 'size' => 10, 'error' => 0]
        );

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(422, $response->httpCode());
        $this->assertSame(
            [
                'error'    => 'Unprocessable Entity',
                'reason'   => 'unsupported_mime_type',
                'filename' => 'document.pdf',
                'mimeType' => 'application/pdf',
            ],
            json_decode($response->body(), true)
        );

        unlink($tmpFile);
    }

    /**
     * An 'image' upload whose Content-Type and .jpg extension both claim to
     * be a JPEG, but whose actual on-disk content is plain text/HTML (not a
     * real image), is rejected with 'unsupported_mime_type' based on the
     * fileinfo content check, and no backend call is made.
     */
    public function testImageTypeWithMismatchedContentIsRejected(): void
    {
        $tmpFile    = $this->makeTmpFile('<html><script>alert(1)</script></html>');
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->submitPath('image', '42'),
            ['tmp_name' => $tmpFile, 'type' => 'image/jpeg', 'name' => 'photo.jpg', 'size' => 10, 'error' => 0]
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

        unlink($tmpFile);
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
     * A symlink planted at the destination file path (not its containing
     * directory) inside photosBasePath, pointing outside of it: the
     * directory-level double-check in SecurePhotoStorage::ensureDirectoryFor()
     * doesn't catch this, since the containing directory itself is a real,
     * legitimate directory inside the base path — only the leaf (the file
     * being written) is a symlink escaping the base. This is exactly the gap
     * the additional PathTraversalGuard::assertRealPathWithinBase() check in
     * UploadHandler::writeUploadedFile() closes: once file_put_contents()
     * follows the symlink and actually writes the file (making it resolvable
     * via realpath()), the check catches that the real destination lives
     * outside photosBasePath and rejects the upload with 400, before the
     * second ('uploaded') backend PATCH call is ever made.
     */
    public function testUploadIsRejectedWhenDestinationFileSymlinkEscapesBasePath(): void
    {
        $tmpFile    = $this->makeTmpFile();
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $outsideDir = sys_get_temp_dir() . '/test_outside_' . uniqid();
        mkdir($outsideDir, 0755, true);
        mkdir($this->photosDir . '/42', 0755, true);
        symlink($outsideDir . '/photo.jpg', $this->photosDir . '/42/photo.jpg');

        $request = $this->makeRequest(
            $this->submitPath('image', '42'),
            ['tmp_name' => $tmpFile, 'type' => 'image/jpeg', 'name' => 'photo.jpg', 'size' => 10, 'error' => 0],
            ['Authorization' => 'Bearer tok']
        );

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn(['httpCode' => 200, 'body' => '{"file_path":"42/photo.jpg"}', 'headers' => []]);

        try {
            $response = $handler->handleRequest($request);

            $this->assertSame(400, $response->httpCode());
        } finally {
            @unlink($this->photosDir . '/42/photo.jpg');
            @unlink($outsideDir . '/photo.jpg');
            rmdir($outsideDir);
            unlink($tmpFile);
        }
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
