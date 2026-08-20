<?php

namespace Tent\RequestHandlers;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

/**
 * Computes a directory's total size by walking it file-by-file with
 * RecursiveIteratorIterator and summing SplFileInfo::getSize() (one stat()
 * syscall per file).
 *
 * This is the original CacheSizeHandler implementation, moved out verbatim
 * as an explicitly selectable strategy for environments where shelling out
 * to `du` isn't appropriate (e.g. non-Linux dev/test) — see
 * DuDirectorySizeStrategy for the faster, Linux-only alternative.
 */
class PhpWalkDirectorySizeStrategy implements DirectorySizeStrategyInterface
{
    /**
     * Recursively sums the size (in bytes) of every file under $path.
     *
     * @param string $path The directory path to measure.
     * @return int Total size in bytes; 0 when the folder doesn't exist or is
     *              empty.
     */
    public function sizeOf(string $path): int
    {
        if (!is_dir($path)) {
            return 0;
        }

        $size = 0;
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        // @var SplFileInfo $file
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }
}
