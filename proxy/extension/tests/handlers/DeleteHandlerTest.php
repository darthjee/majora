<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\RequestHandlers\DeleteHandler;

/**
 * Unit tests for DeleteHandler.
 *
 * Uses a temporary directory for photo storage to avoid touching the real
 * /var/www/html/photos volume during tests.
 */
class DeleteHandlerTest extends TestCase
{
    /** @var string Temporary directory used as the photos base path */
    private string $photosDir;

    protected function setUp(): void
    {
        $this->photosDir = sys_get_temp_dir() . '/test_delete_photos_' . uniqid();
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
     * Builds a DeleteHandler wired to the temporary photos directory.
     */
    private function makeHandler(HttpClientInterface $httpClient): DeleteHandler
    {
        return new DeleteHandler('http://backend:8080', $httpClient, $this->photosDir);
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
     * Builds the /games/:game_slug/(pcs|npcs)/:character_id/photos/:photo_id.json
     * path for the given segments.
     */
    private function deletePath(string $gameSlug, string $kind, string $characterId, string $photoId): string
    {
        return '/games/' . $gameSlug . '/' . $kind . '/' . $characterId . '/photos/' . $photoId . '.json';
    }

    /**
     * Builds a ProcessingRequest for a valid DELETE .../photos/:photo_id.json.
     */
    private function makeRequest(string $path, array $headers = []): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => $path,
            'requestMethod' => 'DELETE',
            'headers'       => $headers,
            'uploadedFiles' => [],
            'postFields'    => [],
        ]
        );
    }

    /**
     * Creates a file (with the containing directories) under the temporary
     * photos directory, at the given path relative to it.
     */
    private function makePhotoFile(string $relativePath, string $content = 'fake image bytes'): string
    {
        $fullPath = $this->photosDir . '/' . $relativePath;
        mkdir(dirname($fullPath), 0755, true);
        file_put_contents($fullPath, $content);
        return $fullPath;
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /**
     * Happy path: the deletable.json check returns 200 with a path, the file
     * on disk is removed, and the backend DELETE response (204) is forwarded
     * straight through. Both backend calls are made, in order.
     */
    public function testDeletableAndFilePresentDeletesFileAndForwardsBackendDelete(): void
    {
        $filePath = $this->makePhotoFile('42/photo.jpg');
        $this->assertFileExists($filePath);

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->deletePath('my-game', 'pcs', '42', '7'),
            ['Authorization' => 'Bearer tok']
        );

        $calls = [];
        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->willReturnCallback(function (string $method, string $url) use (&$calls) {
                $calls[] = [$method, $url];

                return count($calls) === 1
                    ? ['httpCode' => 200, 'body' => '{"deletable":true,"path":"42/photo.jpg"}', 'headers' => []]
                    : ['httpCode' => 204, 'body' => '', 'headers' => []];
            });

        $response = $handler->handleRequest($request);

        $this->assertSame(204, $response->httpCode());
        $this->assertFileDoesNotExist($filePath);
        $this->assertSame(
            [
                ['GET', 'http://backend:8080/games/my-game/pcs/42/photos/7/deletable.json'],
                ['DELETE', 'http://backend:8080/games/my-game/pcs/42/photos/7.json'],
            ],
            $calls
        );
    }

    /**
     * The deletable.json check returns 404 (photo not found): that response
     * is forwarded straight through, no DELETE call is made, and no file
     * deletion is attempted.
     */
    public function testNotFoundOnDeletableCheckForwardsFourOhFourAndSkipsDelete(): void
    {
        $filePath = $this->makePhotoFile('42/photo.jpg');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest($this->deletePath('my-game', 'pcs', '42', '7'));

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/games/my-game/pcs/42/photos/7/deletable.json',
                $this->anything()
            )
            ->willReturn(['httpCode' => 404, 'body' => 'Not Found', 'headers' => []]);

        $response = $handler->handleRequest($request);

        $this->assertSame(404, $response->httpCode());
        $this->assertSame('Not Found', $response->body());
        $this->assertFileExists($filePath);
    }

    /**
     * The deletable.json check returns 422 (photo not yet marked
     * not-ready): that response is forwarded straight through, no DELETE
     * call is made, and no file deletion is attempted.
     */
    public function testNotDeletableForwardsFourTwentyTwoAndSkipsDelete(): void
    {
        $filePath = $this->makePhotoFile('42/photo.jpg');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest($this->deletePath('my-game', 'npcs', '42', '7'));

        $httpClient->expects($this->once())
            ->method('request')
            ->with(
                'GET',
                'http://backend:8080/games/my-game/npcs/42/photos/7/deletable.json',
                $this->anything()
            )
            ->willReturn(['httpCode' => 422, 'body' => 'Unprocessable Entity', 'headers' => []]);

        $response = $handler->handleRequest($request);

        $this->assertSame(422, $response->httpCode());
        $this->assertSame('Unprocessable Entity', $response->body());
        $this->assertFileExists($filePath);
    }

    /**
     * The file the deletable.json response points at is already missing from
     * disk (e.g. a prior delete attempt was interrupted after the file was
     * removed but before the backend DELETE completed): deletion proceeds
     * without error, the backend DELETE call is still made, and its response
     * is forwarded straight through.
     */
    public function testFileAlreadyMissingStillProceedsToBackendDelete(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest($this->deletePath('my-game', 'pcs', '42', '7'));

        $calls = [];
        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->willReturnCallback(function (string $method, string $url) use (&$calls) {
                $calls[] = [$method, $url];

                return count($calls) === 1
                    ? ['httpCode' => 200, 'body' => '{"deletable":true,"path":"42/missing.jpg"}', 'headers' => []]
                    : ['httpCode' => 204, 'body' => '', 'headers' => []];
            });

        $response = $handler->handleRequest($request);

        $this->assertSame(204, $response->httpCode());
        $this->assertFileDoesNotExist($this->photosDir . '/42/missing.jpg');
        $this->assertSame(
            [
                ['GET', 'http://backend:8080/games/my-game/pcs/42/photos/7/deletable.json'],
                ['DELETE', 'http://backend:8080/games/my-game/pcs/42/photos/7.json'],
            ],
            $calls
        );
    }

    /**
     * Only allow-listed headers are forwarded to both backend calls, with
     * Host overridden to the backend's own host regardless of what the
     * client sent. Non-allow-listed headers (e.g. X-Trace-Id) are dropped.
     */
    public function testOnlyAllowListedHeadersAreForwardedToBackend(): void
    {
        $this->makePhotoFile('42/photo.jpg');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest(
            $this->deletePath('my-game', 'pcs', '42', '7'),
            [
                'Authorization'   => 'Bearer tok',
                'X-Trace-Id'      => 'trace-abc',
                'Cookie'          => 'session=abc',
                'X-Skip-Cache'    => '1',
                'Referer'         => 'http://client/photo',
                'Accept-Language' => 'en-US',
                'Accept'          => 'application/json',
            ]
        );

        $expectedHeaders = [
            'Authorization'   => 'Bearer tok',
            'Cookie'          => 'session=abc',
            'X-Skip-Cache'    => '1',
            'Referer'         => 'http://client/photo',
            'Accept-Language' => 'en-US',
            'Accept'          => 'application/json',
            'Host'            => 'backend',
        ];

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->with(
                $this->anything(),
                $this->anything(),
                $expectedHeaders
            )
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"deletable":true,"path":"42/photo.jpg"}', 'headers' => []],
                ['httpCode' => 204, 'body' => '', 'headers' => []]
            );

        $response = $handler->handleRequest($request);

        $this->assertSame(204, $response->httpCode());
    }

    /**
     * Invalid path (missing photo id segment): 400 is returned and no
     * backend call is made.
     */
    public function testInvalidPathReturnsBadRequest(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest('/games/my-game/pcs/42/photos/abc.json');

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(400, $response->httpCode());
    }

    /**
     * A 'kind' segment outside the pcs/npcs allow-list: 400 is returned and
     * no backend call is made.
     */
    public function testUnknownKindReturnsBadRequest(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $request = $this->makeRequest('/games/my-game/monsters/42/photos/7.json');

        $httpClient->expects($this->never())->method('request');

        $response = $handler->handleRequest($request);

        $this->assertSame(400, $response->httpCode());
    }

    /**
     * build() sets photosBasePath from the 'photos_path' configuration
     * parameter.
     */
    public function testBuildSetsPhotosBasePathFromParams(): void
    {
        $handler = DeleteHandler::build([
            'host'        => 'http://backend:8080',
            'photos_path' => $this->photosDir,
        ]
        );

        $reflection = new \ReflectionClass($handler);
        $prop       = $reflection->getProperty('photosBasePath');
        $prop->setAccessible(true);

        $this->assertSame($this->photosDir, $prop->getValue($handler));
    }
}
