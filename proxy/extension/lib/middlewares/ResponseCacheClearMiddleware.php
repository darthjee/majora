<?php

namespace Tent\Middlewares;

use Tent\Models\ProcessingRequest;
use Tent\Models\Response;
use Tent\RequestHandlers\ResponseCacheClearer;

/**
 * Generic response-driven cache invalidation for proxied backend responses
 * (issue #1469).
 *
 * UploadHandler and DeleteHandler call ResponseCacheClearer themselves
 * (DeleteHandler also covers `DELETE /staff/photos/<type>/<id>.json`), but
 * any other backend mutation goes through the generic `default_proxy` rule
 * in `rules/backend.php`,
 * which forwards backend headers unchanged. This middleware closes that gap:
 *
 *   - On the response: clears every valid path listed in the backend's
 *     `X-Cache-Clear` header (2xx only, via ResponseCacheClearer) and always
 *     strips the header, so it never reaches the client.
 *   - On the request: drops any client-sent `X-Cache-Clear` header so it is
 *     never forwarded upstream. The clearing itself only ever reads response
 *     headers, so a client-sent header has no effect either way.
 *
 * ## Ordering
 *
 * Must be registered with the rule's `prependMiddlewares` (not
 * `middlewares`): `default_proxy` adds its own `FileCacheMiddleware` in the
 * handler constructor, and Tent runs response middlewares in registration
 * order, so a rule-level `middlewares` entry would only see the response
 * *after* it was written to the cache, header included. Prepended, this
 * middleware strips the header before `FileCacheMiddleware` stores the
 * response.
 *
 * ## Usage in configuration
 *
 * ```php
 * Configuration::buildRule([
 *     'handler' => ['type' => 'default_proxy', 'host' => 'http://backend:8080', 'cache' => $cache],
 *     'matchers' => [['uri' => '.json', 'type' => 'ends_with']],
 *     'prependMiddlewares' => [
 *         [
 *             'class'    => 'Tent\\Middlewares\\ResponseCacheClearMiddleware',
 *             'location' => $cache
 *         ]
 *     ]
 * ]);
 * ```
 *
 * `location` must be the folder the rule caches under. Omitted or empty, the
 * header is still stripped but nothing is cleared.
 */
class ResponseCacheClearMiddleware extends Middleware
{
    /** @var string Cache folder path ('' disables clearing). */
    private string $cachePath;

    /** @var ResponseCacheClearer Parses, validates and clears the listed paths. */
    private ResponseCacheClearer $clearer;

    /**
     * @param string $cachePath Cache folder the rule caches under; '' disables
     *                          clearing (the header is still stripped).
     */
    public function __construct(string $cachePath)
    {
        $this->cachePath = $cachePath;
        $this->clearer   = ResponseCacheClearer::forPath($cachePath);
    }

    /**
     * Builds the middleware from configuration attributes.
     *
     * @param array $attributes Supports 'location' (cache folder path).
     * @return ResponseCacheClearMiddleware
     */
    public static function build(array $attributes): ResponseCacheClearMiddleware
    {
        return new self((string) ($attributes['location'] ?? ''));
    }

    /**
     * Returns the configured cache folder path ('' when clearing is disabled).
     *
     * @return string
     */
    public function cachePath(): string
    {
        return $this->cachePath;
    }

    /**
     * Drops any client-sent X-Cache-Clear request header (case-insensitive)
     * so it is never forwarded to the backend.
     *
     * @param ProcessingRequest $request The incoming request.
     * @return ProcessingRequest
     */
    public function processRequest(ProcessingRequest $request): ProcessingRequest
    {
        foreach (array_keys($request->headers()) as $name) {
            if (strcasecmp(trim((string) $name), ResponseCacheClearer::HEADER_NAME) === 0) {
                $request->removeHeader((string) $name);
            }
        }

        return $request;
    }

    /**
     * Clears the paths listed in the backend's X-Cache-Clear header (2xx
     * only) and strips the header from the response.
     *
     * @param Response $response The backend (or cached) response.
     * @return Response The response without any X-Cache-Clear header.
     */
    public function processResponse(Response $response): Response
    {
        $headers = $response->headers();

        $this->clearer->clearFrom($headers, $response->httpCode());

        $stripped = ResponseCacheClearer::withoutHeader($headers);
        if (count($stripped) !== count($headers)) {
            $response->setHeaders($stripped);
        }

        return $response;
    }
}
