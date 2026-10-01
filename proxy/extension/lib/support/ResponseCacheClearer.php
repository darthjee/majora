<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;
use Tent\Content\CacheDirCleaner;
use Tent\Content\CacheDirResolver;
use Tent\Log\Logger;
use Tent\Models\FolderLocation;

/**
 * Response-driven cache invalidation (issue #1469).
 *
 * The backend can attach an `X-Cache-Clear` header to a mutation response,
 * listing the literal cache paths that mutation made stale, e.g.
 *
 *     X-Cache-Clear: /games/foo/factions.json, /games/foo/factions/3.json
 *
 * Handlers that call the backend themselves (UploadHandler's finalize PATCH,
 * DeleteHandler's DELETE) pass that backend response to clearFrom(), which
 * deletes each listed path's `GET/` cache directory from the cache folder
 * via Tent's CacheDirCleaner::cleanPath() — the same mechanism
 * CacheCleanupMiddleware uses. Since that removes the whole per-path `GET/`
 * directory, every cache entry for the path goes, whatever RequestHasher
 * keyed it (query hashes and PrivateRequestHasher's `private_*` entries
 * alike), as long as the clearer and the caching rule share a cache folder.
 *
 * Security:
 *   - Only ever reads the header off backend responses handed to it by a
 *     handler; it never looks at client request headers.
 *   - Only acts on 2xx responses.
 *   - Every entry is validated (see isValidPath()) before use; invalid
 *     entries are skipped and logged, the valid ones are still cleared.
 *   - When the resolved cache directory exists, PathTraversalGuard checks
 *     its real path (resolving symlinks) still lives inside the cache
 *     folder before anything is deleted.
 *   - withoutHeader() lets handlers that forward backend headers strip
 *     `X-Cache-Clear` before the response reaches the client.
 *
 * Built without a cache location (null), it is a no-op, so handlers stay
 * functional when no `cache_path` is configured.
 */
class ResponseCacheClearer
{
    /**
     * Name of the response header carrying the paths to clear (matched
     * case-insensitively).
     *
     * @var string
     */
    public const HEADER_NAME = 'X-Cache-Clear';

    /** @var FolderLocation|null Cache folder, or null to disable clearing. */
    private ?FolderLocation $location;

    /** @var CacheDirCleaner|null Tent's cache directory cleaner. */
    private ?CacheDirCleaner $cleaner;

    /** @var CacheDirResolver|null Resolves a path to its cache directory. */
    private ?CacheDirResolver $resolver;

    /**
     * @param FolderLocation|null $location Cache folder (must match the one the
     *                                      caching rules use), or null to make
     *                                      every call a no-op.
     */
    public function __construct(?FolderLocation $location)
    {
        $this->location = $location;
        $this->cleaner  = ($location === null ? null : new CacheDirCleaner($location));
        $this->resolver = ($location === null ? null : new CacheDirResolver($location));
    }

    /**
     * Builds a clearer from a handler's `cache_path` configuration value.
     *
     * @param string $cachePath Cache folder path; '' disables clearing.
     * @return self
     */
    public static function forPath(string $cachePath): self
    {
        return new self($cachePath === '' ? null : new FolderLocation($cachePath));
    }

    /**
     * Clears every valid path listed in the response's X-Cache-Clear
     * header(s). Does nothing unless $httpCode is 2xx, the clearer has a
     * cache location, and the header is present.
     *
     * @param string[] $responseHeaders Backend response headers as raw
     *                                  "Name: Value" lines.
     * @param integer  $httpCode        Backend response status code.
     * @return void
     */
    public function clearFrom(array $responseHeaders, int $httpCode): void
    {
        if ($this->location === null || $httpCode < 200 || $httpCode > 299) {
            return;
        }

        foreach (self::pathsFrom($responseHeaders) as $path) {
            if (!self::isValidPath($path)) {
                Logger::warn('[cache-clear] - skipped invalid path: ' . json_encode($path));
                continue;
            }

            $this->clearPath($path);
        }
    }

    /**
     * Returns $headerLines without any X-Cache-Clear line, so a handler
     * forwarding backend headers never leaks it to the client.
     *
     * @param string[] $headerLines Response headers as "Name: Value" lines.
     * @return string[]
     */
    public static function withoutHeader(array $headerLines): array
    {
        return array_values(
            array_filter(
                $headerLines,
                fn ($line): bool => !self::isCacheClearLine((string) $line)
            )
        );
    }

    /**
     * Extracts the trimmed, non-empty entries of every X-Cache-Clear line.
     *
     * @param string[] $headerLines Response headers as "Name: Value" lines.
     * @return string[]
     */
    private static function pathsFrom(array $headerLines): array
    {
        $paths = [];

        foreach ($headerLines as $line) {
            $line = (string) $line;
            if (!self::isCacheClearLine($line)) {
                continue;
            }

            $value = substr($line, (strpos($line, ':') + 1));
            foreach (explode(',', $value) as $entry) {
                $entry = trim($entry);
                if ($entry !== '') {
                    $paths[] = $entry;
                }
            }
        }

        return $paths;
    }

    /**
     * Whether $line is an X-Cache-Clear header line (case-insensitive).
     *
     * @param string $line A raw "Name: Value" header line.
     * @return boolean
     */
    private static function isCacheClearLine(string $line): bool
    {
        $colon = strpos($line, ':');
        if ($colon === false) {
            return false;
        }

        return strcasecmp(trim(substr($line, 0, $colon)), self::HEADER_NAME) === 0;
    }

    /**
     * Validates a single X-Cache-Clear entry: must start with '/', end in
     * '.json', contain only safe characters (no backslash, NUL/control
     * characters, '%', '?' or '#'), and have no empty, '.' or '..' segments.
     *
     * @param string $path The candidate path.
     * @return boolean
     */
    private static function isValidPath(string $path): bool
    {
        if (!preg_match('#^/[A-Za-z0-9._~/-]+\.json$#', $path)) {
            return false;
        }

        foreach (explode('/', substr($path, 1)) as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                return false;
            }
        }

        return true;
    }

    /**
     * Clears one already-validated path, after checking (when its cache
     * directory exists) that the directory's real path stays inside the
     * cache folder.
     *
     * @param string $path A validated request path, e.g. '/games/foo.json'.
     * @return void
     */
    private function clearPath(string $path): void
    {
        $dir = $this->resolver->resolveExact($path);

        if (is_dir($dir)) {
            try {
                PathTraversalGuard::assertRealPathWithinBase($this->location->basePath(), $dir);
            } catch (InvalidArgumentException $e) {
                Logger::warn('[cache-clear] - skipped path escaping cache folder: ' . $path);
                return;
            }
        }

        $this->cleaner->cleanPath($path);
    }
}
