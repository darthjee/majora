<?php

namespace Tent\Middlewares;

use Tent\Models\Response;

/**
 * Sets a `Cache-Control` response header, replacing any existing occurrence
 * of the header (case-insensitive) so the client always receives a single,
 * well-formed value.
 *
 * The value is either `max-age=<N>` (from `maxAgeSeconds`) or, when a
 * `directive` is configured (e.g. `no-cache`), that directive verbatim. A
 * configured `directive` takes precedence over `maxAgeSeconds`.
 *
 * The header is set on every response regardless of status code, so a
 * `304 Not Modified` produced by a conditional `static` handler also carries
 * it.
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
 *
 * Or, to force revalidation on every request:
 *
 * ```php
 * [
 *     'class' => 'Tent\\Middlewares\\CacheControlMiddleware',
 *     'directive' => 'no-cache'
 * ]
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
     * @var string|null Literal Cache-Control directive (e.g. `no-cache`);
     *                  when set, it takes precedence over `maxAgeSeconds`.
     */
    private ?string $directive;

    /**
     * @param integer     $maxAgeSeconds Maximum age, in seconds, advertised via `max-age`.
     * @param string|null $directive     Literal directive overriding `max-age` when set.
     */
    public function __construct(int $maxAgeSeconds, ?string $directive = null)
    {
        $this->maxAgeSeconds = $maxAgeSeconds;
        $this->directive = ($directive === null || trim($directive) === '') ? null : trim($directive);
    }

    /**
     * Builds a CacheControlMiddleware instance from given attributes.
     *
     * @param array $attributes Associative array of attributes; supports
     *                          'maxAgeSeconds' (or 'max_age_seconds') and
     *                          'directive' (which takes precedence).
     * @return CacheControlMiddleware The constructed middleware instance.
     */
    public static function build(array $attributes): CacheControlMiddleware
    {
        $maxAgeSeconds = (int) ($attributes['maxAgeSeconds'] ?? $attributes['max_age_seconds'] ?? 0);
        $directive = isset($attributes['directive']) ? (string) $attributes['directive'] : null;

        return new self($maxAgeSeconds, $directive);
    }

    /**
     * Replaces any existing `Cache-Control` header line(s) with a single
     * `Cache-Control: <directive>` (or `max-age=<N>`) line, leaving every
     * other header untouched and in order.
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

        $filtered[] = self::HEADER_NAME . ': ' . $this->headerValue();

        $response->setHeaders($filtered);

        return $response;
    }

    /**
     * @return string The configured directive, or `max-age=<N>` when none is set.
     */
    private function headerValue(): string
    {
        return $this->directive ?? 'max-age=' . $this->maxAgeSeconds;
    }
}
