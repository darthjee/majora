<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\UploadContentValidator;

/**
 * Unit tests for UploadContentValidator.
 */
class UploadContentValidatorTest extends TestCase
{
    /** @var string[] Temp files created by makeTmpFile(), cleaned up in tearDown(). */
    private array $tmpFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->tmpFiles as $tmpFile) {
            @unlink($tmpFile);
        }
        $this->tmpFiles = [];
    }

    /**
     * Minimal byte sequence that is a genuine JPEG per its magic header
     * (SOI + APP0/JFIF marker), so finfo_file() detects it as image/jpeg.
     */
    private const REAL_JPEG_BYTES =
        "\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00";

    /**
     * Creates a temporary upload file with the given content and returns its path.
     */
    private function makeTmpFile(string $content): string
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'test_upload_validator_');
        file_put_contents($tmpFile, $content);
        $this->tmpFiles[] = $tmpFile;
        return $tmpFile;
    }

    // -------------------------------------------------------------------------
    // forType('image')
    // -------------------------------------------------------------------------

    /**
     * A valid image (correct MIME, extension, and content) is accepted.
     */
    public function testImageValidUploadIsAccepted(): void
    {
        $tmpFile   = $this->makeTmpFile(self::REAL_JPEG_BYTES);
        $validator = UploadContentValidator::forType('image');

        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'image/jpeg', 'name' => 'photo.jpg']
        );

        $this->assertNull($reason);
    }

    /**
     * A missing file is rejected with 'missing_file'.
     */
    public function testImageMissingFileIsRejected(): void
    {
        $validator = UploadContentValidator::forType('image');

        $this->assertSame('missing_file', $validator->rejectionReasonFor(null));
    }

    /**
     * A client-declared MIME type outside the image allow-list is rejected
     * with 'unsupported_mime_type', even before the extension is checked.
     */
    public function testImageWrongMimeTypeIsRejected(): void
    {
        $tmpFile   = $this->makeTmpFile(self::REAL_JPEG_BYTES);
        $validator = UploadContentValidator::forType('image');

        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'application/pdf', 'name' => 'photo.jpg']
        );

        $this->assertSame('unsupported_mime_type', $reason);
    }

    /**
     * A correct MIME type but disallowed extension is rejected with
     * 'unsupported_extension'.
     */
    public function testImageWrongExtensionIsRejected(): void
    {
        $tmpFile   = $this->makeTmpFile(self::REAL_JPEG_BYTES);
        $validator = UploadContentValidator::forType('image');

        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'image/jpeg', 'name' => 'photo.txt']
        );

        $this->assertSame('unsupported_extension', $reason);
    }

    /**
     * A client-declared MIME type and extension that both claim to be an
     * image, but whose actual on-disk content isn't, is rejected with
     * 'unsupported_mime_type' based on the detected-content check.
     */
    public function testImageMismatchedDetectedContentIsRejected(): void
    {
        $tmpFile   = $this->makeTmpFile('<html><script>alert(1)</script></html>');
        $validator = UploadContentValidator::forType('image');

        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'image/jpeg', 'name' => 'photo.jpg']
        );

        $this->assertSame('unsupported_mime_type', $reason);
    }

    // -------------------------------------------------------------------------
    // forType('file')
    // -------------------------------------------------------------------------

    /**
     * A valid PDF (correct MIME, extension, content, and magic bytes) is
     * accepted.
     */
    public function testFileValidUploadIsAccepted(): void
    {
        $tmpFile   = $this->makeTmpFile('%PDF-1.4 fake pdf data');
        $validator = UploadContentValidator::forType('file');

        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'application/pdf', 'name' => 'document.pdf']
        );

        $this->assertNull($reason);
    }

    /**
     * A missing file is rejected with 'missing_file'.
     */
    public function testFileMissingFileIsRejected(): void
    {
        $validator = UploadContentValidator::forType('file');

        $this->assertSame('missing_file', $validator->rejectionReasonFor(null));
    }

    /**
     * A client-declared MIME type outside the 'file' allow-list (only
     * application/pdf) is rejected with 'unsupported_mime_type'.
     */
    public function testFileWrongMimeTypeIsRejected(): void
    {
        $tmpFile   = $this->makeTmpFile('%PDF-1.4 fake pdf data');
        $validator = UploadContentValidator::forType('file');

        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'image/jpeg', 'name' => 'document.pdf']
        );

        $this->assertSame('unsupported_mime_type', $reason);
    }

    /**
     * A correct MIME type but disallowed extension is rejected with
     * 'unsupported_extension'.
     */
    public function testFileWrongExtensionIsRejected(): void
    {
        $tmpFile   = $this->makeTmpFile('%PDF-1.4 fake pdf data');
        $validator = UploadContentValidator::forType('file');

        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'application/pdf', 'name' => 'document.txt']
        );

        $this->assertSame('unsupported_extension', $reason);
    }

    /**
     * A client-declared MIME type and extension that both claim to be a PDF,
     * but whose actual on-disk content isn't, is rejected with
     * 'unsupported_mime_type' based on the detected-content check.
     */
    public function testFileMismatchedDetectedContentIsRejected(): void
    {
        $tmpFile   = $this->makeTmpFile('<html><script>alert(1)</script></html>');
        $validator = UploadContentValidator::forType('file');

        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'application/pdf', 'name' => 'document.pdf']
        );

        $this->assertSame('unsupported_mime_type', $reason);
    }

    /**
     * A file whose declared MIME/extension and detected content (per
     * fileinfo, which tolerates a small leading offset before the '%PDF-'
     * marker) both pass as a legitimate PDF, but whose first 5 bytes don't
     * literally start with '%PDF-', is rejected with 'unsupported_mime_type'
     * by the stricter magic-bytes check — a 'file'-only rule not applied to
     * 'image' uploads.
     */
    public function testFileMissingPdfMagicBytesIsRejected(): void
    {
        $tmpFile   = $this->makeTmpFile(' %PDF-1.4 fake pdf data with a leading byte offset');
        $validator = UploadContentValidator::forType('file');

        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'application/pdf', 'name' => 'document.pdf']
        );

        $this->assertSame('unsupported_mime_type', $reason);
    }

    /**
     * A file's magic bytes are checked only when checkPdfMagicBytes is true
     * (i.e. only for the 'file' upload type); an 'image' upload with content
     * that happens to start with '%PDF-' but is otherwise a valid image MIME
     * type/extension is still rejected earlier, by the MIME/content checks,
     * confirming the magic-bytes check itself is 'file'-only rather than
     * universally applied.
     */
    public function testImageUploadIsNotSubjectToPdfMagicBytesCheck(): void
    {
        $tmpFile   = $this->makeTmpFile(self::REAL_JPEG_BYTES);
        $validator = UploadContentValidator::forType('image');

        // Valid JPEG content, none of which starts with '%PDF-', still
        // passes for the 'image' type since the magic-bytes check never
        // runs for it.
        $reason = $validator->rejectionReasonFor(
            ['tmp_name' => $tmpFile, 'type' => 'image/jpeg', 'name' => 'photo.jpg']
        );

        $this->assertNull($reason);
    }
}
