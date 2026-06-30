<?php

namespace Tent\RequestHandlers;

use RuntimeException;

/**
 * Raised when a backend call made by PhotoUploadHandler fails or returns an
 * unexpected response.
 *
 * Carries the httpCode and body that should be forwarded back to the client,
 * so the catch site can build the Response without re-deriving them.
 */
class BackendErrorException extends RuntimeException
{
    /** @var int HTTP status code to forward to the client. */
    private int $httpCode;

    /** @var string Response body to forward to the client. */
    private string $responseBody;

    /**
     * @param int    $httpCode     HTTP status code to forward to the client.
     * @param string $responseBody Response body to forward to the client.
     */
    public function __construct(int $httpCode, string $responseBody)
    {
        parent::__construct('Backend error: ' . $httpCode);
        $this->httpCode = $httpCode;
        $this->responseBody = $responseBody;
    }

    /**
     * @return int The HTTP status code to forward to the client.
     */
    public function httpCode(): int
    {
        return $this->httpCode;
    }

    /**
     * @return string The response body to forward to the client.
     */
    public function body(): string
    {
        return $this->responseBody;
    }
}
