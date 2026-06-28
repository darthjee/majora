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
     * build() derives photosBasePath from $_SERVER['DOCUMENT_ROOT'] so that
     * uploaded photos land in the correct directory regardless of where Tent is
     * installed.
     */
    public function testBuildDerivesPhotosBasePathFromDocumentRoot(): void
    {
        $originalDocumentRoot = $_SERVER['DOCUMENT_ROOT'] ?? null;

        // Point DOCUMENT_ROOT at our temporary directory
        $_SERVER['DOCUMENT_ROOT'] = $this->photosDir;

        try {
            $handler = PhotoUploadHandler::build(['host' => 'http://backend:8080']);

            $tmpFile = $this->makeTmpFile();
            $httpClient = $this->createMock(HttpClientInterface::class);

            // We cannot inject the mock after build(), so we verify the path
            // indirectly by constructing an equivalent handler with the same
            // photosBasePath and confirming the file lands in <photosDir>/photos/.
            $expectedPhotosDir = $this->photosDir . '/photos';
            mkdir($expectedPhotosDir, 0755, true);

            $handlerWithMock = new PhotoUploadHandler(
                'http://backend:8080',
                $httpClient,
                $expectedPhotosDir
            );

            $request = $this->makeRequest(
                '/uploads/7/submit',
                ['tmp_name' => $tmpFile, 'type' => 'image/png', 'name' => 'img.png', 'size' => 5, 'error' => 0],
                ['Authorization' => 'Bearer tok', 'X-Upload-Token' => 'up-tok']
            );

            $httpClient->expects($this->exactly(2))
                ->method('request')
                ->willReturnOnConsecutiveCalls(
                    ['httpCode' => 200, 'body' => '{"file_path":"7/img.png"}', 'headers' => []],
                    ['httpCode' => 200, 'body' => '{}', 'headers' => []]
                );

            $response = $handlerWithMock->handleRequest($request);
            $this->assertSame(200, $response->httpCode());
            $this->assertFileExists($expectedPhotosDir . '/7/img.png');

            // Also verify that build() itself resolves the path correctly by
            // checking the constructed photosBasePath equals <DOCUMENT_ROOT>/photos.
            // We do this by inspecting the handler via reflection.
            $reflection = new \ReflectionClass($handler);
            $prop       = $reflection->getProperty('photosBasePath');
            $prop->setAccessible(true);
            $this->assertSame($this->photosDir . '/photos', $prop->getValue($handler));

            unlink($tmpFile);
        } finally {
            if ($originalDocumentRoot === null) {
                unset($_SERVER['DOCUMENT_ROOT']);
            } else {
                $_SERVER['DOCUMENT_ROOT'] = $originalDocumentRoot;
            }
        }
    }

    /**
     * build() falls back to /var/www/html/photos when DOCUMENT_ROOT is absent.
     */
    public function testBuildFallsBackToDefaultWhenDocumentRootAbsent(): void
    {
        $originalDocumentRoot = $_SERVER['DOCUMENT_ROOT'] ?? null;
        unset($_SERVER['DOCUMENT_ROOT']);

        try {
            $handler = PhotoUploadHandler::build(['host' => 'http://backend:8080']);

            $reflection = new \ReflectionClass($handler);
            $prop       = $reflection->getProperty('photosBasePath');
            $prop->setAccessible(true);
            $this->assertSame('/var/www/html/photos', $prop->getValue($handler));
        } finally {
            if ($originalDocumentRoot === null) {
                unset($_SERVER['DOCUMENT_ROOT']);
            } else {
                $_SERVER['DOCUMENT_ROOT'] = $originalDocumentRoot;
            }
        }
    }
}
