<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;
use Tent\Log\Logger;

/**
 * Writes an uploaded file to the storage base path for a single upload type
 * ('image' or 'file'), guarding against path traversal via SecurePhotoStorage
 * and PathTraversalGuard.
 */
class UploadStorageResolver
{
    /** @var string The upload type ('image' or 'file'). */
    private string $uploadType;

    /** @var string Base directory this instance's uploads are written under. */
    private string $basePath;

    /** @var SecurePhotoStorage Guards directory creation against path traversal. */
    private SecurePhotoStorage $storage;

    /**
     * @param string             $uploadType The upload type ('image' or 'file').
     * @param string             $basePath   Base directory uploads are written under.
     * @param SecurePhotoStorage $storage    Guards directory creation against path traversal.
     */
    private function __construct(string $uploadType, string $basePath, SecurePhotoStorage $storage)
    {
        $this->uploadType = $uploadType;
        $this->basePath = $basePath;
        $this->storage = $storage;
    }

    /**
     * Builds an UploadStorageResolver for $uploadType, resolving its base
     * path from $photosBasePath/$filesBasePath.
     *
     * @param string $uploadType     The upload type ('image' or 'file').
     * @param string $photosBasePath Base directory for 'image' upload storage.
     * @param string $filesBasePath  Base directory for 'file' upload storage.
     * @return self
     */
    public static function forType(string $uploadType, string $photosBasePath, string $filesBasePath): self
    {
        $basePath = $uploadType === 'file' ? $filesBasePath : $photosBasePath;

        return new self($uploadType, $basePath, new SecurePhotoStorage($basePath));
    }

    /**
     * Writes the uploaded file to <basePath>/<filePath>.
     *
     * The directory-level double-check performed by
     * SecurePhotoStorage::ensureDirectoryFor() (via PathTraversalGuard) only
     * verifies the containing directory's real path, since it necessarily
     * runs before the file itself exists on disk. Once file_put_contents()
     * has actually written $destination, an additional
     * PathTraversalGuard::assertRealPathWithinBase() check runs against the
     * concrete file itself, closing the gap left open by anything that could
     * happen between the directory check and the write (e.g. a symlink
     * swapped in at the last moment).
     *
     * @param string $filePath The file_path returned by the backend.
     * @param array  $file     The raw $_FILES entry for the uploaded file.
     * @return string The full destination path the file was written to.
     * @throws InvalidArgumentException When the resolved destination would
     *                                   escape the base path, whether at the
     *                                   directory level or, once written, at
     *                                   the file level.
     */
    public function write(string $filePath, array $file): string
    {
        $destination = $this->basePath . '/' . $filePath;

        Logger::error('[upload] - saving ' . $this->uploadType . ' file to: ' . $destination);

        $this->storage->ensureDirectoryFor($destination);

        file_put_contents($destination, file_get_contents($file['tmp_name']));

        PathTraversalGuard::assertRealPathWithinBase($this->basePath, $destination);

        return $destination;
    }
}
