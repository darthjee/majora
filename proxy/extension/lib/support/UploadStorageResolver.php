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
     * Permissions applied to every written file. tempnam() creates files
     * with mode 0600, which the photos rule could not serve, so the temp
     * file is chmod-ed to the same mode a plain file_put_contents() write
     * would normally produce.
     */
    private const FILE_MODE = 0644;

    /** Prefix of the temporary files created next to the destination. */
    private const TEMP_PREFIX = '.upload-';

    /**
     * Atomically writes the uploaded file to <basePath>/<filePath>.
     *
     * The bytes are first written to a uniquely named temporary file in the
     * destination's own directory, which is then rename()-d over the
     * destination. A rename within a single directory is atomic, so readers
     * see either the old file or the new one, never a half-written file, and
     * a failed write leaves any pre-existing file untouched. On any failure
     * the temporary file is removed before the exception propagates.
     *
     * Path traversal is guarded at several points:
     *   - SecurePhotoStorage::ensureDirectoryFor() validates (and creates)
     *     the containing directory, both at the string level and via
     *     PathTraversalGuard.
     *   - A pre-existing entry at the destination (e.g. a symlink pointing
     *     outside the base path) is checked with
     *     PathTraversalGuard::assertRealPathWithinBase() before anything is
     *     written; a dangling symlink fails closed.
     *   - The temporary file is verified to live in the destination's real
     *     directory (tempnam() silently falls back to the system temp dir
     *     when the target directory isn't writable).
     *   - Once renamed, the final destination is checked once more.
     *
     * @param string $filePath The file_path returned by the backend.
     * @param array  $file     The raw $_FILES entry for the uploaded file.
     * @return string The full destination path the file was written to.
     * @throws InvalidArgumentException When the resolved destination would
     *                                   escape the base path.
     * @throws UploadWriteException     When the bytes could not be written
     *                                   or moved into place.
     */
    public function write(string $filePath, array $file): string
    {
        $destination = $this->basePath . '/' . $filePath;

        Logger::error('[upload] - saving ' . $this->uploadType . ' file to: ' . $destination);

        $this->storage->ensureDirectoryFor($destination);
        $this->assertExistingDestinationWithinBase($destination);

        $tempPath = $this->createTempFileNextTo($destination);

        try {
            $this->writeTempFile($tempPath, $file);

            if (!@rename($tempPath, $destination)) {
                throw new UploadWriteException('Could not move upload into place: ' . $destination);
            }
        } catch (\Throwable $e) {
            if (is_file($tempPath)) {
                @unlink($tempPath);
            }
            throw $e;
        }

        PathTraversalGuard::assertRealPathWithinBase($this->basePath, $destination);

        return $destination;
    }

    /**
     * Deletes the file at $filePath (relative to this upload type's base
     * path) through SecurePhotoStorage::deleteFile(), so the same
     * path-traversal guards apply. A missing file is a no-op.
     *
     * @param string $filePath Path relative to the base path.
     * @return void
     * @throws InvalidArgumentException When the path would escape the base path.
     */
    public function delete(string $filePath): void
    {
        $this->storage->deleteFile($filePath);
    }

    /**
     * Rejects a pre-existing entry at $destination (file or symlink, even a
     * dangling one) whose real path escapes the base path.
     *
     * @param string $destination Full destination path.
     * @return void
     * @throws InvalidArgumentException When the existing entry escapes the
     *                                   base path or can't be resolved.
     */
    private function assertExistingDestinationWithinBase(string $destination): void
    {
        if (is_link($destination) || file_exists($destination)) {
            PathTraversalGuard::assertRealPathWithinBase($this->basePath, $destination);
        }
    }

    /**
     * Creates a uniquely named temporary file in the same directory as
     * $destination, so the final rename() stays within one directory (and
     * therefore one filesystem) and is atomic.
     *
     * @param string $destination Full destination path.
     * @return string Path of the created temporary file.
     * @throws UploadWriteException When the temporary file can't be created
     *                              in the destination's directory.
     */
    private function createTempFileNextTo(string $destination): string
    {
        $dir      = dirname($destination);
        $tempPath = @tempnam($dir, self::TEMP_PREFIX);

        if ($tempPath === false) {
            throw new UploadWriteException('Could not create temporary file in: ' . $dir);
        }

        if (dirname((string) realpath($tempPath)) !== realpath($dir)) {
            @unlink($tempPath);
            throw new UploadWriteException('Temporary file was not created in: ' . $dir);
        }

        return $tempPath;
    }

    /**
     * Copies the uploaded bytes into $tempPath and sets its permissions.
     *
     * @param string $tempPath Temporary file to write to.
     * @param array  $file     The raw $_FILES entry for the uploaded file.
     * @return void
     * @throws UploadWriteException When reading or writing the bytes fails.
     */
    private function writeTempFile(string $tempPath, array $file): void
    {
        $tmpName = (string) ($file['tmp_name'] ?? '');
        $content = $tmpName === '' ? false : @file_get_contents($tmpName);
        if ($content === false) {
            throw new UploadWriteException('Could not read uploaded file');
        }

        if (@file_put_contents($tempPath, $content) === false) {
            throw new UploadWriteException('Could not write temporary file: ' . $tempPath);
        }

        @chmod($tempPath, self::FILE_MODE);
    }
}
