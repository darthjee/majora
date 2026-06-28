<?php

namespace Tent\RequestHandlers;

use Tent\Http\CurlHttpClient;
use Tent\Http\HttpClientInterface;
use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Handles multipart photo uploads for the PATCH /uploads/:id/submit route.
 *
 * Validates the uploaded file, orchestrates two backend PATCH calls to advance
 * the Upload state machine (uploading → uploaded), and writes the file to the
 * photos volume at /var/www/html/photos/<file_path>.
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
        string $photosBasePath = '/var/www/html/photos'
    ) {
        $this->host = $host;
        $this->httpClient = $httpClient ?? new CurlHttpClient();
        $this->photosBasePath = $photosBasePath;
    }

    /**
     * Builds a PhotoUploadHandler from configuration parameters.
     *
     * The photos base path is derived at runtime from the web server's document
     * root ($_SERVER['DOCUMENT_ROOT']), so that photos are always written
     * relative to wherever Tent is installed, regardless of the host filesystem
     * layout. Falls back to '/var/www/html/photos' when DOCUMENT_ROOT is not
     * set (e.g. during CLI test runs).
     *
     * @param array $params Must contain 'host' (string).
     * @return self
     */
    public static function build(array $params): self
    {
        $documentRoot   = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
        $photosBasePath = ($documentRoot !== '' ? $documentRoot : '/var/www/html') . '/photos';

        return new self($params['host'] ?? '', null, $photosBasePath);
    }

    /**
     * Processes the photo upload request.
     *
     * 1. Extracts the upload id from /uploads/:id/submit.
     * 2. Validates the uploaded file is a supported image type.
     * 3. Calls PATCH /uploads/:id.json with status=uploading; reads file_path from response.
     * 4. Writes the uploaded file to <photosBasePath>/<file_path>.
     * 5. Calls PATCH /uploads/:id.json with status=uploaded.
     * 6. Returns 200 on success, or forwards the error code on failure.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        // 1. Extract upload id from path: /uploads/:id/submit
        $path = $request->requestPath();
        if (!preg_match('#^/uploads/(\d+)/submit$#', $path, $matches)) {
            return new Response(['httpCode' => 400, 'body' => 'Bad Request']);
        }
        $uploadId = $matches[1];

        // 2. Validate the uploaded file
        $files = $request->uploadedFiles();
        $file = $files['file'] ?? null;
        if ($file === null || !$this->isValidImage($file)) {
            return new Response(['httpCode' => 422, 'body' => 'Unprocessable Entity']);
        }

        // 3. Build backend headers — forward all incoming headers, overriding Content-Type
        $backendHeaders = array_merge(
            $request->headers(),
            ['Content-Type' => 'application/json']
        );

        // 4. Call backend: status=uploading → receive file_path
        $uploadingResult = $this->httpClient->request(
            'PATCH',
            $this->host . '/uploads/' . $uploadId . '.json',
            $backendHeaders,
            json_encode(['status' => 'uploading'])
        );

        if ($uploadingResult['httpCode'] !== 200) {
            return new Response([
                'httpCode' => $uploadingResult['httpCode'],
                'body'     => $uploadingResult['body'],
            ]);
        }

        $body     = json_decode($uploadingResult['body'], true);
        $filePath = $body['file_path'] ?? null;
        if ($filePath === null) {
            return new Response(['httpCode' => 500, 'body' => 'Internal Server Error']);
        }

        // 5. Write file to photos volume
        $destination = $this->photosBasePath . '/' . $filePath;
        $dir = dirname($destination);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($destination, file_get_contents($file['tmp_name']));

        // 6. Call backend: status=uploaded
        $uploadedResult = $this->httpClient->request(
            'PATCH',
            $this->host . '/uploads/' . $uploadId . '.json',
            $backendHeaders,
            json_encode(['status' => 'uploaded'])
        );

        if ($uploadedResult['httpCode'] !== 200) {
            return new Response([
                'httpCode' => $uploadedResult['httpCode'],
                'body'     => $uploadedResult['body'],
            ]);
        }

        return new Response(['httpCode' => 200, 'body' => '']);
    }

    /**
     * Validates that the uploaded file is a supported image.
     *
     * Checks both the MIME type and file extension.
     *
     * @param array $file A single entry from $request->uploadedFiles() (raw $_FILES format).
     * @return bool
     */
    private function isValidImage(array $file): bool
    {
        $allowedMimeTypes  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        $mimeType = $file['type'] ?? '';
        $ext      = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));

        return in_array($mimeType, $allowedMimeTypes, true)
            && in_array($ext, $allowedExtensions, true);
    }
}
