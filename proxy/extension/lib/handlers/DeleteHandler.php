<?php

namespace Tent\RequestHandlers;

use InvalidArgumentException;
use Tent\Http\CurlHttpClient;
use Tent\Http\HttpClientInterface;
use Tent\Middlewares\RenameHeaderMiddleware;
use Tent\Middlewares\SetHeadersMiddleware;
use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Handles DELETE /games/:game_slug/(pcs|npcs)/:character_id/photos/:photo_id.json.
 *
 * Orchestrates photo deletion across the backend and the photos filesystem
 * volume:
 *   1. Calls GET .../photos/:photo_id/deletable.json to check the photo can
 *      be deleted and to learn the file path to remove (404 if not found,
 *      422 if not deletable — both are forwarded to the client as-is).
 *   2. Deletes the file at the returned path from the photos volume.
 *   3. Calls the backend DELETE .../photos/:photo_id.json to remove the
 *      database record, and forwards its response straight through.
 */
class DeleteHandler extends RequestHandler
{
    /** @var string Backend host URL (e.g. http://backend:8080) */
    private string $host;

    /** @var HttpClientInterface HTTP client used for backend calls */
    private HttpClientInterface $httpClient;

    /** @var string Base path photos are stored under */
    private string $photosBasePath;

    /** @var SecurePhotoStorage Guards file deletion against path traversal. */
    private SecurePhotoStorage $photoStorage;

    /**
     * @param string                   $host           Backend host URL.
     * @param HttpClientInterface|null $httpClient     HTTP client (defaults to CurlHttpClient).
     * @param string                   $photosBasePath Base directory photos are stored under.
     */
    public function __construct(
        string $host,
        ?HttpClientInterface $httpClient = null,
        string $photosBasePath = ''
    ) {
        $this->host = $host;
        $this->httpClient = ($httpClient ?? new CurlHttpClient());
        $this->photosBasePath = $photosBasePath;
        $this->photoStorage = new SecurePhotoStorage($photosBasePath);

        // See UploadHandler for why the Host header must be rewritten before
        // forwarding to the backend.
        $this->addMiddleware(new RenameHeaderMiddleware('Host', 'X-Forwarded-Host'));
        $this->addMiddleware(new SetHeadersMiddleware(['Host' => $this->backendHost()]));
    }

    /**
     * Builds a DeleteHandler from configuration parameters.
     *
     * @param array $params Must contain 'host' (string) and 'photos_path' (string).
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            ($params['host'] ?? ''),
            null,
            ($params['photos_path'] ?? '')
        );
    }

    /**
     * Processes the delete request.
     *
     * 1. Extracts game_slug, kind, character_id and photo_id from the
     *    request path.
     * 2. Calls GET .../photos/:photo_id/deletable.json; forwards the
     *    backend response as-is when it isn't a 200.
     * 3. Deletes the file at the 'path' returned by that call.
     * 4. Calls the backend DELETE .../photos/:photo_id.json and forwards
     *    its response straight through.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        try {
            $identifiers = $this->extractPathIdentifiers($request);
            $headers     = ForwardedHeaderFilter::filter($request->headers());

            $path = $this->requestDeletablePath($identifiers, $headers);

            $this->photoStorage->deleteFile($path);

            $result = $this->httpClient->request('DELETE', $this->deleteUrl($identifiers), $headers);
        } catch (BackendErrorException $e) {
            return new Response(['httpCode' => $e->httpCode(), 'body' => $e->body()]);
        } catch (InvalidArgumentException $e) {
            return new Response(['httpCode' => 400, 'body' => 'Bad Request']);
        }

        return new Response([
            'httpCode' => $result['httpCode'],
            'headers'  => ($result['headers'] ?? []),
            'body'     => $result['body'],
        ]);
    }

    /**
     * Extracts game_slug, kind ('pcs'/'npcs'), character_id and photo_id
     * from the request path
     * /games/:game_slug/(pcs|npcs)/:character_id/photos/:photo_id.json.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return array{game_slug: string, kind: string, character_id: string, photo_id: string}
     * @throws InvalidArgumentException When the path doesn't match the
     *                                   expected shape.
     */
    private function extractPathIdentifiers(RequestInterface $request): array
    {
        $path = $request->requestPath();
        if (!preg_match('#^/games/([^/]+)/(pcs|npcs)/(\d+)/photos/(\d+)\.json$#', $path, $matches)) {
            throw new InvalidArgumentException('Invalid delete path: ' . $path);
        }

        return [
            'game_slug'    => $matches[1],
            'kind'         => $matches[2],
            'character_id' => $matches[3],
            'photo_id'     => $matches[4],
        ];
    }

    /**
     * Calls the backend's deletable.json endpoint and returns the photo's
     * file path when the photo is deletable.
     *
     * @param array $identifiers As returned by extractPathIdentifiers().
     * @param array $headers    Headers to forward to the backend.
     * @return string The 'path' value from the backend's response body.
     * @throws BackendErrorException When the backend call fails, or the
     *                                response doesn't include a path.
     */
    private function requestDeletablePath(array $identifiers, array $headers): string
    {
        $result = $this->httpClient->request('GET', $this->deletableUrl($identifiers), $headers);

        if ($result['httpCode'] !== 200) {
            throw new BackendErrorException($result['httpCode'], $result['body']);
        }

        $body = json_decode($result['body'], true);
        $path = ($body['path'] ?? null);
        if ($path === null) {
            throw new BackendErrorException(500, 'Internal Server Error');
        }

        return $path;
    }

    /**
     * Builds the GET .../photos/:photo_id/deletable.json backend URL.
     *
     * @param array $identifiers As returned by extractPathIdentifiers().
     * @return string
     */
    private function deletableUrl(array $identifiers): string
    {
        return $this->host . '/games/' . $identifiers['game_slug']
            . '/' . $identifiers['kind'] . '/' . $identifiers['character_id']
            . '/photos/' . $identifiers['photo_id'] . '/deletable.json';
    }

    /**
     * Builds the DELETE .../photos/:photo_id.json backend URL.
     *
     * @param array $identifiers As returned by extractPathIdentifiers().
     * @return string
     */
    private function deleteUrl(array $identifiers): string
    {
        return $this->host . '/games/' . $identifiers['game_slug']
            . '/' . $identifiers['kind'] . '/' . $identifiers['character_id']
            . '/photos/' . $identifiers['photo_id'] . '.json';
    }

    /**
     * Derives the bare host (no scheme, no trailing path) the backend
     * actually expects in the Host header.
     *
     * @return string The backend host, e.g. 'moria-api.ffavs.net'.
     */
    private function backendHost(): string
    {
        return (parse_url($this->host, PHP_URL_HOST) ?? $this->host);
    }
}
