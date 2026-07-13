<?php

namespace Tent\Middlewares;

use Tent\Models\Response;

/**
 * Sets a `Cache-Control: max-age=<N>` response header, replacing any existing
 * occurrence of the header (case-insensitive) so the client always receives a
 * single, well-formed value.
 *
 * ## Why not `Tent\Middlewares\CacheStalenessMiddleware`?
 *
 * Tent 0.9.1's built-in `CacheStalenessMiddleware` does not set any response
 * header itself: it only schedules a background re-fetch of an
 * already-cached response (written by `FileCacheMiddleware`) from an
 * upstream `host` once the cached entry's age exceeds `maxAgeSeconds`. It is
 * a no-op unless paired with `FileCacheMiddleware` sharing the same cache
 * `location`, and it requires a `host` to re-contact — neither of which
 * exists for a rule using the `static` handler (e.g. `photos`, the
 * production `frontend` rule), since static files are read straight from
 * disk and have no upstream to refresh from. Rules like those need an
 * explicit `Cache-Control` header instead, which is what this middleware
 * provides.
 *
 * ## Usage in configuration
 *
 * ```php
 * Configuration::buildRule([
 *     'handler' => [...],
 *     'matchers' => [...],
 *     'middlewares' => [
 *         [
 *             'class' => 'Tent\\Middlewares\\CacheControlMiddleware',
 *             'maxAgeSeconds' => 60 * 60 * 24 * 7
 *         ]
 *     ]
 * ]);
 * ```
 */
class CacheControlMiddleware extends Middleware
{
    private const HEADER_NAME = 'Cache-Control';

    /**
     * @var integer Maximum age, in seconds, advertised via `max-age`.
     */
    private int $maxAgeSeconds;

    /**
     * @param integer $maxAgeSeconds Maximum age, in seconds, advertised via `max-age`.
     */
    public function __construct(int $maxAgeSeconds)
    {
        $this->maxAgeSeconds = $maxAgeSeconds;
    }

    /**
     * Builds a CacheControlMiddleware instance from given attributes.
     *
     * @param array $attributes Associative array of attributes; supports
     *                           'maxAgeSeconds' (or 'max_age_seconds').
     * @return CacheControlMiddleware The constructed middleware instance.
     */
    public static function build(array $attributes): CacheControlMiddleware
    {
        $maxAgeSeconds = (int) ($attributes['maxAgeSeconds'] ?? $attributes['max_age_seconds'] ?? 0);

        return new self($maxAgeSeconds);
    }

    /**
     * Replaces any existing `Cache-Control` header line(s) with a single
     * `Cache-Control: max-age=<N>` line, leaving every other header untouched
     * and in order.
     *
     * @param Response $response The response to process.
     * @return Response The response, with a single `Cache-Control` header set.
     */
    public function processResponse(Response $response): Response
    {
        $targetName = strtolower(self::HEADER_NAME);
        $filtered = [];

        foreach ($response->headers() as $headerLine) {
            $name = strtolower(trim(strstr($headerLine, ':', true) ?: $headerLine));

            if ($name === $targetName) {
                continue;
            }

            $filtered[] = $headerLine;
        }

        $filtered[] = self::HEADER_NAME . ': max-age=' . $this->maxAgeSeconds;

        $response->setHeaders($filtered);

        return $response;
    }
}
