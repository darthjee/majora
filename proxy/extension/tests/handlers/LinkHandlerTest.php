<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\Models\Response;
use Tent\RequestHandlers\LinkHandler;

/**
 * Unit tests for LinkHandler (issue #1570).
 *
 * Uses a temporary base directory (with photos/ and files/ type roots) and a
 * temporary cache root, plus a fake backend that answers per call kind and
 * records every request.
 */
class LinkHandlerTest extends TestCase
{
    /** @var string Temporary directory holding everything. */
    private string $tmpDir;

    /** @var string Shared base path (photos_path / files_path). */
    private string $baseDir;

    /** @var string Cache root. */
    private string $cacheDir;

    /** @var array[] Recorded backend calls: [method, url, body]. */
    private array $calls = [];

    /** @var array<string, array> Backend responses keyed by call kind. */
    private array $responses = [];

    protected function setUp(): void
    {
        $this->tmpDir   = sys_get_temp_dir() . '/test_link_handler_' . uniqid();
        $this->baseDir  = $this->tmpDir . '/base';
        $this->cacheDir = $this->tmpDir . '/cache';
        mkdir($this->baseDir . '/photos', 0755, true);
        mkdir($this->baseDir . '/files', 0755, true);
        mkdir($this->cacheDir, 0755, true);

        $this->calls     = [];
        $this->responses = [
            'status'    => self::ok('{"logged_in":true,"is_staff":true,"is_superuser":false}'),
            'uploading' => self::ok('{"file_path":"photos/9/a.jpg","source_path":"photos/3/a.jpg"}'),
            'uploaded'  => self::ok('{}'),
            'failed'    => self::ok('{}'),
        ];
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->tmpDir);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static function ok(string $body, array $headers = []): array
    {
        return ['httpCode' => 200, 'body' => $body, 'headers' => $headers];
    }

    private function removeDir(string $dir): void
    {
        if (is_link($dir)) {
            unlink($dir);
            return;
        }
        if (!is_dir($dir)) {
            return;
        }
        chmod($dir, 0755);
        foreach (scandir($dir) as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $path = $dir . '/' . $entry;
            (is_dir($path) && !is_link($path)) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }

    private function makeHandler(): LinkHandler
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->method('request')->willReturnCallback(
            function (string $method, string $url, array $headers = [], ?string $body = null): array {
                $body = (string) $body;
                $this->calls[] = [$method, $url, $body];

                if ($method === 'GET') {
                    return $this->responses['status'];
                }

                $status = (json_decode($body, true)['status'] ?? '');
                return $this->responses[$status];
            }
        );

        return new LinkHandler('http://backend:8080', $httpClient, $this->baseDir, $this->baseDir, $this->cacheDir);
    }

    private function request(string $path = '/uploads/link/image/42/submit'): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => $path,
            'requestMethod' => 'POST',
            'headers'       => ['X-Upload-Token' => 'up-tok', 'Cookie' => 'sessionid=abc'],
            'query'         => '',
            'body'          => '',
            'uploadedFiles' => [],
            'postFields'    => [],
        ]);
    }

    private function handle(string $path = '/uploads/link/image/42/submit'): Response
    {
        return $this->makeHandler()->handleRequest($this->request($path));
    }

    /** Writes a source file under the base dir and returns its absolute path. */
    private function makeSource(string $relative = 'photos/3/a.jpg', string $content = 'jpeg'): string
    {
        $path = $this->baseDir . '/' . $relative;
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        file_put_contents($path, $content);
        return $path;
    }

    private function linkStart(string $filePath, string $sourcePath): void
    {
        $this->responses['uploading'] = self::ok(
            json_encode(['file_path' => $filePath, 'source_path' => $sourcePath])
        );
    }

    /** @return string[] The statuses PATCHed to the backend, in order. */
    private function patchedStatuses(): array
    {
        $statuses = [];
        foreach ($this->calls as [$method, , $body]) {
            if ($method === 'PATCH') {
                $statuses[] = json_decode($body, true)['status'];
            }
        }
        return $statuses;
    }

    /** @return array|null Decoded body of the failed PATCH, if any. */
    private function failedPatchBody(): ?array
    {
        foreach ($this->calls as [$method, , $body]) {
            $decoded = json_decode($body, true);
            if ($method === 'PATCH' && ($decoded['status'] ?? '') === 'failed') {
                return $decoded;
            }
        }
        return null;
    }

    private function assertNoLeak(Response $response): void
    {
        $this->assertStringNotContainsString('photos/', $response->body());
        $this->assertStringNotContainsString('files/', $response->body());
        $this->assertStringNotContainsString('file_path', $response->body());
        $this->assertStringNotContainsString('source_path', $response->body());
        $this->assertStringNotContainsString($this->baseDir, $response->body());
        foreach ($response->headers() as $line) {
            $this->assertStringStartsNotWith('x-cache-clear', strtolower($line));
        }
    }

    private function assertFailed(Response $response, string $error): void
    {
        $this->assertSame(422, $response->httpCode());
        $this->assertSame(['status' => 'failed', 'error' => $error], json_decode($response->body(), true));
        $this->assertSame(['uploading', 'failed'], $this->patchedStatuses());
        $this->assertSame(['status' => 'failed', 'error' => $error], $this->failedPatchBody());
        $this->assertNoLeak($response);
    }

    private function assertUploaded(Response $response): void
    {
        $this->assertSame(200, $response->httpCode());
        $this->assertSame(['status' => 'uploaded'], json_decode($response->body(), true));
        $this->assertSame(['uploading', 'uploaded'], $this->patchedStatuses());
        $this->assertNoLeak($response);
    }

    // -------------------------------------------------------------------------
    // Routing / staff guard / backend relay
    // -------------------------------------------------------------------------

    public function testInvalidPathIsBadRequest(): void
    {
        $response = $this->handle('/uploads/link/video/42/submit');

        $this->assertSame(400, $response->httpCode());
        $this->assertSame([], $this->calls);
    }

    public function testNonStaffGetsForbiddenAndNoPatchIsSent(): void
    {
        $this->responses['status'] = self::ok('{"logged_in":true,"is_staff":false,"is_superuser":false}');

        $response = $this->handle();

        $this->assertSame(403, $response->httpCode());
        $this->assertSame([], $this->patchedStatuses());
    }

    public function testStaffCheckBackendErrorIsRelayed(): void
    {
        $this->responses['status'] = ['httpCode' => 401, 'body' => 'Unauthorized', 'headers' => []];

        $response = $this->handle();

        $this->assertSame(401, $response->httpCode());
        $this->assertSame([], $this->patchedStatuses());
    }

    /**
     * @dataProvider relayedCodes
     */
    public function testLinkStartBackendErrorIsRelayed(int $code): void
    {
        $this->responses['uploading'] = ['httpCode' => $code, 'body' => '{"detail":"x"}', 'headers' => []];

        $response = $this->handle();

        $this->assertSame($code, $response->httpCode());
        $this->assertSame('{"detail":"x"}', $response->body());
        $this->assertSame(['uploading'], $this->patchedStatuses());
    }

    public static function relayedCodes(): array
    {
        return ['forbidden' => [403], 'not found' => [404]];
    }

    // -------------------------------------------------------------------------
    // Success / idempotent retry
    // -------------------------------------------------------------------------

    public function testSuccessCreatesHardLinkAndFinalizes(): void
    {
        $source = $this->makeSource();

        $response = $this->handle();

        $target = $this->baseDir . '/photos/9/a.jpg';
        $this->assertUploaded($response);
        $this->assertFileExists($target);
        $this->assertFalse(is_link($target));
        $this->assertSame(fileinode($source), fileinode($target));
        $this->assertSame(2, stat($source)['nlink']);
    }

    public function testFileTypeUsesFilesRoot(): void
    {
        $source = $this->makeSource('files/3/doc.pdf');
        $this->linkStart('files/9/doc.pdf', 'files/3/doc.pdf');

        $response = $this->handle('/uploads/link/file/7/submit');

        $this->assertUploaded($response);
        $this->assertSame(fileinode($source), fileinode($this->baseDir . '/files/9/doc.pdf'));
        $this->assertStringEndsWith('/uploads/file/7.json', $this->calls[1][1]);
    }

    public function testSameInodeRetrySkipsLinkAndFinalizes(): void
    {
        $source = $this->makeSource();
        mkdir($this->baseDir . '/photos/9', 0755, true);
        link($source, $this->baseDir . '/photos/9/a.jpg');

        $response = $this->handle();

        $this->assertUploaded($response);
        $this->assertSame(2, stat($source)['nlink']);
    }

    public function testFinalizeClearsCacheAcrossDomains(): void
    {
        $this->makeSource();
        $domain = $this->cacheDir . '/domain_' . hash('sha256', 'a.example');
        foreach ([$this->cacheDir, $domain] as $folder) {
            mkdir($folder . '/games/foo.json/GET', 0755, true);
            mkdir($folder . '/games/bar.json/GET', 0755, true);
        }
        $this->responses['uploaded'] = self::ok('{}', ['X-Cache-Clear: /games/foo.json']);

        $response = $this->handle();

        $this->assertUploaded($response);
        $this->assertDirectoryDoesNotExist($this->cacheDir . '/games/foo.json/GET');
        $this->assertDirectoryDoesNotExist($domain . '/games/foo.json/GET');
        $this->assertDirectoryExists($this->cacheDir . '/games/bar.json/GET');
        $this->assertDirectoryExists($domain . '/games/bar.json/GET');
    }

    public function testFinalizeNotFoundIsRelayedAndLinkKept(): void
    {
        $this->makeSource();
        $this->responses['uploaded'] = ['httpCode' => 404, 'body' => '{"detail":"Not found"}', 'headers' => []];

        $response = $this->handle();

        $this->assertSame(404, $response->httpCode());
        $this->assertSame('{"detail":"Not found"}', $response->body());
        $this->assertFileExists($this->baseDir . '/photos/9/a.jpg');
    }

    // -------------------------------------------------------------------------
    // Failures
    // -------------------------------------------------------------------------

    /**
     * @dataProvider rejectedPaths
     */
    public function testRejectedPathsArePathRejected(string $filePath, string $sourcePath): void
    {
        $this->makeSource();
        $this->makeSource('files/3/a.jpg');
        $this->linkStart($filePath, $sourcePath);

        $this->assertFailed($this->handle(), 'path_rejected');
        $this->assertFileDoesNotExist($this->tmpDir . '/a.jpg');
    }

    public static function rejectedPaths(): array
    {
        return [
            'source wrong prefix'  => ['photos/9/a.jpg', 'files/3/a.jpg'],
            'target wrong prefix'  => ['files/9/a.jpg', 'photos/3/a.jpg'],
            'source no prefix'     => ['photos/9/a.jpg', '3/a.jpg'],
            'target absolute'      => ['/photos/9/a.jpg', 'photos/3/a.jpg'],
            'target traversal'     => ['photos/../../a.jpg', 'photos/3/a.jpg'],
            'source traversal'     => ['photos/9/a.jpg', 'photos/../photos/3/a.jpg'],
            'target dot segment'   => ['photos/./9/a.jpg', 'photos/3/a.jpg'],
            'target empty segment' => ['photos//9/a.jpg', 'photos/3/a.jpg'],
        ];
    }

    public function testMissingSourceIsSourceMissing(): void
    {
        $this->assertFailed($this->handle(), 'source_missing');
    }

    public function testSymlinkedSourceIsPathRejected(): void
    {
        $real = $this->makeSource('photos/3/real.jpg');
        symlink($real, $this->baseDir . '/photos/3/a.jpg');

        $this->assertFailed($this->handle(), 'path_rejected');
        $this->assertFileDoesNotExist($this->baseDir . '/photos/9/a.jpg');
    }

    public function testDirectorySourceIsPathRejected(): void
    {
        mkdir($this->baseDir . '/photos/3/a.jpg', 0755, true);

        $this->assertFailed($this->handle(), 'path_rejected');
    }

    public function testSourceEscapingViaSymlinkedDirIsPathRejected(): void
    {
        mkdir($this->tmpDir . '/outside', 0755, true);
        file_put_contents($this->tmpDir . '/outside/a.jpg', 'secret');
        symlink($this->tmpDir . '/outside', $this->baseDir . '/photos/3');

        $this->assertFailed($this->handle(), 'path_rejected');
        $this->assertFileDoesNotExist($this->baseDir . '/photos/9/a.jpg');
    }

    public function testTargetEscapingViaSymlinkedDirIsPathRejected(): void
    {
        $this->makeSource();
        mkdir($this->tmpDir . '/outside', 0755, true);
        symlink($this->tmpDir . '/outside', $this->baseDir . '/photos/9');

        $this->assertFailed($this->handle(), 'path_rejected');
        $this->assertFileDoesNotExist($this->tmpDir . '/outside/a.jpg');
    }

    public function testDifferentExistingTargetIsTargetExists(): void
    {
        $this->makeSource();
        $other = $this->makeSource('photos/9/a.jpg', 'other');

        $this->assertFailed($this->handle(), 'target_exists');
        $this->assertSame('other', file_get_contents($other));
    }

    public function testSymlinkTargetIsTargetExists(): void
    {
        $source = $this->makeSource();
        mkdir($this->baseDir . '/photos/9', 0755, true);
        symlink($source, $this->baseDir . '/photos/9/a.jpg');

        $this->assertFailed($this->handle(), 'target_exists');
        $this->assertTrue(is_link($this->baseDir . '/photos/9/a.jpg'));
    }

    public function testUnwritableTargetDirectoryIsPermission(): void
    {
        $this->makeSource();
        mkdir($this->baseDir . '/photos/9', 0555, true);
        if (is_writable($this->baseDir . '/photos/9')) {
            $this->markTestSkipped('Running with permissions that ignore directory modes.');
        }

        $this->assertFailed($this->handle(), 'permission');
    }

    public function testUncreatableTargetDirectoryIsPermission(): void
    {
        $this->makeSource();
        chmod($this->baseDir . '/photos', 0555);
        if (is_writable($this->baseDir . '/photos')) {
            $this->markTestSkipped('Running with permissions that ignore directory modes.');
        }

        $this->assertFailed($this->handle(), 'permission');
    }

    public function testFailedPatchErrorStillAnswersUnprocessable(): void
    {
        $this->responses['failed'] = ['httpCode' => 500, 'body' => 'boom', 'headers' => []];

        $this->assertFailed($this->handle(), 'source_missing');
    }

    /**
     * @dataProvider linkFailureMessages
     */
    public function testLinkFailureMessagesMapToCodes(string $message, string $code): void
    {
        $method = new ReflectionMethod(LinkHandler::class, 'errorCodeForLinkFailure');
        $method->setAccessible(true);

        $this->assertSame($code, $method->invoke(null, $message));
    }

    public static function linkFailureMessages(): array
    {
        return [
            'cross device'  => ['link(): Invalid cross-device link', 'cross_device'],
            'permission'    => ['link(): Permission denied', 'permission'],
            'not permitted' => ['link(): Operation not permitted', 'permission'],
            'exists'        => ['link(): File exists', 'target_exists'],
            'other'         => ['link(): No space left on device', 'unknown'],
            'empty'         => ['', 'unknown'],
        ];
    }

    public function testBuildReadsParams(): void
    {
        $handler = LinkHandler::build([
            'host'        => 'http://backend:8080',
            'photos_path' => $this->baseDir,
            'files_path'  => $this->baseDir,
            'cache_path'  => $this->cacheDir,
        ]);

        $this->assertInstanceOf(LinkHandler::class, $handler);
    }
}
