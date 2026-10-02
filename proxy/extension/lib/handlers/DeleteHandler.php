<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;
use Tent\Http\HttpClientInterface;
use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Handles photo deletion for two routes:
 *   - DELETE /games/:game_slug/(pcs|npcs)/:character_id/photos/:photo_id.json
 *     (character photos);
 *   - DELETE /staff/photos/:photo_type/:photo_id.json (staff photo
 *     management, issue #1472).
 *
 * For a matched request path `<base>.json`, the backend URLs are derived
 * from the path itself: `<base>/deletable.json` and `<base>.json`.
 *
 * Orchestrates photo deletion across the backend and the photos filesystem
 * volume:
 *   1. Calls GET <base>/deletable.json to check the photo can be deleted and
 *      to learn the file path to remove. Any non-200 (401/403 when not
 *      authorized, 404 if not found, 422 if not deletable) is forwarded to
 *      the client as-is, and no file is touched.
 *   2. Deletes the file at the returned path from the photos volume through
 *      SecurePhotoStorage (a missing file counts as already deleted).
 *   3. Calls the backend DELETE <base>.json to remove the database record,
 *      and forwards its response through — after clearing any cache paths
 *      its X-Cache-Clear header lists (2xx only, via ResponseCacheClearer)
 *      and stripping that header from what the client receives.
 *
 * Authorization is enforced by the backend on both calls.
 */
class DeleteHandler extends RequestHandler
{

    /**
     * Accepted request paths. Each pattern captures the `<base>` the
     * backend URLs are derived from (the path without its `.json` suffix).
     *
     * @var string[]
     */
    private const ROUTE_PATTERNS = [
        '#^(/games/[^/]+/(?:pcs|npcs)/\d+/photos/\d+)\.json$#',
        '#^(/staff/photos/[a-z0-9_-]+/\d+)\.json$#',
    ];

    /** @var BackendClient Client used for backend calls. */
    private BackendClient $client;

    /** @var string Base path photos are stored under */
    private string $photosBasePath;

    /** @var SecurePhotoStorage Guards file deletion against path traversal. */
    private SecurePhotoStorage $photoStorage;

    /** @var ResponseCacheClearer Clears cache paths listed in X-Cache-Clear. */
    private ResponseCacheClearer $cacheClearer;

    /**
     * @param string                   $host           Backend host URL.
     * @param HttpClientInterface|null $httpClient     HTTP client (defaults to CurlHttpClient).
     * @param string                   $photosBasePath Base directory photos are stored under.
     * @param string                   $cachePath      Cache folder X-Cache-Clear paths are cleared
     *                                                 from ('' disables clearing).
     */
    public function __construct(
        string $host,
        ?HttpClientInterface $httpClient=null,
        string $photosBasePath='',
        string $cachePath=''
    ) {
        $this->client = new BackendClient($host, $httpClient);
        $this->photosBasePath = $photosBasePath;
        $this->photoStorage = new SecurePhotoStorage($photosBasePath);
        $this->cacheClearer = ResponseCacheClearer::forPath($cachePath);
    }

    /**
     * Builds a DeleteHandler from configuration parameters.
     *
     * @param array $params Must contain 'host' (string) and 'photos_path' (string);
     *                      may contain 'cache_path' (string) to enable
     *                      X-Cache-Clear handling.
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            ($params['host'] ?? ''),
            null,
            ($params['photos_path'] ?? ''),
            ($params['cache_path'] ?? '')
        );
    }

    /**
     * Processes the delete request.
     *
     * 1. Derives `<base>` from the request path (400 if it matches no
     *    accepted route).
     * 2. Calls GET <base>/deletable.json; forwards the backend response
     *    as-is when it isn't a 200.
     * 3. Deletes the file at the 'path' returned by that call.
     * 4. Calls the backend DELETE <base>.json, clears any cache paths its
     *    X-Cache-Clear header lists (2xx only), and forwards its response
     *    without that header.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        try {
            $basePath = $this->extractBasePath($request);
            $headers  = $request->headers();

            $path = $this->requestDeletablePath($basePath, $headers);

            $this->photoStorage->deleteFile($path);

            $result = $this->client->request('DELETE', $basePath . '.json', $headers);
            $this->cacheClearer->clearFrom(($result['headers'] ?? []), $result['httpCode']);
        } catch (BackendErrorException $e) {
            return new Response(['httpCode' => $e->httpCode(), 'body' => $e->body()]);
        } catch (InvalidArgumentException $e) {
            return new Response(['httpCode' => 400, 'body' => 'Bad Request']);
        }

        return new Response(
            [
            'httpCode' => $result['httpCode'],
            'headers'  => ResponseCacheClearer::withoutHeader(($result['headers'] ?? [])),
            'body'     => $result['body'],
            ]
        );
    }

    /**
     * Returns the request path without its `.json` suffix, provided it
     * matches one of ROUTE_PATTERNS.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return string The `<base>` path backend URLs are derived from.
     * @throws InvalidArgumentException When the path matches no accepted route.
     */
    private function extractBasePath(RequestInterface $request): string
    {
        $path = $request->requestPath();

        foreach (self::ROUTE_PATTERNS as $pattern) {
            if (preg_match($pattern, $path, $matches)) {
                return $matches[1];
            }
        }

        throw new InvalidArgumentException('Invalid delete path: ' . $path);
    }

    /**
     * Calls the backend's <base>/deletable.json endpoint and returns the
     * photo's file path when the photo is deletable.
     *
     * @param string $basePath As returned by extractBasePath().
     * @param array  $headers  Raw, unfiltered incoming request headers.
     * @return string The 'path' value from the backend's response body.
     * @throws BackendErrorException When the backend call fails, or the
     *                                response doesn't include a path.
     */
    private function requestDeletablePath(string $basePath, array $headers): string
    {
        $result = $this->client->request('GET', $basePath . '/deletable.json', $headers);

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $result['body']);
        }

        $body = json_decode($result['body'], true);
        $path = ($body['path'] ?? null);
        if (!is_string($path)) {
            throw new BackendErrorException(500, 'Internal Server Error');
        }

        return $path;
    }
}
