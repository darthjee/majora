<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;

/**
 * Sanitizes a domain string before it's interpolated into a per-domain cache
 * folder location (e.g. "$cacheFolder/.$domain").
 *
 * `$domain` values come from an admin-configured list (`$gamesJsonCacheDomains`
 * in locals.php), not from request input, but are still defended in depth
 * before being used to build a filesystem path, following the same
 * defense-in-depth shape already established in this folder by
 * SecurePhotoStorage/PathTraversalGuard:
 *
 * - A string-level check (mirroring SecurePhotoStorage::assertWithinBase())
 *   rejects anything that isn't a single, safe path segment — no `/`, no
 *   `..`, no leading dot. This runs unconditionally, since the target
 *   directory may not exist on disk yet the first time a domain is
 *   configured.
 * - Once the resulting directory already exists on disk,
 *   PathTraversalGuard::assertRealPathWithinBase() re-verifies containment
 *   at the filesystem level (symlink-aware) — the same second check
 *   SecurePhotoStorage runs once its target exists.
 */
class CachePathSanitizer
{
    /**
     * A single, safe path segment: letters, digits, dot and hyphen, neither
     * leading nor trailing with a dot or hyphen. Rejects `/` (no nested
     * paths), a leading `.` (which would collide with the "." prefix already
     * added by callers building "$cacheFolder/.$domain", or resolve to `.`/
     * `..`), and any other character not plausible in a domain name.
     */
    private const SAFE_SEGMENT_PATTERN = '/^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/';

    /**
     * Validates $domain is a safe, single-segment path component and,
     * once the resulting per-domain cache directory already exists on
     * disk, re-verifies it resolves inside $cacheFolder at the filesystem
     * level. Returns $domain unchanged so callers can build the cache
     * location themselves (e.g. "$cacheFolder/." . sanitize($domain, ...)).
     *
     * @param string $domain      Domain string to validate.
     * @param string $cacheFolder Base cache folder the domain's cache
     *                            directory ("$cacheFolder/.$domain") must
     *                            resolve inside of.
     * @return string The validated $domain, unchanged.
     * @throws InvalidArgumentException When $domain is not a safe,
     *                                   single-segment path component, or
     *                                   (once the directory exists on disk)
     *                                   its resolved real path escapes
     *                                   $cacheFolder.
     */
    public static function sanitize(string $domain, string $cacheFolder): string
    {
        if (!preg_match(self::SAFE_SEGMENT_PATTERN, $domain)) {
            throw new InvalidArgumentException(
                'Unsafe domain used for cache path: ' . $domain
            );
        }

        $domainCachePath = $cacheFolder . '/.' . $domain;

        if (is_dir($domainCachePath)) {
            PathTraversalGuard::assertRealPathWithinBase($cacheFolder, $domainCachePath);
        }

        return $domain;
    }
}
