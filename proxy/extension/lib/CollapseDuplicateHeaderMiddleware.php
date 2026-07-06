<?php

namespace Tent\Middlewares;

use Tent\Models\Response;

/**
 * Collapses a duplicated response header down to a single value.
 *
 * Tent's `default_proxy` handler may add its own value for a header that the
 * upstream backend already set (e.g. `Cache-Control`), resulting in two header
 * lines with the same name reaching the client. Sending duplicate headers such
 * as `Cache-Control` is invalid/ambiguous per HTTP semantics and leads to
 * unpredictable caching behavior by browsers and intermediate caches.
 *
 * This middleware keeps only the first occurrence of the configured header
 * (matched case-insensitively) and drops any subsequent duplicates, leaving
 * every other header line untouched and in order.
 *
 * Unlike `TestHeaderMiddleware` (a demo class not wired into any rule), real
 * Tent 0.9.1 middlewares extend `Tent\Middlewares\Middleware` and implement
 * `processResponse(Response $response): Response` — not a bespoke
 * `handle(Request, Response): void` method.
 *
 * ## Usage in configuration
 *
 * ```php
 * Configuration::buildRule([
 *     'handler' => [...],
 *     'matchers' => [...],
 *     'middlewares' => [
 *         [
 *             'class'  => 'Tent\\Middlewares\\CollapseDuplicateHeaderMiddleware',
 *             'header' => 'Cache-Control'
 *         ]
 *     ]
 * ]);
 * ```
 */
class CollapseDuplicateHeaderMiddleware extends Middleware
{
    private const DEFAULT_HEADER = 'Cache-Control';

    /**
     * @var string Name of the header to dedupe (case-insensitive).
     */
    private string $header;

    /**
     * @param string $header The name of the header to collapse duplicates of.
     */
    public function __construct(string $header = self::DEFAULT_HEADER)
    {
        $this->header = $header;
    }

    /**
     * Builds a CollapseDuplicateHeaderMiddleware instance from given attributes.
     *
     * @param array $attributes Associative array of attributes; supports an
     *                           optional 'header' key (defaults to 'Cache-Control').
     * @return CollapseDuplicateHeaderMiddleware The constructed middleware instance.
     */
    public static function build(array $attributes): CollapseDuplicateHeaderMiddleware
    {
        return new self($attributes['header'] ?? self::DEFAULT_HEADER);
    }

    /**
     * Removes duplicate occurrences of the configured header, keeping only the
     * first one found.
     *
     * @param Response $response The response to process.
     * @return Response The response, with duplicate header lines removed.
     */
    public function processResponse(Response $response): Response
    {
        $targetName = strtolower($this->header);
        $seen = false;
        $filtered = [];

        foreach ($response->headers() as $headerLine) {
            $name = strtolower(trim(strstr($headerLine, ':', true) ?: $headerLine));

            if ($name === $targetName) {
                if ($seen) {
                    continue;
                }
                $seen = true;
            }

            $filtered[] = $headerLine;
        }

        $response->setHeaders($filtered);

        return $response;
    }
}
