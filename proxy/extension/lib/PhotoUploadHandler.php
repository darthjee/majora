<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;
use Tent\Http\CurlHttpClient;
use Tent\Http\HttpClientInterface;
use Tent\Log\Logger;
use Tent\Middlewares\RenameHeaderMiddleware;
use Tent\Middlewares\SetHeadersMiddleware;
use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Handles multipart photo uploads for the POST /uploads/:id/submit route.
 *
 * The client-facing route uses POST (not PATCH) because PHP only
 * auto-populates $_FILES for multipart/form-data bodies sent over POST;
 * for PATCH/PUT the body is never parsed into $_FILES, leaving uploaded
 * files undetectable regardless of a valid Content-Disposition part.
 *
 * Validates the uploaded file, orchestrates two backend PATCH calls to advance
 * the Upload state machine (uploading → uploaded), and writes the file to the
 * photos volume at <photos_path>/<file_path>.
 */
class PhotoUploadHandler extends RequestHandler
{
    /** @var string Backend host URL (e.g. http://backend:8080) */
    private string $host;

    /** @var HttpClientInterface HTTP client used for backend calls */
    private HttpClientInterface $httpClient;

    /** @var string Base path where photos are written */
    private string $photosBasePath;

    /**
     * @param string                   $host           Backend host URL.
     * @param HttpClientInterface|null $httpClient     HTTP client (defaults to CurlHttpClient).
     * @param string                   $photosBasePath Base directory for photo storage.
     */
    public function __construct(
        string $host,
        ?HttpClientInterface $httpClient = null,
        string $photosBasePath
    ) {
        $this->host = $host;
        $this->httpClient = $httpClient ?? new CurlHttpClient();
        $this->photosBasePath = $photosBasePath;

        // The incoming request's original Host header (e.g. the browser-facing
        // `moria.ffavs.net`) must never be forwarded as-is when the backend lives
        // behind a different host (e.g. `moria-api.ffavs.net`) — edge providers
        // like Cloudflare reject that mismatch with a 403 before the request ever
        // reaches the application. This mirrors what Tent's
        // DefaultProxyRequestHandler does for every other backend-proxied route.
        $this->addMiddleware(new RenameHeaderMiddleware('Host', 'X-Forwarded-Host'));
        $this->addMiddleware(new SetHeadersMiddleware(['Host' => $this->backendHost()]));
    }

    /**
     * Builds a PhotoUploadHandler from configuration parameters.
     *
     * @param array $params Must contain 'host' (string) and 'photos_path' (string).
     * @return self
     */
    public static function build(array $params): self
    {
        return new self($params['host'] ?? '', null, $params['photos_path'] ?? '');
    }

    /**
     * Processes the photo upload request.
     *
     * 1. Extracts the upload id from /uploads/:id/submit.
     * 2. Validates the uploaded file is a supported image type.
     * 3. Calls PATCH /uploads/:id.json with status=uploading; reads file_path from response.
     * 4. Writes the uploaded file to <photosBasePath>/<file_path>.
     * 5. Calls PATCH /uploads/:id.json with status=uploaded.
     * 6. Returns 200 with the saved file_path as JSON on success, or forwards
     *    the error code on failure.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        // 1. Extract upload id from path: /uploads/:id/submit
        // 2. Validate the uploaded file
        // 3. Call backend: status=uploading → receive file_path
        // 4. Write file to photos volume
        // 5. Call backend: status=uploaded
        try {
            $uploadId = $this->extractUploadId($request);
            $file = $this->validateUploadedFile($request);

            $headers = $request->headers();
            $filePath = $this->requestUploadingStatus($uploadId, $headers);

            $destination = $this->writePhotoFile($filePath, $file);

            $this->requestUploadedStatus($uploadId, $headers);
        } catch (UnprocessableUploadException $e) {
            return $this->unprocessableEntityResponse($e->getMessage(), $e->file());
        } catch (BackendErrorException $e) {
            return new Response(['httpCode' => $e->httpCode(), 'body' => $e->body()]);
        } catch (InvalidArgumentException $e) {
            return new Response(['httpCode' => 400, 'body' => 'Bad Request']);
        }

        return new Response([
            'httpCode' => 200,
            'headers'  => ['Content-Type: application/json'],
            'body'     => json_encode(['file_path' => $destination]),
        ]);
    }

    /**
     * Extracts the upload id from the request path /uploads/:id/submit.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return string The upload id.
     * @throws InvalidArgumentException When the path doesn't match /uploads/:id/submit.
     */
    private function extractUploadId(RequestInterface $request): string
    {
        $path = $request->requestPath();
        if (!preg_match('#^/uploads/(\d+)/submit$#', $path, $matches)) {
            throw new InvalidArgumentException('Invalid upload path: ' . $path);
        }

        return $matches[1];
    }

    /**
     * Extracts the uploaded file from the request and validates it.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return array The validated raw $_FILES entry.
     * @throws UnprocessableUploadException When the file is missing or unsupported.
     */
    private function validateUploadedFile(RequestInterface $request): array
    {
        $files = $request->uploadedFiles();
        $file = $files['file'] ?? null;
        $reason = $this->imageRejectionReason($file);

        if ($reason !== null) {
            throw new UnprocessableUploadException($reason, $file);
        }

        return $file;
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
    private function requestUploadingStatus(string $uploadId, array $headers): string
    {
        $result = $this->updateStatus($uploadId, 'uploading', $headers);

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $result['body']);
        }

        $body     = json_decode($result['body'], true);
        $filePath = $body['file_path'] ?? null;
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
    private function requestUploadedStatus(string $uploadId, array $headers): void
    {
        $result = $this->updateStatus($uploadId, 'uploaded', $headers);

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $result['body']);
        }
    }

    /**
     * Updates the status of an upload via PATCH /uploads/:id.json.
     *
     * @param string $uploadId The upload id.
     * @param string $status   The new status (e.g. 'uploading', 'uploaded').
     * @param array  $headers  Incoming request headers to forward; Content-Type
     *                         is overridden to application/json since the
     *                         backend expects a JSON body regardless of how the
     *                         original multipart request was encoded. Host is
     *                         already overridden by the middlewares added in
     *                         the constructor.
     * @return array{body: string, httpCode: int, headers: string[]}
     */
    private function updateStatus(string $uploadId, string $status, array $headers): array
    {
        $headers['Content-Type'] = 'application/json';

        return $this->httpClient->request(
            'PATCH',
            $this->host . '/uploads/' . $uploadId . '.json',
            $headers,
            json_encode(['status' => $status])
        );
    }

    /**
     * Derives the bare host (no scheme, no trailing path) the backend actually
     * expects in the Host header.
     *
     * @return string The backend host, e.g. 'moria-api.ffavs.net'.
     */
    private function backendHost(): string
    {
        return parse_url($this->host, PHP_URL_HOST) ?? $this->host;
    }

    /**
     * Writes the uploaded file to <photosBasePath>/<filePath>.
     *
     * @param string $filePath The file_path returned by the backend.
     * @param array  $file     The raw $_FILES entry for the uploaded file.
     * @return string The full destination path the file was written to.
     */
    private function writePhotoFile(string $filePath, array $file): string
    {
        $destination = $this->photosBasePath . '/' . $filePath;
        $dir = dirname($destination);

        Logger::error('[upload] - saving photo file to: ' . $destination);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents($destination, file_get_contents($file['tmp_name']));

        return $destination;
    }

    /**
     * Determines why an uploaded file would be rejected, if at all.
     *
     * Checks the MIME type and file extension independently — either one
     * can be the actual cause of rejection — so the specific reason can be
     * surfaced in both logs and the HTTP response, instead of a plain
     * boolean. The MIME type is checked first, so when both checks would
     * fail, 'unsupported_mime_type' takes precedence.
     *
     * @param array|null $file A single entry from $request->uploadedFiles() (raw
     *                         $_FILES format), or null when no file was sent.
     * @return string|null One of 'missing_file', 'unsupported_mime_type',
     *                      'unsupported_extension', or null when the file is valid.
     */
    private function imageRejectionReason(?array $file): ?string
    {
        if ($file === null) {
            return 'missing_file';
        }

        $allowedMimeTypes  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        $mimeType = $file['type'] ?? '';
        $ext      = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));

        if (!in_array($mimeType, $allowedMimeTypes, true)) {
            return 'unsupported_mime_type';
        }

        if (!in_array($ext, $allowedExtensions, true)) {
            return 'unsupported_extension';
        }

        return null;
    }

    /**
     * Logs the rejection reason and builds the structured 422 JSON response
     * for a rejected image upload.
     *
     * @param string     $reason One of 'missing_file', 'unsupported_mime_type',
     *                           'unsupported_extension'.
     * @param array|null $file   The raw $_FILES entry, or null when missing.
     * @return Response
     */
    private function unprocessableEntityResponse(string $reason, ?array $file): Response
    {
        $filename = $file['name'] ?? '';
        $mimeType = $file['type'] ?? '';

        Logger::warn(
            '[upload] - rejected image upload, reason: ' . $reason .
            ', filename: ' . $filename . ', mimeType: ' . $mimeType
        );

        return new Response([
            'httpCode' => 422,
            'headers'  => ['Content-Type: application/json'],
            'body'     => json_encode([
                'error'    => 'Unprocessable Entity',
                'reason'   => $reason,
                'filename' => $filename,
                'mimeType' => $mimeType,
            ]),
        ]);
    }
}
