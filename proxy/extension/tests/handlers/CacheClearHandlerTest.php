<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\Http\HttpClientInterface;
use Tent\Models\ProcessingRequest;
use Tent\RequestHandlers\CacheClearHandler;

/**
 * Unit tests for CacheClearHandler.
 *
 * Covers staff-gating/response shaping at the HTTP layer, plus the actual
 * on-disk delete behavior (real filesystem fixtures under a temp
 * directory), since — unlike CacheSizeHandler's DirectorySizeCalculator —
 * this handler doesn't delegate its filesystem work to a fakeable
 * collaborator.
 */
class CacheClearHandlerTest extends TestCase
{
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function makeRequest(array $headers = []): ProcessingRequest
    {
        return new ProcessingRequest([
            'requestPath'   => '/staff/cache/disk.json',
            'requestMethod' => 'DELETE',
            'headers'       => $headers,
            'uploadedFiles' => [],
            'postFields'    => [],
        ]
        );
    }

    private function statusBody(bool $loggedIn, bool $isStaff = false, bool $isSuperuser = false): string
    {
        return json_encode([
            'logged_in'    => $loggedIn,
            'is_staff'     => $isStaff,
            'is_superuser' => $isSuperuser,
        ]);
    }

    private function removeDir(string $dir): void
    {
        if (!is_dir($dir) && !is_link($dir)) {
            return;
        }
        foreach (scandir($dir) as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $path = $dir . '/' . $entry;
            (is_dir($path) && !is_link($path)) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /**
     * A staff user (is_staff: true) gets a 204 with no body, and the cache
     * folder's contents are removed while the folder itself survives.
     */
    public function testStaffUserClearsCacheAndGets204(): void
    {
        $cachePath = sys_get_temp_dir() . '/cache_clear_handler_test_' . uniqid();
        mkdir($cachePath . '/nested', 0755, true);
        file_put_contents($cachePath . '/top.txt', 'x');
        file_put_contents($cachePath . '/nested/inner.txt', 'y');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new CacheClearHandler('http://backend:8080', $httpClient, $cachePath);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->with('GET', 'http://backend:8080/users/status.json', $this->anything())
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(204, $response->httpCode());
        $this->assertSame('', $response->body());
        $this->assertTrue(is_dir($cachePath), 'cache folder itself should survive');
        $this->assertFalse(is_file($cachePath . '/top.txt'));
        $this->assertFalse(is_dir($cachePath . '/nested'), 'now-empty subdirectories should be removed');

        $this->removeDir($cachePath);
    }

    /**
     * A superuser (is_superuser: true, is_staff: false) also gets a 204:
     * either flag alone is sufficient.
     */
    public function testSuperuserAloneClearsCacheAndGets204(): void
    {
        $cachePath = sys_get_temp_dir() . '/cache_clear_handler_test_' . uniqid();
        mkdir($cachePath, 0755, true);
        file_put_contents($cachePath . '/top.txt', 'x');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new CacheClearHandler('http://backend:8080', $httpClient, $cachePath);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, false, true),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(204, $response->httpCode());
        $this->assertFalse(is_file($cachePath . '/top.txt'));

        $this->removeDir($cachePath);
    }

    /**
     * A missing cache folder is a no-op 204, not an error.
     */
    public function testMissingCacheFolderIsNoOp204(): void
    {
        $cachePath = sys_get_temp_dir() . '/cache_clear_handler_test_missing_' . uniqid();

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new CacheClearHandler('http://backend:8080', $httpClient, $cachePath);

        $request = $this->makeRequest(['Authorization' => 'Bearer tok']);

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, true, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(204, $response->httpCode());
        $this->assertFalse(is_dir($cachePath));
    }

    /**
     * Not logged in: 403, and nothing under the cache path is touched.
     */
    public function testNotLoggedInReturnsForbiddenAndLeavesCacheUntouched(): void
    {
        $cachePath = sys_get_temp_dir() . '/cache_clear_handler_test_' . uniqid();
        mkdir($cachePath, 0755, true);
        file_put_contents($cachePath . '/top.txt', 'x');

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new CacheClearHandler('http://backend:8080', $httpClient, $cachePath);

        $request = $this->makeRequest();

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(false, true, true),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(403, $response->httpCode());
        $this->assertTrue(is_file($cachePath . '/top.txt'));

        $this->removeDir($cachePath);
    }

    /**
     * Logged in, but neither staff nor superuser: 403.
     */
    public function testLoggedInWithoutStaffOrSuperuserReturnsForbidden(): void
    {
        $cachePath = sys_get_temp_dir() . '/cache_clear_handler_test_' . uniqid();

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new CacheClearHandler('http://backend:8080', $httpClient, $cachePath);

        $request = $this->makeRequest();

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 200,
                'body'     => $this->statusBody(true, false, false),
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(403, $response->httpCode());
    }

    /**
     * A non-200 response from /users/status.json (e.g. a backend 500) is
     * propagated as-is, not collapsed to 403.
     */
    public function testUpstreamFailureIsPropagatedAsIs(): void
    {
        $cachePath = sys_get_temp_dir() . '/cache_clear_handler_test_' . uniqid();

        $httpClient = $this->createMock(HttpClientInterface::class);
        $handler    = new CacheClearHandler('http://backend:8080', $httpClient, $cachePath);

        $request = $this->makeRequest();

        $httpClient->expects($this->once())
            ->method('request')
            ->willReturn([
                'httpCode' => 500,
                'body'     => 'Internal Server Error',
                'headers'  => [],
            ]);

        $response = $handler->handleRequest($request);

        $this->assertSame(500, $response->httpCode());
        $this->assertSame('Internal Server Error', $response->body());
    }

    /**
     * build() sets cachePath from the 'cache_path' configuration parameter.
     */
    public function testBuildSetsCachePathFromParams(): void
    {
        $handler = CacheClearHandler::build([
            'host'       => 'http://backend:8080',
            'cache_path' => '/some/cache/path',
        ]
        );

        $reflection = new \ReflectionClass($handler);
        $prop       = $reflection->getProperty('cachePath');
        $prop->setAccessible(true);

        $this->assertSame('/some/cache/path', $prop->getValue($handler));
    }
}
