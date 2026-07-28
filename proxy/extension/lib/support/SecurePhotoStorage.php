<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;

/**
 * Creates destination directories for photo uploads, guarding against path
 * traversal.
 *
 * Given a base path and a destination path meant to live inside it, this
 * class verifies (at the string level, since realpath() can't canonicalize
 * paths that don't exist yet) that the resolved destination stays inside the
 * base path before creating any directory, rejecting `..`/absolute-path
 * escapes with an InvalidArgumentException.
 */
class SecurePhotoStorage
{
    /** @var string Base directory all destinations must resolve inside of. */
    private string $basePath;

    /**
     * @param string $basePath Base directory all destinations must resolve inside of.
     */
    public function __construct(string $basePath)
    {
        $this->basePath = $basePath;
    }

    /**
     * Ensures the directory that would contain $destination exists, creating
     * it (mode 0755, recursive) if necessary.
     *
     * @param string $destination Full path (base path + relative file path)
     *                            of the file that is about to be written.
     * @return void
     * @throws InvalidArgumentException When the resolved directory would
     *                                   escape the base path.
     */
    public function ensureDirectoryFor(string $destination): void
    {
        $dir = dirname($destination);

        $this->assertWithinBase($dir);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }

    /**
     * Deletes the file at $relativePath (resolved against the base path),
     * guarding against path traversal the same way ensureDirectoryFor()
     * does.
     *
     * A missing file is not an error: it silently no-ops instead of
     * throwing, since it may simply mean a prior delete attempt was
     * interrupted after removing the file but before the corresponding
     * database record, and that shouldn't block the caller's DB-side
     * delete that follows.
     *
     * @param string $relativePath Path of the file to delete, relative to
     *                              the base path.
     * @return void
     * @throws InvalidArgumentException When the resolved path would escape
     *                                   the base path.
     */
    public function deleteFile(string $relativePath): void
    {
        $absolutePath = $this->basePath . '/' . $relativePath;

        $this->assertWithinBase($absolutePath);

        if (is_file($absolutePath)) {
            unlink($absolutePath);
        }
    }

    /**
     * Verifies that $dir, once `.`/`..` segments are resolved, stays inside
     * $this->basePath.
     *
     * $dir may not exist yet, so it can't be canonicalized with realpath();
     * instead the base path and $dir are each normalized independently at
     * the string level, and $dir is required to be the base path itself or
     * a path nested under it.
     *
     * @param string $dir The directory to verify.
     * @return void
     * @throws InvalidArgumentException When $dir would escape the base path.
     */
    private function assertWithinBase(string $dir): void
    {
        $normalizedBase = $this->normalize($this->basePath);
        $normalizedDir  = $this->normalize($dir);

        if (
            $normalizedDir !== $normalizedBase
            && strncmp($normalizedDir, $normalizedBase . '/', strlen($normalizedBase) + 1) !== 0
        ) {
            throw new InvalidArgumentException(
                'Resolved photo path escapes the base directory: ' . $dir
            );
        }
    }

    /**
     * Normalizes a path by resolving `.` and `..` segments at the string
     * level, without touching the filesystem, so it works for paths that
     * don't exist yet.
     *
     * @param string $path The path to normalize.
     * @return string The normalized, absolute-form path (no trailing slash).
     */
    private function normalize(string $path): string
    {
        $isAbsolute = strncmp($path, '/', 1) === 0;
        $segments   = explode('/', $path);
        $resolved   = [];

        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.') {
                continue;
            }

            if ($segment === '..') {
                if (!empty($resolved) && end($resolved) !== '..') {
                    array_pop($resolved);
                } elseif (!$isAbsolute) {
                    $resolved[] = '..';
                }
                continue;
            }

            $resolved[] = $segment;
        }

        $normalized = implode('/', $resolved);

        return $isAbsolute ? '/' . $normalized : $normalized;
    }
}
