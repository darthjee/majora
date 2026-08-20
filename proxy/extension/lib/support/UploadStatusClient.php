<?php

namespace Tent\RequestHandlers;

/**
 * Advances the backend Upload state machine (uploading → uploaded) for a
 * single upload type, via PATCH /uploads/:upload_type/:id.json calls issued
 * through a shared BackendClient.
 */
class UploadStatusClient
{
    /**
     * Extra header, on top of ForwardedHeaderFilter's base allow-list,
     * forwarded to the backend on both PATCH calls in updateStatus().
     * Matching is case-insensitive; any incoming header not covered by the
     * base list or this one (e.g. X-Trace-Id) is dropped before the backend
     * request is issued.
     *
     * The client's own Accept-Encoding is never forwarded either way (it
     * isn't on the base allow-list or here), but BackendClient adds its own
     * Accept-Encoding: gzip to every outgoing request regardless, and
     * transparently decodes a gzip-compressed response before it ever
     * reaches requestUploadingStatus()/requestUploadedStatus(), so a
     * compressed body from the backend no longer risks breaking
     * json_decode().
     *
     * @var string[]
     */
    private const EXTRA_ALLOWED_FORWARD_HEADERS = [
        'X-Upload-Token',
    ];

    /** @var BackendClient Client used for backend calls. */
    private BackendClient $client;

    /** @var string The upload type ('image' or 'file'). */
    private string $uploadType;

    /**
     * @param BackendClient $client     Client used for backend calls.
     * @param string        $uploadType The upload type ('image' or 'file').
     */
    public function __construct(BackendClient $client, string $uploadType)
    {
        $this->client = $client;
        $this->uploadType = $uploadType;
    }

    /**
     * Calls the backend with status=uploading and returns the file_path from
     * the response.
     *
     * @param string $uploadId The upload id.
     * @param array  $headers  Incoming request headers to forward.
     * @return string The file_path returned by the backend.
     * @throws BackendErrorException When the backend call fails, or the
     *                                response doesn't include a file_path.
     */
    public function requestUploadingStatus(string $uploadId, array $headers): string
    {
        $result = $this->updateStatus($uploadId, 'uploading', $headers);

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $result['body']);
        }

        $body     = json_decode($result['body'], true);
        $filePath = ($body['file_path'] ?? null);
        if ($filePath === null) {
            throw new BackendErrorException(500, 'Internal Server Error');
        }

        return $filePath;
    }

    /**
     * Calls the backend with status=uploaded.
     *
     * @param string $uploadId The upload id.
     * @param array  $headers  Incoming request headers to forward.
     * @return void
     * @throws BackendErrorException When the backend call fails.
     */
    public function requestUploadedStatus(string $uploadId, array $headers): void
    {
        $result = $this->updateStatus($uploadId, 'uploaded', $headers);

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $result['body']);
        }
    }

    /**
     * Updates the status of an upload via PATCH /uploads/:upload_type/:id.json.
     *
     * @param string $uploadId The upload id.
     * @param string $status   The new status (e.g. 'uploading', 'uploaded').
     * @param array  $headers  Raw, unfiltered incoming request headers;
     *                         BackendClient filters them down to its base
     *                         allow-list plus
     *                         UploadStatusClient::EXTRA_ALLOWED_FORWARD_HEADERS,
     *                         overrides Content-Type to application/json
     *                         (the backend expects a JSON body regardless
     *                         of how the original multipart request was
     *                         encoded), and overrides Host/X-Forwarded-Host.
     * @return array{body: string, httpCode: int, headers: string[]}
     */
    private function updateStatus(string $uploadId, string $status, array $headers): array
    {
        return $this->client->request(
            'PATCH',
            '/uploads/' . $this->uploadType . '/' . $uploadId . '.json',
            $headers,
            json_encode(['status' => $status]),
            self::EXTRA_ALLOWED_FORWARD_HEADERS,
            ['Content-Type' => 'application/json']
        );
    }
}
