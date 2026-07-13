<?php

namespace Tent\RequestHandlers;

/**
 * Validates uploaded image filenames.
 *
 * Rejects any filename carrying more than one extension segment (e.g.
 * `image.php.jpg`, `image.jpg.png`), since inspecting only the last segment
 * (as pathinfo(..., PATHINFO_EXTENSION) does) would let a dangerous
 * secondary extension slip through. Otherwise checks the single extension,
 * case-insensitively, against an allow-list.
 */
class UploadFilenameValidator
{
    /**
     * Allow-list of extensions accepted for photo uploads, matched
     * case-insensitively.
     *
     * @var string[]
     */
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    /**
     * Determines whether $filename is an acceptable upload name.
     *
     * @param string $filename The uploaded file's original name.
     * @return bool True when $filename has exactly one extension segment
     *              and it is on the allow-list (case-insensitively).
     */
    public function isAllowed(string $filename): bool
    {
        $basename = basename($filename);

        $parts = explode('.', $basename);

        // The basename itself (no dot at all) has 1 part and no extension;
        // exactly 2 parts means exactly one extension segment.
        if (count($parts) !== 2) {
            return false;
        }

        [, $extension] = $parts;

        return in_array(strtolower($extension), self::ALLOWED_EXTENSIONS, true);
    }
}
