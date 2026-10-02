<?php

namespace Tent\RequestHandlers;

/**
 * Successful (200) outcome of the finalize (status=uploaded) backend call:
 * the response headers (e.g. X-Cache-Clear) and the optional
 * `previous_path` from its JSON body.
 */
class UploadFinalizeResult
{

    /** @var string[] Backend response headers as "Name: Value" lines. */
    private array $headers;

    /** @var string|null Old file path to remove, when the path changed. */
    private ?string $previousPath;

    /**
     * @param string[]    $headers      Backend response headers as "Name: Value" lines.
     * @param string|null $previousPath Old file path to remove, when the path changed.
     */
    public function __construct(array $headers, ?string $previousPath)
    {
        $this->headers = $headers;
        $this->previousPath = $previousPath;
    }

    /**
     * @return string[] Backend response headers as "Name: Value" lines.
     */
    public function headers(): array
    {
        return $this->headers;
    }

    /**
     * @return string|null Old file path (relative to the upload base path)
     *                     to remove, or null when there is none.
     */
    public function previousPath(): ?string
    {
        return $this->previousPath;
    }
}
