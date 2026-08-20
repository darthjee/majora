<?php

namespace Tent\RequestHandlers;

/**
 * Determines why an uploaded file would be rejected, if at all, for a given
 * upload type ('image' or 'file').
 *
 * Checks the MIME type, file extension, and actual on-disk content
 * independently — any one of them can be the actual cause of rejection — so
 * the specific reason can be surfaced in both logs and the HTTP response,
 * instead of a plain boolean. The client-supplied MIME type and extension are
 * trivially spoofable (an attacker fully controls both the Content-Type of a
 * multipart part and the filename), so once those allow-list checks pass, the
 * actual on-disk content is additionally inspected via fileinfo — this is the
 * only one of the checks that isn't just trusting client input. PDF uploads
 * ('file' type) additionally get their leading bytes checked against the
 * well-known '%PDF-' magic header, since it's cheap to check and a real PDF
 * is guaranteed to start with it.
 */
class UploadContentValidator
{
    /**
     * Allow-list of MIME types accepted for 'image' uploads.
     *
     * @var string[]
     */
    private const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    /**
     * Allow-list of extensions accepted for 'image' uploads.
     *
     * @var string[]
     */
    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    /**
     * Allow-list of MIME types accepted for 'file' uploads.
     *
     * @var string[]
     */
    private const FILE_MIME_TYPES = ['application/pdf'];

    /**
     * Allow-list of extensions accepted for 'file' uploads.
     *
     * @var string[]
     */
    private const FILE_EXTENSIONS = ['pdf'];

    /**
     * Allow-list of MIME types accepted for this instance's upload type.
     *
     * @var string[]
     */
    private array $allowedMimeTypes;

    /** @var UploadFilenameValidator Validates uploads against this instance's extension allow-list. */
    private UploadFilenameValidator $filenameValidator;

    /** @var bool Whether the '%PDF-' magic-bytes check runs on top of the fileinfo content check. */
    private bool $checkPdfMagicBytes;

    /**
     * @param string[]                $allowedMimeTypes   Allow-list of MIME types.
     * @param UploadFilenameValidator $filenameValidator  Validates against the extension allow-list.
     * @param bool                    $checkPdfMagicBytes Whether to additionally check for the
     *                                                     '%PDF-' magic header.
     */
    private function __construct(
        array $allowedMimeTypes,
        UploadFilenameValidator $filenameValidator,
        bool $checkPdfMagicBytes
    ) {
        $this->allowedMimeTypes = $allowedMimeTypes;
        $this->filenameValidator = $filenameValidator;
        $this->checkPdfMagicBytes = $checkPdfMagicBytes;
    }

    /**
     * Builds an UploadContentValidator configured for $uploadType.
     *
     * @param string $uploadType The upload type ('image' or 'file').
     * @return self
     */
    public static function forType(string $uploadType): self
    {
        if ($uploadType === 'file') {
            return new self(
                self::FILE_MIME_TYPES,
                new UploadFilenameValidator(self::FILE_EXTENSIONS),
                true
            );
        }

        return new self(
            self::IMAGE_MIME_TYPES,
            new UploadFilenameValidator(self::IMAGE_EXTENSIONS),
            false
        );
    }

    /**
     * Determines why an uploaded file would be rejected, if at all.
     *
     * @param array|null $file A single entry from $request->uploadedFiles() (raw
     *                         $_FILES format), or null when no file was sent.
     * @return string|null One of 'missing_file', 'unsupported_mime_type',
     *                      'unsupported_extension', or null when the file is valid.
     */
    public function rejectionReasonFor(?array $file): ?string
    {
        if ($file === null) {
            return 'missing_file';
        }

        $mimeType = ($file['type'] ?? '');
        $filename = ($file['name'] ?? '');
        $tmpName  = ($file['tmp_name'] ?? '');

        if (!in_array($mimeType, $this->allowedMimeTypes, true)) {
            return 'unsupported_mime_type';
        }

        if (!$this->filenameValidator->isAllowed($filename)) {
            return 'unsupported_extension';
        }

        if (!in_array($this->detectedMimeType($tmpName), $this->allowedMimeTypes, true)) {
            return 'unsupported_mime_type';
        }

        if ($this->checkPdfMagicBytes && !$this->hasPdfMagicBytes($tmpName)) {
            return 'unsupported_mime_type';
        }

        return null;
    }

    /**
     * Detects the actual MIME type of the file at $tmpName by inspecting its
     * content (magic bytes) via the fileinfo extension, ignoring whatever
     * Content-Type the client declared.
     *
     * @param string $tmpName Path to the uploaded file's temporary location.
     * @return string|null The detected MIME type, or null when the file
     *                      can't be opened/inspected (treated as a rejection
     *                      by the caller, i.e. fails closed).
     */
    private function detectedMimeType(string $tmpName): ?string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo === false) {
            return null;
        }

        $mimeType = finfo_file($finfo, $tmpName);
        finfo_close($finfo);

        return ($mimeType === false ? null : $mimeType);
    }

    /**
     * Checks whether the file at $tmpName starts with the '%PDF-' magic
     * header that every valid PDF file begins with.
     *
     * @param string $tmpName Path to the uploaded file's temporary location.
     * @return bool True when the file's first 5 bytes are '%PDF-'.
     */
    private function hasPdfMagicBytes(string $tmpName): bool
    {
        $handle = @fopen($tmpName, 'rb');
        if ($handle === false) {
            return false;
        }

        $header = fread($handle, 5);
        fclose($handle);

        return $header === '%PDF-';
    }
}
