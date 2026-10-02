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
     * Calls the backend with status=uploaded and returns its headers (so the
     * caller can act on backend-driven instructions such as X-Cache-Clear,
     * see ResponseCacheClearer) along with the optional `previous_path`
     * from its JSON body.
     *
     * @param string $uploadId The upload id.
     * @param array  $headers  Incoming request headers to forward.
     * @return UploadFinalizeResult
     * @throws UploadCleanupRequiredException When the backend answers 404
     *                                        with a non-empty `cleanup_path`.
     * @throws BackendErrorException          When the backend call fails
     *                                        otherwise.
     */
    public function requestUploadedStatus(string $uploadId, array $headers): UploadFinalizeResult
    {
        $result = $this->updateStatus($uploadId, 'uploaded', $headers);
        $body   = (string) ($result['body'] ?? '');

        if ($result['httpCode'] === 404) {
            $cleanupPath = self::stringField($body, 'cleanup_path');
            if ($cleanupPath !== null) {
                throw new UploadCleanupRequiredException(404, $body, $cleanupPath);
            }
        }

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $body);
        }

        return new UploadFinalizeResult(
            ($result['headers'] ?? []),
            self::stringField($body, 'previous_path')
        );
    }

    /**
     * Reads a non-empty string field from a JSON object body.
     *
     * @param string $body  Raw response body.
     * @param string $field Field name.
     * @return string|null The field value, or null when the body isn't a
     *                     JSON object or the field is missing, empty or not
     *                     a string.
     */
    private static function stringField(string $body, string $field): ?string
    {
        $decoded = json_decode($body, true);
        if (!is_array($decoded)) {
            return null;
        }

        $value = ($decoded[$field] ?? null);

        return (is_string($value) && $value !== '') ? $value : null;
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
