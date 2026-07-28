<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;

/**
 * Defense-in-depth, filesystem-level double-check against path traversal.
 *
 * SecurePhotoStorage already guards against `..`/absolute-path escapes at
 * the string level (see SecurePhotoStorage::assertWithinBase()), which is
 * necessary because that check has to run before the target exists on disk
 * (e.g. before a directory is created), when realpath() can't canonicalize
 * anything yet.
 *
 * This class is meant to run *after* that string-level check has already
 * passed AND the target path exists on disk (e.g. right after
 * mkdir()/is_dir() confirms a directory exists, or right before unlink()-ing
 * a file known to exist). At that point realpath() can be used to fully
 * canonicalize both the base path and the target path — resolving any
 * `.`/`..` segments the string-level check might have missed edge cases of,
 * and, crucially, resolving symlinks, which a purely string-level check can
 * never detect (a symlink living inside the base directory can point
 * anywhere on the filesystem).
 *
 * It does not replace the string-level check: it complements it. Use this
 * class as a second, stricter check once the path is known to exist.
 */
class PathTraversalGuard
{
    /**
     * Verifies that $existingPath, once resolved to its canonical real path,
     * still lives inside the canonical real path of $basePath.
     *
     * Both $basePath and $existingPath must already exist on disk, since
     * realpath() returns false for any path that doesn't. Failing to resolve
     * either path is treated as a failure (fail closed) rather than silently
     * skipping the check.
     *
     * @param string $basePath     Base directory the target must resolve inside of.
     * @param string $existingPath Path to verify; must already exist on disk.
     * @return void
     * @throws InvalidArgumentException When either path fails to resolve via
     *                                   realpath(), or the resolved
     *                                   $existingPath is not the resolved
     *                                   $basePath itself, nor nested under it.
     */
    public static function assertRealPathWithinBase(string $basePath, string $existingPath): void
    {
        $realBase = realpath($basePath);
        $realPath = realpath($existingPath);

        if ($realBase === false) {
            throw new InvalidArgumentException(
                'Could not resolve real path of base directory: ' . $basePath
            );
        }

        if ($realPath === false) {
            throw new InvalidArgumentException(
                'Could not resolve real path of: ' . $existingPath
            );
        }

        if (
            $realPath !== $realBase
            && strncmp($realPath, $realBase . '/', strlen($realBase) + 1) !== 0
        ) {
            throw new InvalidArgumentException(
                'Resolved real path escapes the base directory: ' . $existingPath
            );
        }
    }
}
