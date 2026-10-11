<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;
use Tent\Http\HttpClientInterface;
use Tent\Log\Logger;
use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Shares a source game's photo/file with its copy through a hard link
 * (issue #1570), for the POST /uploads/link/:upload_type/:id/submit route.
 *
 * Flow:
 *   1. StaffAccessGuard rejects non-staff callers before any backend PATCH.
 *   2. PATCH /uploads/:upload_type/:id.json status=uploading returns the
 *      copy's target `file_path` and the source's `source_path` (backend
 *      403/404 are relayed as-is).
 *   3. Both paths must carry the upload type's prefix (`photos/` for
 *      'image', `files/` for 'file'). The source must be an existing regular
 *      file, not a symlink, whose real path lives inside the type root
 *      (`<photos_path>/photos` or `<files_path>/files`).
 *   4. The target's directory is validated against the same type root and
 *      created through SecurePhotoStorage.
 *   5. The file is shared with link() only: never symlink(), never a byte
 *      copy. An existing target that is the very same inode (not a symlink)
 *      is an idempotent retry and skips linking; any other existing target
 *      is `target_exists`.
 *   6. PATCH status=uploaded finalizes the copy; its X-Cache-Clear header is
 *      cleared in every domain cache folder (ResponseCacheClearer::forRoot).
 *
 * Any failure in steps 3-5 sends PATCH status=failed with an error code
 * (`source_missing`, `path_rejected`, `cross_device`, `target_exists`,
 * `permission`, `unknown`) and answers
 * `422 {"status":"failed","error":"<code>"}`. Success answers
 * `200 {"status":"uploaded"}`. The response is built from scratch, so it
 * never carries `file_path`, `source_path` or X-Cache-Clear. Nothing is
 * ever deleted: copies are resumable from the pending-links list.
 */
class LinkHandler extends RequestHandler
{
    /**
     * Request path pattern; captures the upload type and id.
     *
     * @var string
     */
    private const PATH_PATTERN = '#^/uploads/link/(image|file)/(\d+)/submit$#';

    /**
     * Type prefix (and type root subfolder) of each upload type.
     *
     * @var array<string, string>
     */
    private const TYPE_PREFIXES = [
        'image' => 'photos',
        'file'  => 'files',
    ];

    public const ERROR_SOURCE_MISSING = 'source_missing';
    public const ERROR_PATH_REJECTED  = 'path_rejected';
    public const ERROR_CROSS_DEVICE   = 'cross_device';
    public const ERROR_TARGET_EXISTS  = 'target_exists';
    public const ERROR_PERMISSION     = 'permission';
    public const ERROR_UNKNOWN        = 'unknown';

    /** @var BackendClient Client used for backend calls. */
    private BackendClient $client;

    /** @var string Base path 'image' paths are resolved against. */
    private string $photosBasePath;

    /** @var string Base path 'file' paths are resolved against. */
    private string $filesBasePath;

    /** @var ResponseCacheClearer Cross-domain clearer for the finalize response. */
    private ResponseCacheClearer $cacheClearer;

    /**
     * @param string                   $host           Backend host URL.
     * @param HttpClientInterface|null $httpClient     HTTP client (defaults to CurlHttpClient).
     * @param string                   $photosBasePath Base path for 'image' paths.
     * @param string                   $filesBasePath  Base path for 'file' paths.
     * @param string                   $cacheRoot      Cache root cleared across every domain
     *                                                 folder ('' disables clearing).
     */
    public function __construct(
        string $host,
        ?HttpClientInterface $httpClient=null,
        string $photosBasePath='',
        string $filesBasePath='',
        string $cacheRoot=''
    ) {
        $this->client         = new BackendClient($host, $httpClient);
        $this->photosBasePath = $photosBasePath;
        $this->filesBasePath  = $filesBasePath;
        $this->cacheClearer   = ResponseCacheClearer::forRoot($cacheRoot);
    }

    /**
     * Builds a LinkHandler from configuration parameters.
     *
     * @param array $params Supports 'host', 'photos_path', 'files_path' and
     *                      'cache_path' (the cache root).
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            ($params['host'] ?? ''),
            null,
            ($params['photos_path'] ?? ''),
            ($params['files_path'] ?? ''),
            ($params['cache_path'] ?? '')
        );
    }

    /**
     * Processes the link request (see the class docblock for the flow).
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        if (!preg_match(self::PATH_PATTERN, $request->requestPath(), $matches)) {
            return new Response(['httpCode' => 400, 'body' => 'Bad Request']);
        }

        $uploadType = $matches[1];
        $uploadId   = $matches[2];
        $headers    = $request->headers();

        try {
            StaffAccessGuard::requireStaffAccess($this->client, $headers);

            $statusClient = new UploadStatusClient($this->client, $uploadType);
            $paths        = $statusClient->requestLinkStartStatus($uploadId, $headers);

            $error = $this->linkFiles($uploadType, $paths['source_path'], $paths['file_path']);
            if ($error !== null) {
                return $this->failedResponse($statusClient, $uploadType, $uploadId, $error, $headers);
            }

            $finalize = $statusClient->requestUploadedStatus($uploadId, $headers);
            $this->cacheClearer->clearFrom($finalize->headers(), 200);
        } catch (BackendErrorException $e) {
            return new Response(['httpCode' => $e->httpCode(), 'body' => $e->body()]);
        }

        return self::jsonResponse(200, ['status' => 'uploaded']);
    }

    /**
     * Validates both ends and hard-links the source to the target.
     *
     * @param string $uploadType 'image' or 'file'.
     * @param string $sourcePath Backend source path, e.g. 'photos/3/a.jpg'.
     * @param string $filePath   Backend target path, e.g. 'photos/9/a.jpg'.
     * @return string|null The error code, or null on success (linked, or an
     *                     idempotent retry).
     */
    private function linkFiles(string $uploadType, string $sourcePath, string $filePath): ?string
    {
        $prefix = self::TYPE_PREFIXES[$uploadType];
        $base   = ($uploadType === 'image' ? $this->photosBasePath : $this->filesBasePath);

        if (!self::hasSafePrefix($sourcePath, $prefix) || !self::hasSafePrefix($filePath, $prefix)) {
            return self::ERROR_PATH_REJECTED;
        }

        $typeRoot = rtrim($base, '/') . '/' . $prefix;
        $source   = rtrim($base, '/') . '/' . $sourcePath;
        $target   = rtrim($base, '/') . '/' . $filePath;

        $error = (self::sourceError($typeRoot, $source) ?? self::prepareTarget($typeRoot, $target));
        if ($error !== null) {
            return $error;
        }

        if (file_exists($target) || is_link($target)) {
            return self::isSameFile($source, $target) ? null : self::ERROR_TARGET_EXISTS;
        }

        error_clear_last();
        if (!@link($source, $target)) {
            return self::errorCodeForLinkFailure((string) (error_get_last()['message'] ?? ''));
        }

        return null;
    }

    /**
     * Whether $path starts with "$prefix/" and has no empty, '.' or '..'
     * segments.
     *
     * @param string $path   Backend-supplied relative path.
     * @param string $prefix Expected type prefix ('photos' or 'files').
     * @return boolean
     */
    private static function hasSafePrefix(string $path, string $prefix): bool
    {
        if (strncmp($path, $prefix . '/', (strlen($prefix) + 1)) !== 0 || strpos($path, "\0") !== false) {
            return false;
        }

        foreach (explode('/', $path) as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                return false;
            }
        }

        return true;
    }

    /**
     * Validates the source: it must exist, be a regular file (not a
     * symlink) and resolve inside the type root.
     *
     * @param string $typeRoot Type root directory.
     * @param string $source   Absolute source path.
     * @return string|null The error code, or null when valid.
     */
    private static function sourceError(string $typeRoot, string $source): ?string
    {
        if (!file_exists($source) && !is_link($source)) {
            return self::ERROR_SOURCE_MISSING;
        }

        if (is_link($source) || !is_file($source)) {
            return self::ERROR_PATH_REJECTED;
        }

        try {
            PathTraversalGuard::assertRealPathWithinBase($typeRoot, $source);
        } catch (InvalidArgumentException $e) {
            return self::ERROR_PATH_REJECTED;
        }

        return null;
    }

    /**
     * Validates the target against the type root and creates its directory.
     *
     * @param string $typeRoot Type root directory.
     * @param string $target   Absolute target path.
     * @return string|null The error code, or null when ready.
     */
    private static function prepareTarget(string $typeRoot, string $target): ?string
    {
        if (!is_dir($typeRoot)) {
            return self::ERROR_PATH_REJECTED;
        }

        error_clear_last();
        try {
            @(new SecurePhotoStorage($typeRoot))->ensureDirectoryFor($target);
        } catch (InvalidArgumentException $e) {
            $last = (string) (error_get_last()['message'] ?? '');
            return (stripos($last, 'mkdir') !== false ? self::ERROR_PERMISSION : self::ERROR_PATH_REJECTED);
        }

        return null;
    }

    /**
     * Whether the existing $target is the same file as $source: not a
     * symlink, same inode on the same device (an idempotent retry).
     *
     * @param string $source Absolute source path (validated regular file).
     * @param string $target Absolute existing target path.
     * @return boolean
     */
    private static function isSameFile(string $source, string $target): bool
    {
        if (is_link($target) || !is_file($target)) {
            return false;
        }

        $sourceStat = @stat($source);
        $targetStat = @lstat($target);
        if ($sourceStat === false || $targetStat === false) {
            return false;
        }

        return $sourceStat['ino'] === $targetStat['ino'] && $sourceStat['dev'] === $targetStat['dev'];
    }

    /**
     * Maps a failed link()'s warning message to an error code.
     *
     * @param string $message The error_get_last() message.
     * @return string
     */
    private static function errorCodeForLinkFailure(string $message): string
    {
        if (stripos($message, 'cross-device') !== false) {
            return self::ERROR_CROSS_DEVICE;
        }

        if (stripos($message, 'Permission denied') !== false
            || stripos($message, 'Operation not permitted') !== false
        ) {
            return self::ERROR_PERMISSION;
        }

        if (stripos($message, 'File exists') !== false) {
            return self::ERROR_TARGET_EXISTS;
        }

        return self::ERROR_UNKNOWN;
    }

    /**
     * Reports the failure to the backend (status=failed) and builds the 422
     * response. A failing report is logged; the 422 is still returned.
     *
     * @param UploadStatusClient $statusClient Status client for the upload type.
     * @param string             $uploadType   'image' or 'file' (for logs).
     * @param string             $uploadId     The upload id.
     * @param string             $error        The error code.
     * @param array              $headers      Incoming request headers to forward.
     * @return Response
     */
    private function failedResponse(
        UploadStatusClient $statusClient,
        string $uploadType,
        string $uploadId,
        string $error,
        array $headers
    ): Response {
        Logger::warn('[link] - ' . $uploadType . ' upload ' . $uploadId . ' failed: ' . $error);

        try {
            $statusClient->requestFailedStatus($uploadId, $error, $headers);
        } catch (BackendErrorException $e) {
            Logger::error(
                '[link] - could not mark ' . $uploadType . ' upload ' . $uploadId
                . ' as failed: backend answered ' . $e->httpCode()
            );
        }

        return self::jsonResponse(422, ['status' => 'failed', 'error' => $error]);
    }

    /**
     * Builds a JSON response.
     *
     * @param integer $httpCode HTTP status code.
     * @param array   $body     Body to encode.
     * @return Response
     */
    private static function jsonResponse(int $httpCode, array $body): Response
    {
        return new Response(
            [
            'httpCode' => $httpCode,
            'headers'  => ['Content-Type: application/json'],
            'body'     => json_encode($body),
            ]
        );
    }
}
