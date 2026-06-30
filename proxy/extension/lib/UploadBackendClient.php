<?php

namespace Tent\RequestHandlers;

use Tent\Http\HttpClientInterface;

/**
 * Sends Upload status updates to the backend on behalf of PhotoUploadHandler.
 *
 * Wraps the PATCH /uploads/:id.json call used to advance the Upload state
 * machine (uploading → uploaded), forwarding the caller's headers while
 * overriding Content-Type, since the backend expects a JSON body regardless
 * of how the original multipart request was encoded.
 */
class UploadBackendClient
{
    /** @var string Backend host URL (e.g. http://backend:8080) */
    private string $host;

    /** @var HttpClientInterface HTTP client used for backend calls */
    private HttpClientInterface $httpClient;

    /**
     * @param string              $host       Backend host URL.
     * @param HttpClientInterface $httpClient HTTP client used to issue the request.
     */
    public function __construct(string $host, HttpClientInterface $httpClient)
    {
        $this->host = $host;
        $this->httpClient = $httpClient;
    }

    /**
     * Updates the status of an upload via PATCH /uploads/:id.json.
     *
     * @param string $uploadId The upload id.
     * @param string $status   The new status (e.g. 'uploading', 'uploaded').
     * @param array  $headers  Incoming request headers to forward; Content-Type
     *                         is overridden to application/json.
     * @return array{body: string, httpCode: int, headers: string[]}
     */
    public function updateStatus(string $uploadId, string $status, array $headers): array
    {
        $backendHeaders = array_merge($headers, ['Content-Type' => 'application/json']);

        return $this->httpClient->request(
            'PATCH',
            $this->host . '/uploads/' . $uploadId . '.json',
            $backendHeaders,
            json_encode(['status' => $status])
        );
    }
}
