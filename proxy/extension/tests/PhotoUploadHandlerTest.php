<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\RequestHandlers\PhotoUploadHandler;

/**
 * Unit tests for PhotoUploadHandler.
 *
 * Uses a temporary directory for photo storage to avoid touching the real
 * /var/www/html/photos volume during tests.
 */
class PhotoUploadHandlerTest extends TestCase
{
    /** @var string Temporary directory used as the photos base path */
    private string $photosDir;

    /** @var string|null Saved value of $_SERVER['DOCUMENT_ROOT'] before any test modifies it */
    private ?string $savedDocumentRoot = null;

    /** @var bool Whether $_SERVER['DOCUMENT_ROOT'] was set before the save */
    private bool $documentRootWasSet = false;

    protected function setUp(): void
    {
        $this->photosDir = sys_get_temp_dir() . '/test_photos_' . uniqid();
        mkdir($this->photosDir, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->photosDir);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Saves the current value (or absence) of $_SERVER['DOCUMENT_ROOT'] so that
     * restoreDocumentRoot() can put it back after a test modifies it.
     */
    private function saveDocumentRoot(): void
    {
        $this->documentRootWasSet = isset($_SERVER['DOCUMENT_ROOT']);
        $this->savedDocumentRoot  = $_SERVER['DOCUMENT_ROOT'] ?? null;
    }

    /**
     * Restores $_SERVER['DOCUMENT_ROOT'] to the state captured by saveDocumentRoot().
     */
    private function restoreDocumentRoot(): void
    {
        if ($this->documentRootWasSet) {
            $_SERVER['DOCUMENT_ROOT'] = $this->savedDocumentRoot;
        } else {
            unset($_SERVER['DOCUMENT_ROOT']);
        }
    }

    /**
     * Returns the value of the private $photosBasePath property of $handler via
     * reflection, so tests can assert on it without changing the visibility of
     * the property itself.
     */
    private function photosBasePathOf(PhotoUploadHandler $handler): string
    {
        $reflection = new \ReflectionClass($handler);
        $prop       = $reflection->getProperty('photosBasePath');
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
     * Builds a ProcessingRequest for a valid image PATCH /uploads/:id/submit.
     */
    private function makeRequest(
        string $path,
        array $fileEntry,
        array $headers = []
    ): ProcessingRequest {
        return new ProcessingRequest([
            'requestPath'   => $path,
            'requestMethod' => 'PATCH',
            'headers'       => $headers,
            'uploadedFiles' => $fileEntry ? ['file' => $fileEntry] : [],
            'postFields'    => [],
        ]);
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
        $handler    = new PhotoUploadHandler('http://backend:8080', $httpClient, $this->photosDir);

        $request = $this->makeRequest(
            '/uploads/42/submit',
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

        unlink($tmpFile);
    }

    /**
     * Invalid file type: 422 is returned and no backend call is made.
     */
    public function testInvalidFileTypeReturnsUnprocessableEntity(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new PhotoUploadHandler('http://backend:8080', $httpClient, $this->photosDir);

        $request = $this->makeRequest(
            '/uploads/42/submit',
            ['tmp_name' => '/tmp/x', 'type' => 'application/pdf', 'name' => 'doc.pdf', 'size' => 10, 'error' => 0]
        );

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(422, $response->httpCode());
    }

    /**
     * Invalid path (no numeric id segment): 400 is returned.
     */
    public function testInvalidPathReturnsBadRequest(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new PhotoUploadHandler('http://backend:8080', $httpClient, $this->photosDir);

        $request = $this->makeRequest('/uploads/abc/submit', []);

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
        $handler    = new PhotoUploadHandler('http://backend:8080', $httpClient, $this->photosDir);

        $request = $this->makeRequest(
            '/uploads/42/submit',
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
     * build() sets photosBasePath to <DOCUMENT_ROOT>/photos when DOCUMENT_ROOT
     * is present, so photos always land relative to the actual Tent installation.
     */
    public function testBuildSetsPhotosBasePathFromDocumentRoot(): void
    {
        $this->saveDocumentRoot();
        $_SERVER['DOCUMENT_ROOT'] = $this->photosDir;

        try {
            $handler = PhotoUploadHandler::build(['host' => 'http://backend:8080']);

            $this->assertSame(
                $this->photosDir . '/photos',
                $this->photosBasePathOf($handler)
            );
        } finally {
            $this->restoreDocumentRoot();
        }
    }

    /**
     * build() strips a trailing slash from DOCUMENT_ROOT before appending /photos,
     * so the path is always clean regardless of how the server reports it.
     */
    public function testBuildStripsTrailingSlashFromDocumentRoot(): void
    {
        $this->saveDocumentRoot();
        $_SERVER['DOCUMENT_ROOT'] = $this->photosDir . '/';

        try {
            $handler = PhotoUploadHandler::build(['host' => 'http://backend:8080']);

            $this->assertSame(
                $this->photosDir . '/photos',
                $this->photosBasePathOf($handler)
            );
        } finally {
            $this->restoreDocumentRoot();
        }
    }

    /**
     * build() falls back to /var/www/html/photos when DOCUMENT_ROOT is absent
     * (e.g. during CLI test runs where no web server is present).
     */
    public function testBuildFallsBackToDefaultWhenDocumentRootAbsent(): void
    {
        $this->saveDocumentRoot();
        unset($_SERVER['DOCUMENT_ROOT']);

        try {
            $handler = PhotoUploadHandler::build(['host' => 'http://backend:8080']);

            $this->assertSame('/var/www/html/photos', $this->photosBasePathOf($handler));
        } finally {
            $this->restoreDocumentRoot();
        }
    }
}
