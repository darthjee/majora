<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;
use Tent\Http\HttpClientInterface;
use Tent\Log\Logger;
use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Handles multipart uploads for the POST /uploads/:upload_type/:id/submit route.
 *
 * The client-facing route uses POST (not PATCH) because PHP only
 * auto-populates $_FILES for multipart/form-data bodies sent over POST;
 * for PATCH/PUT the body is never parsed into $_FILES, leaving uploaded
 * files undetectable regardless of a valid Content-Disposition part.
 *
 * Supports two upload types, each with its own validation rules and storage
 * base path:
 *   - 'image': the original photo upload flow (MIME/extension allow-list,
 *     stored under photosBasePath).
 *   - 'file': PDF-only document uploads (stored under filesBasePath).
 *
 * Validates the uploaded file per its type (via UploadContentValidator),
 * orchestrates two backend PATCH calls to advance the Upload state machine
 * (uploading → uploaded) via UploadStatusClient, and writes the file to the
 * appropriate volume at <basePath>/<file_path> via UploadStorageResolver.
 */
class UploadHandler extends RequestHandler
{
    /**
     * Upload types accepted in the URL's :upload_type segment.
     *
     * @var string[]
     */
    private const ALLOWED_UPLOAD_TYPES = ['image', 'file'];

    /** @var BackendClient Client used for backend calls. */
    private BackendClient $client;

    /** @var string Base path where 'image' uploads are written */
    private string $photosBasePath;

    /** @var string Base path where 'file' uploads are written */
    private string $filesBasePath;

    /**
     * @param string                   $host           Backend host URL.
     * @param HttpClientInterface|null $httpClient     HTTP client (defaults to CurlHttpClient).
     * @param string                   $photosBasePath Base directory for 'image' upload storage.
     * @param string                   $filesBasePath  Base directory for 'file' upload storage.
     */
    public function __construct(
        string $host,
        ?HttpClientInterface $httpClient=null,
        string $photosBasePath='',
        string $filesBasePath=''
    ) {
        $this->client = new BackendClient($host, $httpClient);
        $this->photosBasePath = $photosBasePath;
        $this->filesBasePath = $filesBasePath;
    }

    /**
     * Builds an UploadHandler from configuration parameters.
     *
     * @param array $params Must contain 'host' (string), 'photos_path' (string) and
     *                      'files_path' (string).
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            ($params['host'] ?? ''),
            null,
            ($params['photos_path'] ?? ''),
            ($params['files_path'] ?? '')
        );
    }

    /**
     * Processes the upload request.
     *
     * 1. Extracts the upload type and id from /uploads/:upload_type/:id/submit.
     * 2. Validates the uploaded file against the type's validation rules.
     * 3. Calls PATCH /uploads/:upload_type/:id.json with status=uploading; reads
     *    file_path from response.
     * 4. Writes the uploaded file to <basePath>/<file_path>, where basePath
     *    depends on the upload type.
     * 5. Calls PATCH /uploads/:upload_type/:id.json with status=uploaded.
     * 6. Returns 200 with the saved file_path as JSON on success, or forwards
     *    the error code on failure.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        try {
            ['type' => $uploadType, 'id' => $uploadId] = $this->extractUploadIdentifiers($request);

            $file = ($request->uploadedFiles()['file'] ?? null);
            $reason = UploadContentValidator::forType($uploadType)->rejectionReasonFor($file);
            if ($reason !== null) {
                throw new UnprocessableUploadException($reason, $file);
            }

            $headers = $request->headers();
            $statusClient = new UploadStatusClient($this->client, $uploadType);
            $filePath = $statusClient->requestUploadingStatus($uploadId, $headers);

            $destination = UploadStorageResolver::forType($uploadType, $this->photosBasePath, $this->filesBasePath)
                ->write($filePath, $file);

            $statusClient->requestUploadedStatus($uploadId, $headers);
        } catch (UnprocessableUploadException $e) {
            return $this->unprocessableEntityResponse($e->getMessage(), $e->file());
        } catch (BackendErrorException $e) {
            return new Response(['httpCode' => $e->httpCode(), 'body' => $e->body()]);
        } catch (InvalidArgumentException $e) {
            return new Response(['httpCode' => 400, 'body' => 'Bad Request']);
        }

        return new Response(
            [
            'httpCode' => 200,
            'headers'  => ['Content-Type: application/json'],
            'body'     => json_encode(['file_path' => $destination]),
            ]
        );
    }

    /**
     * Extracts the upload type and id from the request path
     * /uploads/:upload_type/:id/submit.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return array{type: string, id: string} The upload type and id.
     * @throws InvalidArgumentException When the path doesn't match
     *                                   /uploads/:upload_type/:id/submit, or
     *                                   the upload type isn't 'image' or 'file'.
     */
    private function extractUploadIdentifiers(RequestInterface $request): array
    {
        $path = $request->requestPath();
        if (!preg_match('#^/uploads/([a-z]+)/(\d+)/submit$#', $path, $matches)) {
            throw new InvalidArgumentException('Invalid upload path: ' . $path);
        }

        $uploadType = $matches[1];
        if (!in_array($uploadType, self::ALLOWED_UPLOAD_TYPES, true)) {
            throw new InvalidArgumentException('Invalid upload type: ' . $uploadType);
        }

        return ['type' => $uploadType, 'id' => $matches[2]];
    }

    /**
     * Logs the rejection reason and builds the structured 422 JSON response
     * for a rejected upload.
     *
     * @param string     $reason One of 'missing_file', 'unsupported_mime_type',
     *                           'unsupported_extension'.
     * @param array|null $file   The raw $_FILES entry, or null when missing.
     * @return Response
     */
    private function unprocessableEntityResponse(string $reason, ?array $file): Response
    {
        $filename = ($file['name'] ?? '');
        $mimeType = ($file['type'] ?? '');

        Logger::warn(
            '[upload] - rejected upload, reason: ' . $reason .
            ', filename: ' . $filename . ', mimeType: ' . $mimeType
        );

        return new Response(
            [
            'httpCode' => 422,
            'headers'  => ['Content-Type: application/json'],
            'body'     => json_encode(
                [
                'error'    => 'Unprocessable Entity',
                'reason'   => $reason,
                'filename' => $filename,
                'mimeType' => $mimeType,
                ]
            ),
            ]
        );
    }
}
