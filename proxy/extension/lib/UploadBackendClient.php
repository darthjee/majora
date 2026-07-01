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
     *                         is overridden to application/json and Host is
     *                         overridden to the backend's own host.
     * @return array{body: string, httpCode: int, headers: string[]}
     */
    public function updateStatus(string $uploadId, string $status, array $headers): array
    {
        $backendHeaders = array_merge($headers, [
            'Content-Type' => 'application/json',
            'Host'         => $this->backendHost(),
        ]);

        return $this->httpClient->request(
            'PATCH',
            $this->host . '/uploads/' . $uploadId . '.json',
            $backendHeaders,
            json_encode(['status' => $status])
        );
    }

    /**
     * Derives the bare host (no scheme, no trailing path) the backend actually
     * expects in the Host header.
     *
     * The incoming request's original Host header (e.g. the browser-facing
     * `moria.ffavs.net`) must never be forwarded as-is when the backend lives
     * behind a different host (e.g. `moria-api.ffavs.net`) — edge providers
     * like Cloudflare reject that mismatch with a 403 before the request ever
     * reaches the application. This mirrors what Tent's
     * DefaultProxyRequestHandler already does for every other backend-proxied
     * route via RenameHeaderMiddleware + SetHeadersMiddleware.
     *
     * @return string The backend host, e.g. 'moria-api.ffavs.net'.
     */
    private function backendHost(): string
    {
        return parse_url($this->host, PHP_URL_HOST) ?? $this->host;
    }
}
