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
     * Creates a cache entry for GET $path under $cacheDir (Tent's
     * <cache>/<path>/GET/<hash>.body.dat layout) and returns its GET/ dir.
     */
    private function makeCacheEntry(string $cacheDir, string $path): string
    {
        $dir = $cacheDir . $path . '/GET';
        mkdir($dir, 0755, true);
        file_put_contents($dir . '/abc.body.dat', '{}');
        return $dir;
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
     * A trailing slash on the configured 'host' never produces a double
     * slash at the host/path boundary of either backend URL.
     */
    public function testTrailingSlashOnHostDoesNotProduceDoubleSlash(): void
    {
        $filePath = $this->makePhotoFile('42/photo.jpg');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new DeleteHandler('http://backend:8080/', $httpClient, $this->photosDir);

        $request = $this->makeRequest($this->deletePath('my-game', 'pcs', '42', '7'));

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
            'Accept-Encoding' => 'gzip',
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

    // -------------------------------------------------------------------------
    // X-Cache-Clear (issue #1469)
    // -------------------------------------------------------------------------

    /**
     * A successful backend DELETE carrying X-Cache-Clear clears the listed
     * paths from the cache folder; the header is stripped from the response
     * forwarded to the client while other backend headers pass through.
     */
    public function testDeleteXCacheClearClearsPathsAndIsStripped(): void
    {
        $this->makePhotoFile('42/photo.jpg');
        $cacheDir   = $this->photosDir . '/cache';
        $collection = $this->makeCacheEntry($cacheDir, '/games/my-game/pcs.json');
        $entity     = $this->makeCacheEntry($cacheDir, '/games/my-game/pcs/42.json');
        $untouched  = $this->makeCacheEntry($cacheDir, '/games/my-game/npcs.json');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new DeleteHandler('http://backend:8080', $httpClient, $this->photosDir, $cacheDir);

        $request = $this->makeRequest($this->deletePath('my-game', 'pcs', '42', '7'));

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"deletable":true,"path":"42/photo.jpg"}', 'headers' => []],
                [
                    'httpCode' => 204,
                    'body'     => '',
                    'headers'  => [
                        'X-Request-Id: 1',
                        'x-cache-clear: /games/my-game/pcs.json, /games/my-game/pcs/42.json',
                    ],
                ]
            );

        $response = $handler->handleRequest($request);

        $this->assertSame(204, $response->httpCode());
        $this->assertSame(['X-Request-Id: 1'], $response->headers());
        $this->assertDirectoryDoesNotExist($collection);
        $this->assertDirectoryDoesNotExist($entity);
        $this->assertDirectoryExists($untouched);
    }

    /**
     * A failed backend DELETE never clears anything, and the header is still
     * stripped from the forwarded response.
     */
    public function testFailedDeleteDoesNotClearCache(): void
    {
        $this->makePhotoFile('42/photo.jpg');
        $cacheDir = $this->photosDir . '/cache';
        $entry    = $this->makeCacheEntry($cacheDir, '/games/my-game/pcs.json');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new DeleteHandler('http://backend:8080', $httpClient, $this->photosDir, $cacheDir);

        $request = $this->makeRequest($this->deletePath('my-game', 'pcs', '42', '7'));

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"deletable":true,"path":"42/photo.jpg"}', 'headers' => []],
                ['httpCode' => 422, 'body' => 'Nope', 'headers' => ['X-Cache-Clear: /games/my-game/pcs.json']]
            );

        $response = $handler->handleRequest($request);

        $this->assertSame(422, $response->httpCode());
        $this->assertSame([], $response->headers());
        $this->assertDirectoryExists($entry);
    }

    /**
     * A client-supplied X-Cache-Clear request header is neither forwarded to
     * the backend nor acted upon.
     */
    public function testClientSuppliedXCacheClearIsIgnored(): void
    {
        $this->makePhotoFile('42/photo.jpg');
        $cacheDir = $this->photosDir . '/cache';
        $entry    = $this->makeCacheEntry($cacheDir, '/games/my-game/pcs.json');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new DeleteHandler('http://backend:8080', $httpClient, $this->photosDir, $cacheDir);

        $request = $this->makeRequest(
            $this->deletePath('my-game', 'pcs', '42', '7'),
            ['X-Cache-Clear' => '/games/my-game/pcs.json']
        );

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->with(
                $this->anything(),
                $this->anything(),
                $this->callback(fn (array $headers): bool => !array_key_exists('X-Cache-Clear', $headers))
            )
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"deletable":true,"path":"42/photo.jpg"}', 'headers' => []],
                ['httpCode' => 204, 'body' => '', 'headers' => []]
            );

        $response = $handler->handleRequest($request);

        $this->assertSame(204, $response->httpCode());
        $this->assertDirectoryExists($entry);
    }

    // -------------------------------------------------------------------------
    // Staff photos (issue #1472)
    // -------------------------------------------------------------------------

    /**
     * Staff path: deletable 200 → file deleted, DELETE forwarded to the
     * same path, 204 relayed, X-Cache-Clear cleared and stripped.
     */
    public function testStaffDeleteDeletesFileAndForwardsBackendDelete(): void
    {
        $filePath = $this->makePhotoFile('photos/staff/3/photo.jpg');
        $cacheDir = $this->photosDir . '/cache';
        $listed   = $this->makeCacheEntry($cacheDir, '/staff/photos.json');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new DeleteHandler('http://backend:8080', $httpClient, $this->photosDir, $cacheDir);

        $calls = [];
        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->willReturnCallback(function (string $method, string $url) use (&$calls) {
                $calls[] = [$method, $url];

                return count($calls) === 1
                    ? [
                        'httpCode' => 200,
                        'body'     => '{"deletable":true,"path":"photos/staff/3/photo.jpg"}',
                        'headers'  => [],
                    ]
                    : ['httpCode' => 204, 'body' => '', 'headers' => ['X-Cache-Clear: /staff/photos.json']];
            });

        $response = $handler->handleRequest($this->makeRequest('/staff/photos/main/3.json'));

        $this->assertSame(204, $response->httpCode());
        $this->assertSame([], $response->headers());
        $this->assertFileDoesNotExist($filePath);
        $this->assertDirectoryDoesNotExist($listed);
        $this->assertSame(
            [
                ['GET', 'http://backend:8080/staff/photos/main/3/deletable.json'],
                ['DELETE', 'http://backend:8080/staff/photos/main/3.json'],
            ],
            $calls
        );
    }

    /**
     * @return array<string, array{int}>
     */
    public static function staffDeletableErrorCodes(): array
    {
        return ['401' => [401], '403' => [403], '404' => [404], '422' => [422]];
    }

    /**
     * Staff path: a non-200 deletable.json response is forwarded as-is, no
     * file is deleted and no DELETE is sent.
     *
     * @dataProvider staffDeletableErrorCodes
     */
    public function testStaffDeletableErrorIsForwardedAndNothingDeleted(int $code): void
    {
        $filePath = $this->makePhotoFile('photos/staff/3/photo.jpg');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $httpClient->expects($this->once())
            ->method('request')
            ->with('GET', 'http://backend:8080/staff/photos/main/3/deletable.json')
            ->willReturn(['httpCode' => $code, 'body' => '{"detail":"nope"}', 'headers' => []]);

        $response = $handler->handleRequest($this->makeRequest('/staff/photos/main/3.json'));

        $this->assertSame($code, $response->httpCode());
        $this->assertSame('{"detail":"nope"}', $response->body());
        $this->assertFileExists($filePath);
    }

    /**
     * Staff path: a file already missing on disk still proceeds to the
     * backend DELETE.
     */
    public function testStaffFileAlreadyMissingStillProceedsToBackendDelete(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = $this->makeHandler($httpClient);

        $httpClient->expects($this->exactly(2))
            ->method('request')
            ->willReturnOnConsecutiveCalls(
                ['httpCode' => 200, 'body' => '{"deletable":true,"path":"photos/staff/3/gone.jpg"}', 'headers' => []],
                ['httpCode' => 204, 'body' => '', 'headers' => []]
            );

        $response = $handler->handleRequest($this->makeRequest('/staff/photos/main/3.json'));

        $this->assertSame(204, $response->httpCode());
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidStaffPaths(): array
    {
        return [
            'dot-dot type'     => ['/staff/photos/../3.json'],
            'nested type'      => ['/staff/photos/main/x/3.json'],
            'uppercase type'   => ['/staff/photos/Main/3.json'],
            'non-numeric id'   => ['/staff/photos/main/abc.json'],
            'missing type'     => ['/staff/photos/3.json'],
            'deletable suffix' => ['/staff/photos/main/3/deletable.json'],
        ];
    }

    /**
     * Staff path with an invalid shape → 400 without any backend call.
     *
     * @dataProvider invalidStaffPaths
     */
    public function testInvalidStaffPathReturnsBadRequest(string $path): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->expects($this->never())->method('request');
        $handler = $this->makeHandler($httpClient);

        $response = $handler->handleRequest($this->makeRequest($path));

        $this->assertSame(400, $response->httpCode());
    }
}
