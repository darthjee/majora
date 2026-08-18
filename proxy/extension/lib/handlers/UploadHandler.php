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
 * Validates the uploaded file per its type, orchestrates two backend PATCH
 * calls to advance the Upload state machine (uploading → uploaded), and
 * writes the file to the appropriate volume at <basePath>/<file_path>.
 */
class UploadHandler extends RequestHandler
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

    /**
     * Upload types accepted in the URL's :upload_type segment.
     *
     * @var string[]
     */
    private const ALLOWED_UPLOAD_TYPES = ['image', 'file'];

    /**
     * Allow-list of MIME types accepted for 'image' uploads.
     *
     * @var string[]
     */
    private const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    /**
     * Allow-list of extensions accepted for 'image' uploads.
     *
     * @var string[]
     */
    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    /**
     * Allow-list of MIME types accepted for 'file' uploads.
     *
     * @var string[]
     */
    private const FILE_MIME_TYPES = ['application/pdf'];

    /**
     * Allow-list of extensions accepted for 'file' uploads.
     *
     * @var string[]
     */
    private const FILE_EXTENSIONS = ['pdf'];

    /** @var BackendClient Client used for backend calls. */
    private BackendClient $client;

    /** @var string Base path where 'image' uploads are written */
    private string $photosBasePath;

    /** @var string Base path where 'file' uploads are written */
    private string $filesBasePath;

    /** @var SecurePhotoStorage Guards directory creation for 'image' uploads against path traversal. */
    private SecurePhotoStorage $photoStorage;

    /** @var SecurePhotoStorage Guards directory creation for 'file' uploads against path traversal. */
    private SecurePhotoStorage $fileStorage;

    /** @var UploadFilenameValidator Validates 'image' uploads against the image extension allow-list. */
    private UploadFilenameValidator $imageFilenameValidator;

    /** @var UploadFilenameValidator Validates 'file' uploads against the file extension allow-list. */
    private UploadFilenameValidator $fileFilenameValidator;

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
        $this->photoStorage = new SecurePhotoStorage($photosBasePath);
        $this->fileStorage = new SecurePhotoStorage($filesBasePath);
        $this->imageFilenameValidator = new UploadFilenameValidator(self::IMAGE_EXTENSIONS);
        $this->fileFilenameValidator = new UploadFilenameValidator(self::FILE_EXTENSIONS);
    }

    /**
     * Builds an UploadHandler from configuration parameters.
     *
     * @param array $params Must contain 'host' (string), 'photos_path' (string) and
     *                       'files_path' (string).
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
            $file = $this->validateUploadedFile($uploadType, $request);

            $headers = $request->headers();
            $filePath = $this->requestUploadingStatus($uploadType, $uploadId, $headers);

            $destination = $this->writeUploadedFile($uploadType, $filePath, $file);

            $this->requestUploadedStatus($uploadType, $uploadId, $headers);
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
     * Extracts the uploaded file from the request and validates it against
     * the rules for $uploadType.
     *
     * @param string           $uploadType The upload type ('image' or 'file').
     * @param RequestInterface $request    The incoming HTTP request.
     * @return array The validated raw $_FILES entry.
     * @throws UnprocessableUploadException When the file is missing or unsupported.
     */
    private function validateUploadedFile(string $uploadType, RequestInterface $request): array
    {
        $files = $request->uploadedFiles();
        $file = ($files['file'] ?? null);
        $reason = $this->rejectionReasonFor($uploadType, $file);

        if ($reason !== null) {
            throw new UnprocessableUploadException($reason, $file);
        }

        return $file;
    }

    /**
     * Calls the backend with status=uploading and returns the file_path from
     * the response.
     *
     * @param string $uploadType The upload type ('image' or 'file').
     * @param string $uploadId   The upload id.
     * @param array  $headers    Incoming request headers to forward.
     * @return string The file_path returned by the backend.
     * @throws BackendErrorException When the backend call fails, or the
     *                                response doesn't include a file_path.
     */
    private function requestUploadingStatus(string $uploadType, string $uploadId, array $headers): string
    {
        $result = $this->updateStatus($uploadType, $uploadId, 'uploading', $headers);

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
     * @param string $uploadType The upload type ('image' or 'file').
     * @param string $uploadId   The upload id.
     * @param array  $headers    Incoming request headers to forward.
     * @return void
     * @throws BackendErrorException When the backend call fails.
     */
    private function requestUploadedStatus(string $uploadType, string $uploadId, array $headers): void
    {
        $result = $this->updateStatus($uploadType, $uploadId, 'uploaded', $headers);

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $result['body']);
        }
    }

    /**
     * Updates the status of an upload via PATCH /uploads/:upload_type/:id.json.
     *
     * @param string $uploadType The upload type ('image' or 'file').
     * @param string $uploadId   The upload id.
     * @param string $status     The new status (e.g. 'uploading', 'uploaded').
     * @param array  $headers    Raw, unfiltered incoming request headers;
     *                           BackendClient filters them down to its base
     *                           allow-list plus
     *                           UploadHandler::EXTRA_ALLOWED_FORWARD_HEADERS,
     *                           overrides Content-Type to application/json
     *                           (the backend expects a JSON body regardless
     *                           of how the original multipart request was
     *                           encoded), and overrides Host/X-Forwarded-Host.
     * @return array{body: string, httpCode: int, headers: string[]}
     */
    private function updateStatus(string $uploadType, string $uploadId, string $status, array $headers): array
    {
        return $this->client->request(
            'PATCH',
            '/uploads/' . $uploadType . '/' . $uploadId . '.json',
            $headers,
            json_encode(['status' => $status]),
            self::EXTRA_ALLOWED_FORWARD_HEADERS,
            ['Content-Type' => 'application/json']
        );
    }

    /**
     * Writes the uploaded file to <basePath>/<filePath>, where basePath is
     * chosen based on $uploadType.
     *
     * The directory-level double-check performed by
     * SecurePhotoStorage::ensureDirectoryFor() (via PathTraversalGuard) only
     * verifies the containing directory's real path, since it necessarily
     * runs before the file itself exists on disk. Once file_put_contents()
     * has actually written $destination, an additional
     * PathTraversalGuard::assertRealPathWithinBase() check runs against the
     * concrete file itself, closing the gap left open by anything that could
     * happen between the directory check and the write (e.g. a symlink
     * swapped in at the last moment).
     *
     * @param string $uploadType The upload type ('image' or 'file').
     * @param string $filePath   The file_path returned by the backend.
     * @param array  $file       The raw $_FILES entry for the uploaded file.
     * @return string The full destination path the file was written to.
     * @throws InvalidArgumentException When the resolved destination would
     *                                   escape the base path for $uploadType,
     *                                   whether at the directory level or,
     *                                   once written, at the file level.
     */
    private function writeUploadedFile(string $uploadType, string $filePath, array $file): string
    {
        $basePath = $this->basePathFor($uploadType);
        $destination = $basePath . '/' . $filePath;

        Logger::error('[upload] - saving ' . $uploadType . ' file to: ' . $destination);

        $this->storageFor($uploadType)->ensureDirectoryFor($destination);

        file_put_contents($destination, file_get_contents($file['tmp_name']));

        PathTraversalGuard::assertRealPathWithinBase($basePath, $destination);

        return $destination;
    }

    /**
     * @param string $uploadType The upload type ('image' or 'file').
     * @return string The base path files of $uploadType are written under.
     */
    private function basePathFor(string $uploadType): string
    {
        return $uploadType === 'file' ? $this->filesBasePath : $this->photosBasePath;
    }

    /**
     * @param string $uploadType The upload type ('image' or 'file').
     * @return SecurePhotoStorage The storage guard for $uploadType.
     */
    private function storageFor(string $uploadType): SecurePhotoStorage
    {
        return $uploadType === 'file' ? $this->fileStorage : $this->photoStorage;
    }

    /**
     * Dispatches to the per-type rejection-reason check.
     *
     * @param string     $uploadType The upload type ('image' or 'file').
     * @param array|null $file       A single entry from $request->uploadedFiles()
     *                               (raw $_FILES format), or null when no file
     *                               was sent.
     * @return string|null One of 'missing_file', 'unsupported_mime_type',
     *                      'unsupported_extension', or null when the file is valid.
     */
    private function rejectionReasonFor(string $uploadType, ?array $file): ?string
    {
        if ($uploadType === 'file') {
            return $this->fileRejectionReason($file);
        }

        return $this->imageRejectionReason($file);
    }

    /**
     * Determines why an uploaded 'image' file would be rejected, if at all.
     *
     * Checks the MIME type and file extension independently — either one
     * can be the actual cause of rejection — so the specific reason can be
     * surfaced in both logs and the HTTP response, instead of a plain
     * boolean. The MIME type is checked first, so when both checks would
     * fail, 'unsupported_mime_type' takes precedence.
     *
     * The client-supplied MIME type and extension are trivially spoofable
     * (an attacker fully controls both the Content-Type of a multipart part
     * and the filename), so once those allow-list checks pass, the actual
     * on-disk content is additionally inspected via fileinfo — this is the
     * only one of the three checks that isn't just trusting client input.
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

        $mimeType = ($file['type'] ?? '');
        $filename = ($file['name'] ?? '');
        $tmpName  = ($file['tmp_name'] ?? '');

        if (!in_array($mimeType, self::IMAGE_MIME_TYPES, true)) {
            return 'unsupported_mime_type';
        }

        if (!$this->imageFilenameValidator->isAllowed($filename)) {
            return 'unsupported_extension';
        }

        if (!in_array($this->detectedMimeType($tmpName), self::IMAGE_MIME_TYPES, true)) {
            return 'unsupported_mime_type';
        }

        return null;
    }

    /**
     * Determines why an uploaded 'file' (PDF) would be rejected, if at all.
     *
     * Mirrors imageRejectionReason(), but validates against the 'file'
     * upload type's MIME/extension allow-list (application/pdf, .pdf only).
     * On top of the fileinfo-based content check shared with images, PDFs
     * additionally get their leading bytes checked against the well-known
     * '%PDF-' magic header, since it's cheap to check and a real PDF is
     * guaranteed to start with it.
     *
     * @param array|null $file A single entry from $request->uploadedFiles() (raw
     *                         $_FILES format), or null when no file was sent.
     * @return string|null One of 'missing_file', 'unsupported_mime_type',
     *                      'unsupported_extension', or null when the file is valid.
     */
    private function fileRejectionReason(?array $file): ?string
    {
        if ($file === null) {
            return 'missing_file';
        }

        $mimeType = ($file['type'] ?? '');
        $filename = ($file['name'] ?? '');
        $tmpName  = ($file['tmp_name'] ?? '');

        if (!in_array($mimeType, self::FILE_MIME_TYPES, true)) {
            return 'unsupported_mime_type';
        }

        if (!$this->fileFilenameValidator->isAllowed($filename)) {
            return 'unsupported_extension';
        }

        if (!in_array($this->detectedMimeType($tmpName), self::FILE_MIME_TYPES, true)) {
            return 'unsupported_mime_type';
        }

        if (!$this->hasPdfMagicBytes($tmpName)) {
            return 'unsupported_mime_type';
        }

        return null;
    }

    /**
     * Detects the actual MIME type of the file at $tmpName by inspecting its
     * content (magic bytes) via the fileinfo extension, ignoring whatever
     * Content-Type the client declared.
     *
     * @param string $tmpName Path to the uploaded file's temporary location.
     * @return string|null The detected MIME type, or null when the file
     *                      can't be opened/inspected (treated as a rejection
     *                      by the caller, i.e. fails closed).
     */
    private function detectedMimeType(string $tmpName): ?string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo === false) {
            return null;
        }

        $mimeType = finfo_file($finfo, $tmpName);
        finfo_close($finfo);

        return ($mimeType === false ? null : $mimeType);
    }

    /**
     * Checks whether the file at $tmpName starts with the '%PDF-' magic
     * header that every valid PDF file begins with.
     *
     * @param string $tmpName Path to the uploaded file's temporary location.
     * @return bool True when the file's first 5 bytes are '%PDF-'.
     */
    private function hasPdfMagicBytes(string $tmpName): bool
    {
        $handle = @fopen($tmpName, 'rb');
        if ($handle === false) {
            return false;
        }

        $header = fread($handle, 5);
        fclose($handle);

        return $header === '%PDF-';
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
