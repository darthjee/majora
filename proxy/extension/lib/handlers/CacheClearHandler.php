<?php

namespace Tent\RequestHandlers;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;
use Tent\Http\HttpClientInterface;
use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Handles DELETE /staff/cache/disk.json.
 *
 * Gates access behind the backend's admin/staff check (via
 * StaffAccessGuard, shared with CacheSizeHandler), then clears the proxy's
 * on-disk cache folder:
 *   1. Calls GET .../users/status.json to check the caller is logged in and
 *      is staff or superuser (403 otherwise; a non-200 response from that
 *      call is forwarded to the client as-is).
 *   2. Recursively deletes every file under the configured cache path,
 *      leaving the cache folder itself (and its subdirectory structure) in
 *      place, then returns 204 No Content.
 *
 * Deliberately has no SecurePhotoStorage-style path-traversal guard: this
 * deletes files under a fixed, config-supplied path, never a path derived
 * from request input, so there is no traversal surface here (same reasoning
 * already documented on CacheSizeHandler).
 */
class CacheClearHandler extends RequestHandler
{
    /** @var BackendClient Client used for backend calls. */
    private BackendClient $client;

    /** @var string Path to the proxy's on-disk cache folder */
    private string $cachePath;

    /**
     * @param string                   $host       Backend host URL.
     * @param HttpClientInterface|null $httpClient HTTP client (defaults to CurlHttpClient).
     * @param string                   $cachePath  Path to the cache folder to clear.
     */
    public function __construct(
        string $host,
        ?HttpClientInterface $httpClient=null,
        string $cachePath=''
    ) {
        $this->client = new BackendClient($host, $httpClient);
        $this->cachePath = $cachePath;
    }

    /**
     * Builds a CacheClearHandler from configuration parameters.
     *
     * @param array $params Must contain 'host' (string) and 'cache_path' (string).
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            ($params['host'] ?? ''),
            null,
            ($params['cache_path'] ?? '')
        );
    }

    /**
     * Processes the cache clear request.
     *
     * 1. Calls GET .../users/status.json; forwards the backend response
     *    as-is when it isn't a 200.
     * 2. Rejects with 403 when the caller isn't logged in, or is logged in
     *    but is neither staff nor superuser.
     * 3. Otherwise, deletes every file under the configured cache path and
     *    returns 204 No Content.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        try {
            StaffAccessGuard::requireStaffAccess($this->client, $request->headers());
        } catch (BackendErrorException $e) {
            return new Response(['httpCode' => $e->httpCode(), 'body' => $e->body()]);
        }

        $this->clearCacheContents();

        return new Response(['httpCode' => 204]);
    }

    /**
     * Recursively deletes every file under the configured cache path,
     * leaving the folder itself (and its subdirectory structure) in place.
     *
     * A missing cache folder is treated as a no-op: there's nothing to
     * clear (same precedent as PhpWalkDirectorySizeStrategy::sizeOf()).
     *
     * @return void
     */
    private function clearCacheContents(): void
    {
        if (!is_dir($this->cachePath)) {
            return;
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->cachePath, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        // @var SplFileInfo $entry
        foreach ($iterator as $entry) {
            $path = $entry->getPathname();

            if ($entry->isDir()) {
                rmdir($path);
            } else {
                unlink($path);
            }
        }
    }
}
