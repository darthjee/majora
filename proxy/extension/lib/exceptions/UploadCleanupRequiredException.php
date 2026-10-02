<?php

namespace Tent\RequestHandlers;

/**
 * Raised by UploadStatusClient::requestUploadedStatus() when the finalize
 * (status=uploaded) call answers 404 with a JSON body carrying a non-empty
 * string `cleanup_path`: the owning photo row was deleted while the replace
 * was in flight, so the file the proxy just wrote must be removed.
 *
 * Extends BackendErrorException so it still carries the backend's httpCode
 * and body, which are forwarded to the client once the cleanup is done.
 */
class UploadCleanupRequiredException extends BackendErrorException
{

    /** @var string Path (relative to the upload base path) to delete. */
    private string $cleanupPath;

    /**
     * @param int    $httpCode     HTTP status code to forward to the client.
     * @param string $responseBody Response body to forward to the client.
     * @param string $cleanupPath  Path (relative to the upload base path) to delete.
     */
    public function __construct(int $httpCode, string $responseBody, string $cleanupPath)
    {
        parent::__construct($httpCode, $responseBody);
        $this->cleanupPath = $cleanupPath;
    }

    /**
     * @return string Path (relative to the upload base path) to delete.
     */
    public function cleanupPath(): string
    {
        return $this->cleanupPath;
    }
}
