<?php

namespace Tent\RequestHandlers;

use Tent\Http\HttpClientInterface;
use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Handles GET /staff/cache/size.json.
 *
 * Gates access behind the backend's admin/staff check (delegated to
 * StaffAccessGuard, shared with CacheClearHandler), then reports the total
 * size (in bytes) of the proxy's on-disk cache folder:
 *   1. Calls GET .../users/status.json to check the caller is logged in and
 *      is staff or superuser (403 otherwise; a non-200 response from that
 *      call is forwarded to the client as-is).
 *   2. Computes the total size of the configured cache path (via
 *      DirectorySizeCalculator) and returns it as {"size": <bytes>}.
 *
 * Deliberately has no SecurePhotoStorage-style path-traversal guard: this is
 * a read-only size check over a fixed, config-supplied path, never a path
 * derived from request input, so there is no traversal surface here. The
 * same reasoning applies to CacheClearHandler, which deletes files under
 * that same fixed, config-supplied path.
 */
class CacheSizeHandler extends RequestHandler
{
    /** @var BackendClient Client used for backend calls. */
    private BackendClient $client;

    /** @var string Path to the proxy's on-disk cache folder */
    private string $cachePath;

    /** @var DirectorySizeCalculator Calculator used to size the cache folder. */
    private DirectorySizeCalculator $calculator;

    /**
     * @param string                        $host          Backend host URL.
     * @param HttpClientInterface|null      $httpClient    HTTP client (defaults to
     *                                                       CurlHttpClient).
     * @param string                        $cachePath     Path to the cache folder to measure.
     * @param string                        $cacheSizeTool Directory-size tool identifier used
     *                                                       to build the default calculator
     *                                                       (e.g. 'du', 'php_walk'); ignored
     *                                                       when $calculator is given.
     * @param DirectorySizeCalculator|null  $calculator    Calculator used to size the cache
     *                                                       folder (defaults to one built from
     *                                                       $cacheSizeTool).
     */
    public function __construct(
        string $host,
        ?HttpClientInterface $httpClient=null,
        string $cachePath='',
        string $cacheSizeTool='php_walk',
        ?DirectorySizeCalculator $calculator=null
    ) {
        $this->client = new BackendClient($host, $httpClient);
        $this->cachePath = $cachePath;
        $this->calculator = ($calculator ?? new DirectorySizeCalculator($cacheSizeTool));
    }

    /**
     * Builds a CacheSizeHandler from configuration parameters.
     *
     * @param array $params Must contain 'host' (string) and 'cache_path' (string); optionally
     *                        'cache_size_tool' (string, defaults to 'php_walk').
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            ($params['host'] ?? ''),
            null,
            ($params['cache_path'] ?? ''),
            ($params['cache_size_tool'] ?? 'php_walk')
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
     * If the configured DirectorySizeCalculator strategy fails at runtime
     * (e.g. the `du` binary is missing or exits non-zero), that failure is
     * turned into a controlled 500 response rather than propagating
     * uncaught, the same way BackendErrorException failures are handled
     * above.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        try {
            StaffAccessGuard::requireStaffAccess($this->client, $request->headers());

            $size = $this->cacheSize();
        } catch (BackendErrorException $e) {
            return new Response(['httpCode' => $e->httpCode(), 'body' => $e->body()]);
        } catch (ShellCommandFailedException $e) {
            return new Response(['httpCode' => 500, 'body' => 'Internal Server Error']);
        }

        return new Response(
            [
            'httpCode' => 200,
            'headers'  => ['Content-Type: application/json'],
            'body'     => json_encode(['size' => $size]),
            ]
        );
    }

    /**
     * Computes the total size (in bytes) of the configured cache folder,
     * delegating to the configured DirectorySizeCalculator.
     *
     * @return int Total size in bytes.
     */
    private function cacheSize(): int
    {
        return $this->calculator->sizeOf($this->cachePath);
    }
}
