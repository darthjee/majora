<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;

/**
 * Raised when an uploaded file fails image validation in PhotoUploadHandler.
 *
 * Carries the rejected file alongside the rejection reason (used as the
 * exception message), so the catch site has everything it needs to build the
 * 422 response without re-extracting the file from the request.
 */
class UnprocessableUploadException extends InvalidArgumentException
{
    /** @var array|null The raw $_FILES entry that was rejected, or null when missing. */
    private ?array $uploadedFile;

    /**
     * @param string     $reason       One of 'missing_file', 'unsupported_mime_type',
     *                                 'unsupported_extension'.
     * @param array|null $uploadedFile The raw $_FILES entry, or null when missing.
     */
    public function __construct(string $reason, ?array $uploadedFile)
    {
        parent::__construct($reason);
        $this->uploadedFile = $uploadedFile;
    }

    /**
     * @return array|null The rejected file, or null when no file was sent.
     */
    public function file(): ?array
    {
        return $this->uploadedFile;
    }
}
