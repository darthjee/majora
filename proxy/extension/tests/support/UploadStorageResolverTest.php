<?php

namespace Tent\RequestHandlers\Tests;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\UploadStorageResolver;

/**
 * Unit tests for UploadStorageResolver.
 *
 * Uses temporary directories as the photos/files base paths to avoid
 * touching the real /var/www/html/photos and /var/www/html/files volumes
 * during tests.
 */
class UploadStorageResolverTest extends TestCase
{
    /** @var string Temporary directory used as the photos base path */
    private string $photosDir;

    /** @var string Temporary directory used as the files base path */
    private string $filesDir;

    protected function setUp(): void
    {
        $this->photosDir = sys_get_temp_dir() . '/test_storage_resolver_photos_' . uniqid();
        mkdir($this->photosDir, 0755, true);

        $this->filesDir = sys_get_temp_dir() . '/test_storage_resolver_files_' . uniqid();
        mkdir($this->filesDir, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->photosDir);
        $this->removeDir($this->filesDir);
    }

    /**
     * Recursively removes a directory and all its contents.
     */
    private function removeDir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        foreach (scandir($dir) as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $path = $dir . '/' . $entry;
            is_dir($path) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }

    /**
     * Creates a temporary upload file with the given content and returns its path.
     */
    private function makeTmpFile(string $content = 'fake image bytes'): string
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'test_storage_resolver_');
        file_put_contents($tmpFile, $content);
        return $tmpFile;
    }

    // -------------------------------------------------------------------------
    // forType() - base path resolution
    // -------------------------------------------------------------------------

    /**
     * forType('image') resolves to $photosBasePath, not $filesBasePath.
     */
    public function testForTypeImageWritesUnderPhotosBasePath(): void
    {
        $tmpFile  = $this->makeTmpFile();
        $resolver = UploadStorageResolver::forType('image', $this->photosDir, $this->filesDir);

        $destination = $resolver->write('42/photo.jpg', ['tmp_name' => $tmpFile]);

        $this->assertSame($this->photosDir . '/42/photo.jpg', $destination);
        $this->assertFileExists($this->photosDir . '/42/photo.jpg');

        unlink($tmpFile);
    }

    /**
     * forType('file') resolves to $filesBasePath, not $photosBasePath.
     */
    public function testForTypeFileWritesUnderFilesBasePath(): void
    {
        $tmpFile  = $this->makeTmpFile('%PDF-1.4 fake pdf data');
        $resolver = UploadStorageResolver::forType('file', $this->photosDir, $this->filesDir);

        $destination = $resolver->write('99/document.pdf', ['tmp_name' => $tmpFile]);

        $this->assertSame($this->filesDir . '/99/document.pdf', $destination);
        $this->assertFileExists($this->filesDir . '/99/document.pdf');

        unlink($tmpFile);
    }

    /**
     * Any upload type other than 'file' (e.g. 'image') resolves to
     * $photosBasePath, matching the original basePathFor() rule.
     */
    public function testForTypeUnknownTypeFallsBackToPhotosBasePath(): void
    {
        $tmpFile  = $this->makeTmpFile();
        $resolver = UploadStorageResolver::forType('image', $this->photosDir, $this->filesDir);

        $destination = $resolver->write('1/photo.jpg', ['tmp_name' => $tmpFile]);

        $this->assertStringStartsWith($this->photosDir, $destination);

        unlink($tmpFile);
    }

    // -------------------------------------------------------------------------
    // write() - happy path
    // -------------------------------------------------------------------------

    /**
     * write() creates any missing nested directories and writes the file's
     * content to the destination.
     */
    public function testWriteCreatesNestedDirectoriesAndWritesContent(): void
    {
        $tmpFile  = $this->makeTmpFile('hello world');
        $resolver = UploadStorageResolver::forType('image', $this->photosDir, $this->filesDir);

        $destination = $resolver->write('games/1/characters/2/photo.jpg', ['tmp_name' => $tmpFile]);

        $this->assertFileExists($destination);
        $this->assertSame('hello world', file_get_contents($destination));

        unlink($tmpFile);
    }

    // -------------------------------------------------------------------------
    // write() - path traversal
    // -------------------------------------------------------------------------

    /**
     * A file_path with `..` segments that would resolve outside the base
     * path is rejected, without writing anything.
     */
    public function testWriteRejectsTraversalEscapingBasePath(): void
    {
        $tmpFile  = $this->makeTmpFile();
        $resolver = UploadStorageResolver::forType('image', $this->photosDir, $this->filesDir);

        $this->expectException(InvalidArgumentException::class);

        try {
            $resolver->write('../outside/photo.jpg', ['tmp_name' => $tmpFile]);
        } finally {
            $this->assertFileDoesNotExist(dirname($this->photosDir) . '/outside/photo.jpg');
            unlink($tmpFile);
        }
    }

    /**
     * A symlink planted at the destination file path (not its containing
     * directory) inside the base path, pointing outside of it, is rejected
     * by the post-write PathTraversalGuard::assertRealPathWithinBase()
     * check, even though the directory-level check alone wouldn't catch it.
     */
    public function testWriteRejectsSymlinkDestinationEscapingBasePath(): void
    {
        $tmpFile    = $this->makeTmpFile();
        $resolver   = UploadStorageResolver::forType('image', $this->photosDir, $this->filesDir);
        $outsideDir = sys_get_temp_dir() . '/test_storage_resolver_outside_' . uniqid();
        mkdir($outsideDir, 0755, true);
        mkdir($this->photosDir . '/42', 0755, true);
        symlink($outsideDir . '/photo.jpg', $this->photosDir . '/42/photo.jpg');

        $this->expectException(InvalidArgumentException::class);

        try {
            $resolver->write('42/photo.jpg', ['tmp_name' => $tmpFile]);
        } finally {
            @unlink($this->photosDir . '/42/photo.jpg');
            @unlink($outsideDir . '/photo.jpg');
            rmdir($outsideDir);
            unlink($tmpFile);
        }
    }
}
