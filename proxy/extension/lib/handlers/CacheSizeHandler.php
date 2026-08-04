<?php

namespace Tent\RequestHandlers;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;
use Tent\Http\CurlHttpClient;
use Tent\Http\HttpClientInterface;
use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Handles GET /staff/cache/size.json.
 *
 * Gates access behind the backend's admin/staff check, then reports the
 * total size (in bytes) of the proxy's on-disk cache folder:
 *   1. Calls GET .../users/status.json to check the caller is logged in and
 *      is staff or superuser (403 otherwise; a non-200 response from that
 *      call is forwarded to the client as-is).
 *   2. Recursively sums the size of every file under the configured cache
 *      path and returns it as {"size": <bytes>}.
 *
 * Deliberately has no SecurePhotoStorage-style path-traversal guard: this is
 * a read-only size check over a fixed, config-supplied path, never a path
 * derived from request input, so there is no traversal surface here. The
 * future "clear cache" handler (see the issue's "Future work" section), which
 * will delete files, is where that guard will actually matter.
 */
class CacheSizeHandler extends RequestHandler
{
    /** @var string Backend host URL (e.g. http://backend:8080) */
    private string $host;

    /** @var HttpClientInterface HTTP client used for backend calls */
    private HttpClientInterface $httpClient;

    /** @var string Path to the proxy's on-disk cache folder */
    private string $cachePath;

    /**
     * @param string                   $host       Backend host URL.
     * @param HttpClientInterface|null $httpClient HTTP client (defaults to CurlHttpClient).
     * @param string                   $cachePath  Path to the cache folder to measure.
     */
    public function __construct(
        string $host,
        ?HttpClientInterface $httpClient = null,
        string $cachePath = ''
    ) {
        $this->host = $host;
        $this->httpClient = ($httpClient ?? new CurlHttpClient());
        $this->cachePath = $cachePath;
    }

    /**
     * Builds a CacheSizeHandler from configuration parameters.
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
     * Processes the cache size request.
     *
     * 1. Calls GET .../users/status.json; forwards the backend response
     *    as-is when it isn't a 200.
     * 2. Rejects with 403 when the caller isn't logged in, or is logged in
     *    but is neither staff nor superuser.
     * 3. Otherwise, computes the cache folder's total size and returns it.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        try {
            $headers = ForwardedHeaderFilter::filter($request->headers());

            $this->requireStaffAccess($headers);

            $size = $this->cacheSize();
        } catch (BackendErrorException $e) {
            return new Response(['httpCode' => $e->httpCode(), 'body' => $e->body()]);
        }

        return new Response([
            'httpCode' => 200,
            'headers'  => ['Content-Type' => 'application/json'],
            'body'     => json_encode(['size' => $size]),
        ]);
    }

    /**
     * Calls the backend's users/status.json endpoint and ensures the caller
     * is logged in and is either staff or a superuser.
     *
     * @param array $headers Headers to forward to the backend.
     * @return void
     * @throws BackendErrorException When the backend call itself fails
     *                                (forwarded as-is), or the caller isn't
     *                                admin/staff (403).
     */
    private function requireStaffAccess(array $headers): void
    {
        $result = $this->httpClient->request('GET', $this->statusUrl(), $headers);

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $result['body']);
        }

        $body = json_decode($result['body'], true);

        $loggedIn    = (($body['logged_in'] ?? false) === true);
        $isStaff     = (($body['is_staff'] ?? false) === true);
        $isSuperuser = (($body['is_superuser'] ?? false) === true);

        if (!$loggedIn || (!$isStaff && !$isSuperuser)) {
            throw new BackendErrorException(403, '{"error":"Forbidden"}');
        }
    }

    /**
     * Builds the GET .../users/status.json backend URL.
     *
     * @return string
     */
    private function statusUrl(): string
    {
        return $this->host . '/users/status.json';
    }

    /**
     * Recursively sums the size (in bytes) of every file under $cachePath.
     *
     * @return int Total size in bytes; 0 when the folder doesn't exist or is
     *              empty.
     */
    private function cacheSize(): int
    {
        if (!is_dir($this->cachePath)) {
            return 0;
        }

        $size = 0;
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->cachePath, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }
}
